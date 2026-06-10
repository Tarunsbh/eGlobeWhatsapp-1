"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SuperAdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcryptjs");
const uuid_1 = require("uuid");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const hotels_service_1 = require("../hotels/hotels.service");
let SuperAdminService = SuperAdminService_1 = class SuperAdminService {
    constructor(prisma, jwt, config, audit, hotelsService) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.audit = audit;
        this.hotelsService = hotelsService;
        this.logger = new common_1.Logger(SuperAdminService_1.name);
        this.MAX_FAILED = 5;
        this.LOCK_MINUTES = 30;
    }
    async login(email, password, ip, userAgent) {
        const admin = await this.prisma.superAdmin.findUnique({ where: { email } });
        if (!admin || !admin.isActive)
            throw new common_1.UnauthorizedException('Invalid credentials');
        if (admin.lockedUntil && admin.lockedUntil > new Date()) {
            throw new common_1.UnauthorizedException(`Account locked until ${admin.lockedUntil.toISOString()}`);
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
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.prisma.superAdmin.update({
            where: { id: admin.id },
            data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date(), lastLoginIp: ip ?? null },
        });
        const token = this.jwt.sign({ sub: admin.id, email: admin.email, role: admin.role, isSuperAdmin: true }, { expiresIn: this.config.get('SA_JWT_EXPIRES_IN') || '8h' });
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
    async getProfile(superAdminId) {
        const admin = await this.prisma.superAdmin.findUnique({ where: { id: superAdminId } });
        if (!admin)
            throw new common_1.UnauthorizedException();
        const { passwordHash: _, mfaSecret: __, ...safe } = admin;
        return safe;
    }
    async createHotel(dto, actorId, ip) {
        const exists = await this.prisma.hotel.findFirst({
            where: { OR: [{ slug: this.slugify(dto.name) }, { hotelCode: dto.hotelCode }] },
        });
        if (exists)
            throw new common_1.ConflictException('Hotel code or slug already exists');
        const slug = this.slugify(dto.name);
        const webhookToken = (0, uuid_1.v4)();
        const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        const hotel = await this.prisma.hotel.create({
            data: {
                id: (0, uuid_1.v4)(),
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
                plan: (dto.plan || 'TRIAL').toUpperCase(),
                billingCycle: (dto.billingCycle || 'MONTHLY').toUpperCase(),
                status: 'TRIAL',
                trialEndsAt: trialEnd,
            },
        });
        const hash = await bcrypt.hash(dto.adminPassword, 12);
        await this.prisma.user.create({
            data: {
                id: (0, uuid_1.v4)(),
                hotelId: hotel.id,
                email: dto.email,
                passwordHash: hash,
                name: dto.adminName,
                role: 'ADMIN',
                isActive: true,
                forcePasswordChange: true,
            },
        });
        const trialPlan = await this.prisma.subscriptionPlan.findFirst({ where: { plan: 'TRIAL' } });
        if (trialPlan) {
            await this.prisma.subscription.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    hotelId: hotel.id,
                    planId: trialPlan.id,
                    status: 'TRIAL',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: trialEnd,
                    autoRenew: false,
                },
            });
        }
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
    async listHotels(params) {
        const { search, status, plan, limit = 50, offset = 0 } = params;
        const where = { deletedAt: null };
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { hotelCode: { contains: search } },
                { contactPerson: { contains: search } },
            ];
        }
        if (status)
            where.status = status.toUpperCase();
        if (plan)
            where.plan = plan.toUpperCase();
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
    async getHotel(hotelId) {
        const hotel = await this.prisma.hotel.findUnique({
            where: { id: hotelId },
            include: {
                subscription: { include: { plan: true } },
                tokens: {
                    where: { isActive: true, tokenType: 'ACCESS' },
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
        if (!hotel)
            throw new common_1.NotFoundException('Hotel not found');
        return hotel;
    }
    async updateHotel(hotelId, dto, actorId, ip) {
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
                ...(dto.plan && { plan: dto.plan.toUpperCase() }),
                ...(dto.billingCycle && { billingCycle: dto.billingCycle.toUpperCase() }),
                ...(dto.status && { status: dto.status.toUpperCase() }),
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
    async suspendHotel(hotelId, reason, actorId, ip) {
        await this.getHotel(hotelId);
        const updated = await this.prisma.hotel.update({
            where: { id: hotelId },
            data: { status: 'SUSPENDED', suspendedAt: new Date(), suspensionReason: reason },
        });
        await this.audit.log({ superAdminId: actorId, hotelId, action: 'hotel.suspend', resource: 'hotels', resourceId: hotelId, newValues: { reason }, ip });
        return updated;
    }
    async activateHotel(hotelId, actorId, ip) {
        await this.getHotel(hotelId);
        const updated = await this.prisma.hotel.update({
            where: { id: hotelId },
            data: { status: 'ACTIVE', suspendedAt: null, suspensionReason: null },
        });
        await this.audit.log({ superAdminId: actorId, hotelId, action: 'hotel.activate', resource: 'hotels', resourceId: hotelId, ip });
        return updated;
    }
    async deleteHotel(hotelId, actorId, ip) {
        await this.getHotel(hotelId);
        const deleted = await this.prisma.hotel.update({
            where: { id: hotelId },
            data: { deletedAt: new Date(), status: 'SUSPENDED' },
        });
        await this.audit.log({ superAdminId: actorId, hotelId, action: 'hotel.delete', resource: 'hotels', resourceId: hotelId, ip });
        return { deleted: true };
    }
    async listHotelUsers(hotelId) {
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
    async createHotelUser(hotelId, dto, actorId, ip) {
        await this.getHotel(hotelId);
        const exists = await this.prisma.user.findFirst({ where: { email: dto.email, hotelId, deletedAt: null } });
        if (exists)
            throw new common_1.ConflictException('Email already exists in this hotel');
        const hash = await bcrypt.hash(dto.password, 12);
        const user = await this.prisma.user.create({
            data: {
                id: (0, uuid_1.v4)(),
                hotelId,
                email: dto.email,
                name: dto.name,
                passwordHash: hash,
                role: dto.role.toUpperCase(),
                phone: dto.phone,
                isActive: true,
                forcePasswordChange: dto.forcePasswordChange ?? true,
            },
        });
        await this.audit.log({ superAdminId: actorId, hotelId, action: 'user.create', resource: 'users', resourceId: user.id, newValues: { email: user.email, role: user.role }, ip });
        const { passwordHash: _, ...safe } = user;
        return safe;
    }
    async resetUserPassword(hotelId, userId, newPassword, actorId, ip) {
        const user = await this.prisma.user.findFirst({ where: { id: userId, hotelId, deletedAt: null } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const hash = await bcrypt.hash(newPassword, 12);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: hash, forcePasswordChange: true, failedAttempts: 0, lockedUntil: null },
        });
        await this.audit.log({ superAdminId: actorId, hotelId, action: 'user.password_reset', resource: 'users', resourceId: userId, ip });
        return { message: 'Password reset successfully' };
    }
    async toggleUserStatus(hotelId, userId, enable, actorId, ip) {
        const user = await this.prisma.user.findFirst({ where: { id: userId, hotelId, deletedAt: null } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { isActive: enable, ...(enable && { failedAttempts: 0, lockedUntil: null }) },
        });
        await this.audit.log({ superAdminId: actorId, hotelId, action: enable ? 'user.enable' : 'user.disable', resource: 'users', resourceId: userId, ip });
        return updated;
    }
    async deleteHotelUser(hotelId, userId, actorId, ip) {
        const user = await this.prisma.user.findFirst({ where: { id: userId, hotelId, deletedAt: null } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        await this.prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date(), isActive: false } });
        await this.audit.log({ superAdminId: actorId, hotelId, action: 'user.delete', resource: 'users', resourceId: userId, ip });
        return { deleted: true };
    }
    async getSubscriptionPlans() {
        return this.prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { monthlyPrice: 'asc' } });
    }
    async getHotelSubscription(hotelId) {
        return this.prisma.subscription.findUnique({
            where: { hotelId },
            include: { plan: true },
        });
    }
    async updateSubscription(hotelId, planId, billingCycle, actorId, ip) {
        await this.getHotel(hotelId);
        const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
        if (!plan)
            throw new common_1.NotFoundException('Subscription plan not found');
        const periodMonths = billingCycle === 'annual' ? 12 : billingCycle === 'quarterly' ? 3 : 1;
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + periodMonths);
        const sub = await this.prisma.subscription.upsert({
            where: { hotelId },
            create: {
                id: (0, uuid_1.v4)(),
                hotelId,
                planId,
                status: 'ACTIVE',
                billingCycle: billingCycle.toUpperCase(),
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                autoRenew: true,
            },
            update: {
                planId,
                status: 'ACTIVE',
                billingCycle: billingCycle.toUpperCase(),
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
            },
            include: { plan: true },
        });
        await this.prisma.hotel.update({ where: { id: hotelId }, data: { plan: plan.plan, status: 'ACTIVE' } });
        await this.audit.log({ superAdminId: actorId, hotelId, action: 'subscription.update', resource: 'subscriptions', resourceId: sub.id, newValues: { plan: plan.name, billingCycle }, ip });
        return sub;
    }
    async generateInvoice(hotelId, params, actorId, ip) {
        await this.getHotel(hotelId);
        const invoiceNumber = await this.nextInvoiceNumber();
        const taxPct = params.taxPercent ?? 18;
        const tax = Math.round(params.amount * taxPct / 100);
        const total = params.amount + tax;
        const dueDate = params.dueDate ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const invoice = await this.prisma.invoice.create({
            data: {
                id: (0, uuid_1.v4)(),
                invoiceNumber,
                hotelId,
                subtotal: params.amount,
                taxAmount: tax,
                taxPercent: taxPct,
                total,
                currency: 'INR',
                status: 'DRAFT',
                dueDate,
                lineItems: [{ description: params.description, amount: params.amount }],
            },
        });
        await this.audit.log({ superAdminId: actorId, hotelId, action: 'invoice.create', resource: 'invoices', resourceId: invoice.id, newValues: { invoiceNumber, total }, ip });
        return invoice;
    }
    async listInvoices(hotelId, status) {
        return this.prisma.invoice.findMany({
            where: {
                ...(hotelId && { hotelId }),
                ...(status && { status: status.toUpperCase() }),
            },
            include: { hotel: { select: { name: true, hotelCode: true } } },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
    }
    async updateInvoiceStatus(invoiceId, status, actorId, ip) {
        const inv = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
        if (!inv)
            throw new common_1.NotFoundException('Invoice not found');
        const updated = await this.prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                status: status.toUpperCase(),
                ...(status === 'paid' && { paidAt: new Date() }),
                ...(status === 'sent' && { sentAt: new Date() }),
            },
        });
        await this.audit.log({ superAdminId: actorId, hotelId: inv.hotelId, action: 'invoice.status_update', resource: 'invoices', resourceId: invoiceId, oldValues: { status: inv.status }, newValues: { status }, ip });
        return updated;
    }
    async getSystemStats() {
        const [totalHotels, activeHotels, suspendedHotels, trialHotels, totalUsers, activeUsers, totalMessages, failedMessages, totalCampaigns, revenueResult, pendingInvoices,] = await Promise.all([
            this.prisma.hotel.count({ where: { deletedAt: null } }),
            this.prisma.hotel.count({ where: { status: 'ACTIVE', deletedAt: null } }),
            this.prisma.hotel.count({ where: { status: 'SUSPENDED', deletedAt: null } }),
            this.prisma.hotel.count({ where: { status: 'TRIAL', deletedAt: null } }),
            this.prisma.user.count({ where: { deletedAt: null } }),
            this.prisma.user.count({ where: { isActive: true, deletedAt: null } }),
            this.prisma.message.count(),
            this.prisma.message.count({ where: { status: 'FAILED' } }),
            this.prisma.campaign.count({ where: { deletedAt: null } }),
            this.prisma.invoice.aggregate({ where: { status: 'PAID' }, _sum: { total: true } }),
            this.prisma.invoice.count({ where: { status: 'OVERDUE' } }),
        ]);
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const monthlyRevenue = await this.prisma.invoice.aggregate({
            where: { status: 'PAID', paidAt: { gte: monthStart } },
            _sum: { total: true },
        });
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
        const data = await Promise.all(months.map(async ({ year, month }) => {
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 1);
            const count = await this.prisma.hotel.count({ where: { createdAt: { gte: start, lt: end }, deletedAt: null } });
            return { label: `${year}-${String(month).padStart(2, '0')}`, count };
        }));
        return data;
    }
    async getMessagePricing() {
        return this.prisma.messagePricing.findMany({ orderBy: { messageType: 'asc' } });
    }
    async updateMessagePricing(id, dto, actorId, ip) {
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
    async getHotelUsage(hotelId, month) {
        const billingMonth = month || new Date().toISOString().slice(0, 7);
        const usages = await this.prisma.messageUsage.findMany({
            where: { hotelId, billingMonth },
            orderBy: { createdAt: 'desc' },
        });
        const summary = usages.reduce((acc, u) => {
            acc.totalMessages += 1;
            acc.totalMetaCost += u.metaCost;
            acc.totalMarkup += u.markup;
            acc.totalSellingPrice += u.sellingPrice;
            acc.byType[u.messageType] = (acc.byType[u.messageType] || 0) + 1;
            return acc;
        }, { totalMessages: 0, totalMetaCost: 0, totalMarkup: 0, totalSellingPrice: 0, byType: {} });
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
    async getAllHotelsUsageSummary(month) {
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
    async generateUsageInvoice(hotelId, dto, actorId, ip) {
        const hotel = await this.getHotel(hotelId);
        const billingMonth = dto.month || new Date().toISOString().slice(0, 7);
        const taxPct = dto.taxPercent ?? 18;
        const unbilledUsage = await this.prisma.messageUsage.findMany({
            where: { hotelId, billingMonth, invoiceId: null },
        });
        const usageAmount = unbilledUsage.reduce((s, u) => s + u.sellingPrice, 0);
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
        if (subtotal === 0)
            throw new common_1.BadRequestException('No unbilled usage found for this period');
        const taxAmount = Math.round(subtotal * taxPct / 100);
        const total = subtotal + taxAmount;
        const invoiceNumber = await this.nextInvoiceNumber();
        const dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
        const invoice = await this.prisma.invoice.create({
            data: {
                id: (0, uuid_1.v4)(),
                hotelId,
                invoiceNumber,
                notes: description,
                subtotal,
                taxPercent: taxPct,
                taxAmount,
                total,
                currency: 'INR',
                status: 'DRAFT',
                dueDate,
                lineItems: {
                    usageAmount,
                    usageMessages: unbilledUsage.length,
                    subscriptionAmount,
                    byType: unbilledUsage.reduce((acc, u) => {
                        acc[u.messageType] = (acc[u.messageType] || 0) + 1;
                        return acc;
                    }, {}),
                },
            },
        });
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
    slugify(name) {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    async nextInvoiceNumber() {
        const year = new Date().getFullYear();
        const count = await this.prisma.invoice.count({ where: { invoiceNumber: { startsWith: `INV-${year}` } } });
        return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
    }
};
exports.SuperAdminService = SuperAdminService;
exports.SuperAdminService = SuperAdminService = SuperAdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        audit_service_1.AuditService,
        hotels_service_1.HotelsService])
], SuperAdminService);
//# sourceMappingURL=super-admin.service.js.map