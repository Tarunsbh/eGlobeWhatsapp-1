import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { HotelsService } from '../hotels/hotels.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelAdminDto, CreateHotelUserDto } from './dto/update-hotel-admin.dto';

@Injectable()
export class SuperAdminService {
  private readonly logger = new Logger(SuperAdminService.name);
  private readonly MAX_FAILED = 5;
  private readonly LOCK_MINUTES = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    private readonly hotelsService: HotelsService,
  ) {}

  // ────────────────────────────────────────────────────────────────
  // AUTH
  // ────────────────────────────────────────────────────────────────

  async login(email: string, password: string, ip?: string, userAgent?: string) {
    const admin = await this.prisma.superAdmin.findUnique({ where: { email } });
    if (!admin || !admin.isActive) throw new UnauthorizedException('Invalid credentials');

    // Brute force check
    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      throw new UnauthorizedException(`Account locked until ${admin.lockedUntil.toISOString()}`);
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      const newAttempts = admin.failedAttempts + 1;
      const locked = newAttempts >= this.MAX_FAILED;
      await this.prisma.superAdmin.update({
        where: { id: admin.id },
        data: {
          failedAttempts: newAttempts,
          lockedUntil: locked
            ? new Date(Date.now() + this.LOCK_MINUTES * 60 * 1000)
            : null,
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.superAdmin.update({
      where: { id: admin.id },
      data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date(), lastLoginIp: ip ?? null },
    });

    const token = this.jwt.sign(
      { sub: admin.id, email: admin.email, role: admin.role, isSuperAdmin: true },
      { expiresIn: this.config.get('SA_JWT_EXPIRES_IN') || '8h' },
    );

    await this.audit.log({
      superAdminId: admin.id,
      action: 'super_admin.login',
      resource: 'super_admins',
      resourceId: admin.id,
      ip,
      userAgent,
    });

    const { passwordHash: _, mfaSecret: __, ...safe } = admin;
    return { token, admin: safe };
  }

  async getProfile(superAdminId: string) {
    const admin = await this.prisma.superAdmin.findUnique({ where: { id: superAdminId } });
    if (!admin) throw new UnauthorizedException();
    const { passwordHash: _, mfaSecret: __, ...safe } = admin;
    return safe;
  }

  // ────────────────────────────────────────────────────────────────
  // HOTELS CRUD
  // ────────────────────────────────────────────────────────────────

  async createHotel(dto: CreateHotelDto, actorId: string, ip?: string) {
    const exists = await this.prisma.hotel.findFirst({
      where: { OR: [{ slug: this.slugify(dto.name) }, { hotelCode: dto.hotelCode }] },
    });
    if (exists) throw new ConflictException('Hotel code or slug already exists');

    const slug = this.slugify(dto.name);
    const webhookToken = uuidv4();
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const hotel = await this.prisma.hotel.create({
      data: {
        id: uuidv4(),
        hotelCode: dto.hotelCode,
        name: dto.name,
        slug,
        contactPerson: dto.contactPerson,
        mobile: dto.mobile,
        address: dto.address,
        gstNumber: dto.gstNumber,
        phoneNumberId: dto.phoneNumberId,
        wabaId: dto.wabaId,
        businessId: dto.businessId,
        webhookVerifyToken: webhookToken,
        timezone: dto.timezone || 'Asia/Kolkata',
        country: dto.country || 'IN',
        plan: (dto.plan || 'TRIAL').toUpperCase() as any,
        billingCycle: (dto.billingCycle || 'MONTHLY').toUpperCase() as any,
        status: 'TRIAL' as any,
        trialEndsAt: trialEnd,
      },
    });

    // Create admin user for hotel
    const hash = await bcrypt.hash(dto.adminPassword, 12);
    await this.prisma.user.create({
      data: {
        id: uuidv4(),
        hotelId: hotel.id,
        email: dto.email,
        passwordHash: hash,
        name: dto.adminName,
        role: 'ADMIN' as any,
        isActive: true,
        forcePasswordChange: true,
      },
    });

    // Create trial subscription
    const trialPlan = await this.prisma.subscriptionPlan.findFirst({ where: { plan: 'TRIAL' as any } });
    if (trialPlan) {
      await this.prisma.subscription.create({
        data: {
          id: uuidv4(),
          hotelId: hotel.id,
          planId: trialPlan.id,
          status: 'TRIAL' as any,
          currentPeriodStart: new Date(),
          currentPeriodEnd: trialEnd,
          autoRenew: false,
        },
      });
    }

    // Store WhatsApp access token via shared service (same path as hotel panel)
    if (dto.accessToken) {
      await this.hotelsService.storeToken(hotel.id, {
        accessToken: dto.accessToken,
        wabaId: dto.wabaId,
        phoneNumberId: dto.phoneNumberId,
      });
    }

    await this.audit.log({
      superAdminId: actorId,
      hotelId: hotel.id,
      action: 'hotel.create',
      resource: 'hotels',
      resourceId: hotel.id,
      newValues: { name: hotel.name, hotelCode: hotel.hotelCode },
      ip,
    });

    return hotel;
  }

  async listHotels(params: {
    search?: string;
    status?: string;
    plan?: string;
    limit?: number;
    offset?: number;
  }) {
    const { search, status, plan, limit = 50, offset = 0 } = params;

    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { hotelCode: { contains: search } },
        { contactPerson: { contains: search } },
      ];
    }
    if (status) where.status = status.toUpperCase();
    if (plan) where.plan = plan.toUpperCase();

    const [hotels, total] = await Promise.all([
      this.prisma.hotel.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          subscription: { include: { plan: true } },
          _count: { select: { users: true, guests: true, campaigns: true } },
        },
      }),
      this.prisma.hotel.count({ where }),
    ]);

    return { hotels, total, limit, offset };
  }

  async getHotel(hotelId: string) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id: hotelId },
      include: {
        subscription: { include: { plan: true } },
        tokens: {
          where: { isActive: true, tokenType: 'ACCESS' as any },
          select: { id: true, isActive: true, lastUsedAt: true, createdAt: true, updatedAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            users: true,
            guests: true,
            campaigns: true,
            messages: true,
            conversations: true,
          },
        },
      },
    });
    if (!hotel) throw new NotFoundException('Hotel not found');
    return hotel;
  }

  async updateHotel(hotelId: string, dto: UpdateHotelAdminDto, actorId: string, ip?: string) {
    const hotel = await this.getHotel(hotelId);
    const old = { name: hotel.name, status: hotel.status, plan: hotel.plan };

    const updated = await this.prisma.hotel.update({
      where: { id: hotelId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.hotelCode && { hotelCode: dto.hotelCode }),
        ...(dto.contactPerson !== undefined && { contactPerson: dto.contactPerson }),
        ...(dto.mobile !== undefined && { mobile: dto.mobile }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.gstNumber !== undefined && { gstNumber: dto.gstNumber }),
        ...(dto.phoneNumberId && { phoneNumberId: dto.phoneNumberId }),
        ...(dto.wabaId && { wabaId: dto.wabaId }),
        ...(dto.timezone && { timezone: dto.timezone }),
        ...(dto.country && { country: dto.country }),
        ...(dto.plan && { plan: dto.plan.toUpperCase() as any }),
        ...(dto.billingCycle && { billingCycle: dto.billingCycle.toUpperCase() as any }),
        ...(dto.status && { status: dto.status.toUpperCase() as any }),
        ...(dto.status === 'suspended' && {
          suspendedAt: new Date(),
          suspensionReason: dto.suspensionReason,
        }),
        ...(dto.status && dto.status !== 'suspended' && {
          suspendedAt: null,
          suspensionReason: null,
        }),
      },
    });

    // Update access token via shared service (same code path as hotel panel)
    if (dto.accessToken) {
      await this.hotelsService.storeToken(hotelId, {
        accessToken: dto.accessToken,
        wabaId: dto.wabaId,
        phoneNumberId: dto.phoneNumberId,
      });
    }

    await this.audit.log({
      superAdminId: actorId,
      hotelId,
      action: 'hotel.update',
      resource: 'hotels',
      resourceId: hotelId,
      oldValues: old,
      newValues: { name: updated.name, status: updated.status, plan: updated.plan },
      ip,
    });

    return updated;
  }

  async suspendHotel(hotelId: string, reason: string, actorId: string, ip?: string) {
    await this.getHotel(hotelId);
    const updated = await this.prisma.hotel.update({
      where: { id: hotelId },
      data: { status: 'SUSPENDED' as any, suspendedAt: new Date(), suspensionReason: reason },
    });
    await this.audit.log({ superAdminId: actorId, hotelId, action: 'hotel.suspend', resource: 'hotels', resourceId: hotelId, newValues: { reason }, ip });
    return updated;
  }

  async activateHotel(hotelId: string, actorId: string, ip?: string) {
    await this.getHotel(hotelId);
    const updated = await this.prisma.hotel.update({
      where: { id: hotelId },
      data: { status: 'ACTIVE' as any, suspendedAt: null, suspensionReason: null },
    });
    await this.audit.log({ superAdminId: actorId, hotelId, action: 'hotel.activate', resource: 'hotels', resourceId: hotelId, ip });
    return updated;
  }

  async deleteHotel(hotelId: string, actorId: string, ip?: string) {
    await this.getHotel(hotelId);
    const deleted = await this.prisma.hotel.update({
      where: { id: hotelId },
      data: { deletedAt: new Date(), status: 'SUSPENDED' as any },
    });
    await this.audit.log({ superAdminId: actorId, hotelId, action: 'hotel.delete', resource: 'hotels', resourceId: hotelId, ip });
    return { deleted: true };
  }

  // ────────────────────────────────────────────────────────────────
  // HOTEL USERS
  // ────────────────────────────────────────────────────────────────

  async listHotelUsers(hotelId: string) {
    await this.getHotel(hotelId);
    return this.prisma.user.findMany({
      where: { hotelId, deletedAt: null },
      select: {
        id: true, email: true, name: true, role: true, phone: true,
        isActive: true, forcePasswordChange: true, mfaEnabled: true,
        failedAttempts: true, lockedUntil: true, lastLoginAt: true,
        lastLoginIp: true, createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createHotelUser(hotelId: string, dto: CreateHotelUserDto, actorId: string, ip?: string) {
    await this.getHotel(hotelId);

    const exists = await this.prisma.user.findFirst({ where: { email: dto.email, hotelId, deletedAt: null } });
    if (exists) throw new ConflictException('Email already exists in this hotel');

    const hash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        id: uuidv4(),
        hotelId,
        email: dto.email,
        name: dto.name,
        passwordHash: hash,
        role: dto.role.toUpperCase() as any,
        phone: dto.phone,
        isActive: true,
        forcePasswordChange: dto.forcePasswordChange ?? true,
      },
    });

    await this.audit.log({ superAdminId: actorId, hotelId, action: 'user.create', resource: 'users', resourceId: user.id, newValues: { email: user.email, role: user.role }, ip });

    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  async resetUserPassword(hotelId: string, userId: string, newPassword: string, actorId: string, ip?: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, hotelId, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');

    const hash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hash, forcePasswordChange: true, failedAttempts: 0, lockedUntil: null },
    });

    await this.audit.log({ superAdminId: actorId, hotelId, action: 'user.password_reset', resource: 'users', resourceId: userId, ip });
    return { message: 'Password reset successfully' };
  }

  async toggleUserStatus(hotelId: string, userId: string, enable: boolean, actorId: string, ip?: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, hotelId, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: enable, ...(enable && { failedAttempts: 0, lockedUntil: null }) },
    });

    await this.audit.log({ superAdminId: actorId, hotelId, action: enable ? 'user.enable' : 'user.disable', resource: 'users', resourceId: userId, ip });
    return updated;
  }

  async deleteHotelUser(hotelId: string, userId: string, actorId: string, ip?: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, hotelId, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date(), isActive: false } });
    await this.audit.log({ superAdminId: actorId, hotelId, action: 'user.delete', resource: 'users', resourceId: userId, ip });
    return { deleted: true };
  }

  // ────────────────────────────────────────────────────────────────
  // SUBSCRIPTIONS
  // ────────────────────────────────────────────────────────────────

  async getSubscriptionPlans() {
    return this.prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { monthlyPrice: 'asc' } });
  }

  async getHotelSubscription(hotelId: string) {
    return this.prisma.subscription.findUnique({
      where: { hotelId },
      include: { plan: true },
    });
  }

  async updateSubscription(
    hotelId: string,
    planId: string,
    billingCycle: string,
    actorId: string,
    ip?: string,
  ) {
    await this.getHotel(hotelId);
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Subscription plan not found');

    const periodMonths = billingCycle === 'annual' ? 12 : billingCycle === 'quarterly' ? 3 : 1;
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + periodMonths);

    const sub = await this.prisma.subscription.upsert({
      where: { hotelId },
      create: {
        id: uuidv4(),
        hotelId,
        planId,
        status: 'ACTIVE' as any,
        billingCycle: billingCycle.toUpperCase() as any,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        autoRenew: true,
      },
      update: {
        planId,
        status: 'ACTIVE' as any,
        billingCycle: billingCycle.toUpperCase() as any,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      include: { plan: true },
    });

    // Sync hotel plan
    await this.prisma.hotel.update({ where: { id: hotelId }, data: { plan: plan.plan, status: 'ACTIVE' as any } });

    await this.audit.log({ superAdminId: actorId, hotelId, action: 'subscription.update', resource: 'subscriptions', resourceId: sub.id, newValues: { plan: plan.name, billingCycle }, ip });
    return sub;
  }

  // ────────────────────────────────────────────────────────────────
  // BILLING
  // ────────────────────────────────────────────────────────────────

  async generateInvoice(
    hotelId: string,
    params: { amount: number; description: string; taxPercent?: number; dueDate?: Date },
    actorId: string,
    ip?: string,
  ) {
    await this.getHotel(hotelId);
    const invoiceNumber = await this.nextInvoiceNumber();
    const taxPct = params.taxPercent ?? 18;
    const tax = Math.round(params.amount * taxPct / 100);
    const total = params.amount + tax;
    const dueDate = params.dueDate ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invoice = await this.prisma.invoice.create({
      data: {
        id: uuidv4(),
        invoiceNumber,
        hotelId,
        subtotal: params.amount,
        taxAmount: tax,
        taxPercent: taxPct,
        total,
        currency: 'INR',
        status: 'DRAFT' as any,
        dueDate,
        lineItems: [{ description: params.description, amount: params.amount }],
      },
    });

    await this.audit.log({ superAdminId: actorId, hotelId, action: 'invoice.create', resource: 'invoices', resourceId: invoice.id, newValues: { invoiceNumber, total }, ip });
    return invoice;
  }

  async listInvoices(hotelId?: string, status?: string) {
    return this.prisma.invoice.findMany({
      where: {
        ...(hotelId && { hotelId }),
        ...(status && { status: status.toUpperCase() as any }),
      },
      include: { hotel: { select: { name: true, hotelCode: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async updateInvoiceStatus(invoiceId: string, status: string, actorId: string, ip?: string) {
    const inv = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!inv) throw new NotFoundException('Invoice not found');

    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: status.toUpperCase() as any,
        ...(status === 'paid' && { paidAt: new Date() }),
        ...(status === 'sent' && { sentAt: new Date() }),
      },
    });

    await this.audit.log({ superAdminId: actorId, hotelId: inv.hotelId, action: 'invoice.status_update', resource: 'invoices', resourceId: invoiceId, oldValues: { status: inv.status }, newValues: { status }, ip });
    return updated;
  }

  // ────────────────────────────────────────────────────────────────
  // SYSTEM MONITORING
  // ────────────────────────────────────────────────────────────────

  async getSystemStats() {
    const [
      totalHotels,
      activeHotels,
      suspendedHotels,
      trialHotels,
      totalUsers,
      activeUsers,
      totalMessages,
      failedMessages,
      totalCampaigns,
      revenueResult,
      pendingInvoices,
    ] = await Promise.all([
      this.prisma.hotel.count({ where: { deletedAt: null } }),
      this.prisma.hotel.count({ where: { status: 'ACTIVE' as any, deletedAt: null } }),
      this.prisma.hotel.count({ where: { status: 'SUSPENDED' as any, deletedAt: null } }),
      this.prisma.hotel.count({ where: { status: 'TRIAL' as any, deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.message.count(),
      this.prisma.message.count({ where: { status: 'FAILED' as any } }),
      this.prisma.campaign.count({ where: { deletedAt: null } }),
      this.prisma.invoice.aggregate({ where: { status: 'PAID' as any }, _sum: { total: true } }),
      this.prisma.invoice.count({ where: { status: 'OVERDUE' as any } }),
    ]);

    // Monthly revenue (current month)
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const monthlyRevenue = await this.prisma.invoice.aggregate({
      where: { status: 'PAID' as any, paidAt: { gte: monthStart } },
      _sum: { total: true },
    });

    // Messages this month
    const msgsThisMonth = await this.prisma.message.count({
      where: { createdAt: { gte: monthStart } },
    });

    return {
      hotels: { total: totalHotels, active: activeHotels, suspended: suspendedHotels, trial: trialHotels },
      users: { total: totalUsers, active: activeUsers },
      messages: { total: totalMessages, failed: failedMessages, thisMonth: msgsThisMonth },
      campaigns: { total: totalCampaigns },
      revenue: {
        total: revenueResult._sum.total ?? 0,
        monthly: monthlyRevenue._sum.total ?? 0,
      },
      invoices: { overdue: pendingInvoices },
    };
  }

  async getRecentActivity(limit = 50) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        hotel: { select: { name: true, hotelCode: true } },
        user: { select: { name: true, email: true } },
        superAdmin: { select: { name: true, email: true } },
      },
    });
  }

  async getHotelGrowth() {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });

    const data = await Promise.all(
      months.map(async ({ year, month }) => {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);
        const count = await this.prisma.hotel.count({ where: { createdAt: { gte: start, lt: end }, deletedAt: null } });
        return { label: `${year}-${String(month).padStart(2, '0')}`, count };
      }),
    );
    return data;
  }

  // ────────────────────────────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────────────────────────────

  // ────────────────────────────────────────────────────────────────
  // MESSAGE PRICING
  // ────────────────────────────────────────────────────────────────

  async getMessagePricing() {
    return this.prisma.messagePricing.findMany({ orderBy: { messageType: 'asc' } });
  }

  async updateMessagePricing(
    id: string,
    dto: { metaBasePrice: number; markupAmount: number; notes?: string },
    actorId: string,
    ip?: string,
  ) {
    const sellingPrice = dto.metaBasePrice + dto.markupAmount;
    const updated = await this.prisma.messagePricing.update({
      where: { id },
      data: {
        metaBasePrice: dto.metaBasePrice,
        markupAmount: dto.markupAmount,
        sellingPrice,
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
    await this.audit.log({
      superAdminId: actorId,
      action: 'pricing.update',
      resource: 'message_pricing',
      resourceId: id,
      newValues: { metaBasePrice: dto.metaBasePrice, markupAmount: dto.markupAmount, sellingPrice },
      ip,
    });
    return updated;
  }

  // ────────────────────────────────────────────────────────────────
  // USAGE / BILLING
  // ────────────────────────────────────────────────────────────────

  async getHotelUsage(hotelId: string, month?: string) {
    const billingMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM
    const usages = await this.prisma.messageUsage.findMany({
      where: { hotelId, billingMonth },
      orderBy: { createdAt: 'desc' },
    });

    const summary = usages.reduce(
      (acc, u) => {
        acc.totalMessages += 1;
        acc.totalMetaCost += u.metaCost;
        acc.totalMarkup += u.markup;
        acc.totalSellingPrice += u.sellingPrice;
        acc.byType[u.messageType] = (acc.byType[u.messageType] || 0) + 1;
        return acc;
      },
      { totalMessages: 0, totalMetaCost: 0, totalMarkup: 0, totalSellingPrice: 0, byType: {} as Record<string, number> },
    );

    return {
      billingMonth,
      hotelId,
      totalMessages: summary.totalMessages,
      totalMetaCost: summary.totalMetaCost,
      totalMarkup: summary.totalMarkup,
      totalCost: summary.totalSellingPrice,
      byType: summary.byType,
      usages,
    };
  }

  async getAllHotelsUsageSummary(month?: string) {
    const billingMonth = month || new Date().toISOString().slice(0, 7);
    const rows = await this.prisma.messageUsage.groupBy({
      by: ['hotelId'],
      where: { billingMonth },
      _sum: { sellingPrice: true, metaCost: true, markup: true },
      _count: { id: true },
    });

    const hotelIds = rows.map((r) => r.hotelId);
    const hotels = await this.prisma.hotel.findMany({
      where: { id: { in: hotelIds } },
      select: { id: true, name: true, hotelCode: true, plan: true },
    });
    const hotelMap = Object.fromEntries(hotels.map((h) => [h.id, h]));

    // Check which hotels have already been invoiced for this month
    const invoiced = await this.prisma.messageUsage.findMany({
      where: { billingMonth, hotelId: { in: hotelIds }, invoiceId: { not: null } },
      select: { hotelId: true, invoiceId: true },
      distinct: ['hotelId'],
    });
    const invoiceMap = Object.fromEntries(invoiced.map((i) => [i.hotelId, i.invoiceId]));

    const hotelRows = rows.map((r) => ({
      hotelId: r.hotelId,
      hotelName: hotelMap[r.hotelId]?.name || r.hotelId,
      hotelCode: hotelMap[r.hotelId]?.hotelCode,
      totalMessages: r._count.id,
      totalMetaCost: r._sum.metaCost ?? 0,
      totalMarkup: r._sum.markup ?? 0,
      totalCost: r._sum.sellingPrice ?? 0,
      invoiceId: invoiceMap[r.hotelId] || null,
    }));

    return {
      billingMonth,
      hotels: hotelRows,
      totals: {
        totalMessages: hotelRows.reduce((s, r) => s + r.totalMessages, 0),
        totalMetaCost: hotelRows.reduce((s, r) => s + r.totalMetaCost, 0),
        totalMarkup: hotelRows.reduce((s, r) => s + r.totalMarkup, 0),
        totalCost: hotelRows.reduce((s, r) => s + r.totalCost, 0),
      },
    };
  }

  async generateUsageInvoice(
    hotelId: string,
    dto: { month?: string; includeSubscription?: boolean; taxPercent?: number },
    actorId: string,
    ip?: string,
  ) {
    const hotel = await this.getHotel(hotelId);
    const billingMonth = dto.month || new Date().toISOString().slice(0, 7);
    const taxPct = dto.taxPercent ?? 18;

    // Sum unbilled usage for the month
    const unbilledUsage = await this.prisma.messageUsage.findMany({
      where: { hotelId, billingMonth, invoiceId: null },
    });
    const usageAmount = unbilledUsage.reduce((s, u) => s + u.sellingPrice, 0);

    // Optionally include subscription fee
    let subscriptionAmount = 0;
    let description = `Message usage charges — ${billingMonth}`;
    if (dto.includeSubscription) {
      const sub = await this.prisma.subscription.findUnique({
        where: { hotelId },
        include: { plan: true },
      });
      if (sub?.plan) {
        subscriptionAmount = sub.billingCycle === 'ANNUAL'
          ? Math.round(sub.plan.annualPrice / 12)
          : sub.plan.monthlyPrice;
        description = `Subscription + message usage — ${billingMonth}`;
      }
    }

    const subtotal = usageAmount + subscriptionAmount;
    if (subtotal === 0) throw new BadRequestException('No unbilled usage found for this period');

    const taxAmount = Math.round(subtotal * taxPct / 100);
    const total = subtotal + taxAmount;
    const invoiceNumber = await this.nextInvoiceNumber();
    const dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    const invoice = await this.prisma.invoice.create({
      data: {
        id: uuidv4(),
        hotelId,
        invoiceNumber,
        notes: description,
        subtotal,
        taxPercent: taxPct,
        taxAmount,
        total,
        currency: 'INR',
        status: 'DRAFT' as any,
        dueDate,
        lineItems: {
          usageAmount,
          usageMessages: unbilledUsage.length,
          subscriptionAmount,
          byType: unbilledUsage.reduce((acc, u) => {
            acc[u.messageType] = (acc[u.messageType] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        },
      },
    });

    // Link all usage rows to this invoice
    if (unbilledUsage.length > 0) {
      await this.prisma.messageUsage.updateMany({
        where: { hotelId, billingMonth, invoiceId: null },
        data: { invoiceId: invoice.id },
      });
    }

    await this.audit.log({
      superAdminId: actorId,
      hotelId,
      action: 'invoice.generate_usage',
      resource: 'invoices',
      resourceId: invoice.id,
      newValues: { invoiceNumber, total, billingMonth },
      ip,
    });

    return invoice;
  }

  private slugify(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  private async nextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count({ where: { invoiceNumber: { startsWith: `INV-${year}` } } });
    return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
  }
}
