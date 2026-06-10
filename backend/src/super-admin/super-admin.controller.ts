import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { SuperAdminService } from './super-admin.service';
import { AuditService } from '../audit/audit.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelAdminDto, CreateHotelUserDto } from './dto/update-hotel-admin.dto';

@ApiTags('super-admin')
@ApiBearerAuth()
@UseGuards(SuperAdminGuard)
@Controller('super-admin')
export class SuperAdminController {
  constructor(
    private readonly svc: SuperAdminService,
    private readonly audit: AuditService,
  ) {}

  // ── Auth ──────────────────────────────────────────────────────
  @Get('auth/me')
  @ApiOperation({ summary: 'Super admin profile' })
  me(@Request() req: any) {
    return this.svc.getProfile(req.superAdmin.sub);
  }

  // ── System monitoring ──────────────────────────────────────
  @Get('dashboard')
  @ApiOperation({ summary: 'System-wide statistics' })
  dashboard() {
    return this.svc.getSystemStats();
  }

  @Get('dashboard/activity')
  @ApiOperation({ summary: 'Recent audit activity' })
  activity(@Query('limit') limit?: string) {
    return this.svc.getRecentActivity(limit ? +limit : 50);
  }

  @Get('dashboard/growth')
  @ApiOperation({ summary: 'Hotel growth (last 6 months)' })
  growth() {
    return this.svc.getHotelGrowth();
  }

  // ── Hotels CRUD ───────────────────────────────────────────
  @Post('hotels')
  @ApiOperation({ summary: 'Create hotel + initial admin user' })
  createHotel(@Body() dto: CreateHotelDto, @Request() req: any) {
    return this.svc.createHotel(dto, req.superAdmin.sub, req.ip);
  }

  @Get('hotels')
  @ApiOperation({ summary: 'List hotels with filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['trial','active','suspended','expired'] })
  @ApiQuery({ name: 'plan', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  listHotels(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('plan') plan?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.svc.listHotels({
      search, status, plan,
      limit: limit ? +limit : 50,
      offset: offset ? +offset : 0,
    });
  }

  @Get('hotels/:id')
  @ApiOperation({ summary: 'Get hotel detail' })
  getHotel(@Param('id') id: string) {
    return this.svc.getHotel(id);
  }

  @Patch('hotels/:id')
  @ApiOperation({ summary: 'Update hotel' })
  updateHotel(@Param('id') id: string, @Body() dto: UpdateHotelAdminDto, @Request() req: any) {
    return this.svc.updateHotel(id, dto, req.superAdmin.sub, req.ip);
  }

  @Patch('hotels/:id/suspend')
  @ApiOperation({ summary: 'Suspend hotel account' })
  suspendHotel(@Param('id') id: string, @Body('reason') reason: string, @Request() req: any) {
    return this.svc.suspendHotel(id, reason, req.superAdmin.sub, req.ip);
  }

  @Patch('hotels/:id/activate')
  @ApiOperation({ summary: 'Activate hotel account' })
  activateHotel(@Param('id') id: string, @Request() req: any) {
    return this.svc.activateHotel(id, req.superAdmin.sub, req.ip);
  }

  @Delete('hotels/:id')
  @ApiOperation({ summary: 'Soft-delete hotel' })
  deleteHotel(@Param('id') id: string, @Request() req: any) {
    return this.svc.deleteHotel(id, req.superAdmin.sub, req.ip);
  }

  // ── Hotel users ───────────────────────────────────────────
  @Get('hotels/:hotelId/users')
  @ApiOperation({ summary: 'List hotel staff users' })
  listUsers(@Param('hotelId') hotelId: string) {
    return this.svc.listHotelUsers(hotelId);
  }

  @Post('hotels/:hotelId/users')
  @ApiOperation({ summary: 'Create user in hotel' })
  createUser(@Param('hotelId') hotelId: string, @Body() dto: CreateHotelUserDto, @Request() req: any) {
    return this.svc.createHotelUser(hotelId, dto, req.superAdmin.sub, req.ip);
  }

  @Patch('hotels/:hotelId/users/:userId/reset-password')
  @ApiOperation({ summary: 'Reset user password' })
  resetPassword(
    @Param('hotelId') hotelId: string,
    @Param('userId') userId: string,
    @Body('password') password: string,
    @Request() req: any,
  ) {
    return this.svc.resetUserPassword(hotelId, userId, password, req.superAdmin.sub, req.ip);
  }

  @Patch('hotels/:hotelId/users/:userId/enable')
  @ApiOperation({ summary: 'Enable user' })
  enableUser(@Param('hotelId') hotelId: string, @Param('userId') userId: string, @Request() req: any) {
    return this.svc.toggleUserStatus(hotelId, userId, true, req.superAdmin.sub, req.ip);
  }

  @Patch('hotels/:hotelId/users/:userId/disable')
  @ApiOperation({ summary: 'Disable user' })
  disableUser(@Param('hotelId') hotelId: string, @Param('userId') userId: string, @Request() req: any) {
    return this.svc.toggleUserStatus(hotelId, userId, false, req.superAdmin.sub, req.ip);
  }

  @Delete('hotels/:hotelId/users/:userId')
  @ApiOperation({ summary: 'Delete user from hotel' })
  deleteUser(@Param('hotelId') hotelId: string, @Param('userId') userId: string, @Request() req: any) {
    return this.svc.deleteHotelUser(hotelId, userId, req.superAdmin.sub, req.ip);
  }

  // ── Subscription plans ────────────────────────────────────
  @Get('plans')
  @ApiOperation({ summary: 'List subscription plans' })
  getPlans() {
    return this.svc.getSubscriptionPlans();
  }

  @Get('hotels/:hotelId/subscription')
  @ApiOperation({ summary: 'Get hotel subscription' })
  getSubscription(@Param('hotelId') hotelId: string) {
    return this.svc.getHotelSubscription(hotelId);
  }

  @Patch('hotels/:hotelId/subscription')
  @ApiOperation({ summary: 'Update/upgrade hotel subscription' })
  updateSubscription(
    @Param('hotelId') hotelId: string,
    @Body('planId') planId: string,
    @Body('billingCycle') billingCycle: string,
    @Request() req: any,
  ) {
    return this.svc.updateSubscription(hotelId, planId, billingCycle || 'monthly', req.superAdmin.sub, req.ip);
  }

  // ── Billing / Invoices ────────────────────────────────────
  @Get('invoices')
  @ApiOperation({ summary: 'List all invoices' })
  @ApiQuery({ name: 'hotelId', required: false })
  @ApiQuery({ name: 'status', required: false })
  listInvoices(@Query('hotelId') hotelId?: string, @Query('status') status?: string) {
    return this.svc.listInvoices(hotelId, status);
  }

  @Post('hotels/:hotelId/invoices')
  @ApiOperation({ summary: 'Generate invoice for hotel' })
  generateInvoice(
    @Param('hotelId') hotelId: string,
    @Body() body: { amount: number; description: string; taxPercent?: number },
    @Request() req: any,
  ) {
    return this.svc.generateInvoice(hotelId, body, req.superAdmin.sub, req.ip);
  }

  @Patch('invoices/:invoiceId/status')
  @ApiOperation({ summary: 'Update invoice status (paid, sent, void…)' })
  updateInvoiceStatus(
    @Param('invoiceId') invoiceId: string,
    @Body('status') status: string,
    @Request() req: any,
  ) {
    return this.svc.updateInvoiceStatus(invoiceId, status, req.superAdmin.sub, req.ip);
  }

  // ── Message Pricing ──────────────────────────────────────
  @Get('pricing')
  @ApiOperation({ summary: 'Get all message pricing tiers' })
  getPricing() {
    return this.svc.getMessagePricing();
  }

  @Patch('pricing/:id')
  @ApiOperation({ summary: 'Update a pricing tier (meta base + markup)' })
  updatePricing(
    @Param('id') id: string,
    @Body() body: { metaBasePrice: number; markupAmount: number; notes?: string },
    @Request() req: any,
  ) {
    return this.svc.updateMessagePricing(id, body, req.superAdmin.sub, req.ip);
  }

  // ── Usage / Billing ───────────────────────────────────────
  @Get('hotels/:hotelId/usage')
  @ApiOperation({ summary: 'Per-hotel message usage summary' })
  getUsage(@Param('hotelId') hotelId: string, @Query('month') month?: string) {
    return this.svc.getHotelUsage(hotelId, month);
  }

  @Get('usage/summary')
  @ApiOperation({ summary: 'All-hotels usage summary for a billing month' })
  getUsageSummary(@Query('month') month?: string) {
    return this.svc.getAllHotelsUsageSummary(month);
  }

  @Post('hotels/:hotelId/invoices/from-usage')
  @ApiOperation({ summary: 'Generate invoice from message usage + optional subscription fee' })
  generateUsageInvoice(
    @Param('hotelId') hotelId: string,
    @Body() body: { month?: string; includeSubscription?: boolean; taxPercent?: number },
    @Request() req: any,
  ) {
    return this.svc.generateUsageInvoice(hotelId, body, req.superAdmin.sub, req.ip);
  }

  // ── Audit logs ────────────────────────────────────────────
  @Get('audit-logs')
  @ApiOperation({ summary: 'Platform-wide audit log' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'hotelId', required: false })
  auditLogs(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('action') action?: string,
    @Query('hotelId') hotelId?: string,
  ) {
    return this.audit.findAll(limit ? +limit : 200, offset ? +offset : 0, { action, hotelId });
  }
}
