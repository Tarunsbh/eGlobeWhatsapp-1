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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const super_admin_guard_1 = require("../common/guards/super-admin.guard");
const super_admin_service_1 = require("./super-admin.service");
const audit_service_1 = require("../audit/audit.service");
const create_hotel_dto_1 = require("./dto/create-hotel.dto");
const update_hotel_admin_dto_1 = require("./dto/update-hotel-admin.dto");
let SuperAdminController = class SuperAdminController {
    constructor(svc, audit) {
        this.svc = svc;
        this.audit = audit;
    }
    me(req) {
        return this.svc.getProfile(req.superAdmin.sub);
    }
    dashboard() {
        return this.svc.getSystemStats();
    }
    activity(limit) {
        return this.svc.getRecentActivity(limit ? +limit : 50);
    }
    growth() {
        return this.svc.getHotelGrowth();
    }
    createHotel(dto, req) {
        return this.svc.createHotel(dto, req.superAdmin.sub, req.ip);
    }
    listHotels(search, status, plan, limit, offset) {
        return this.svc.listHotels({
            search, status, plan,
            limit: limit ? +limit : 50,
            offset: offset ? +offset : 0,
        });
    }
    getHotel(id) {
        return this.svc.getHotel(id);
    }
    updateHotel(id, dto, req) {
        return this.svc.updateHotel(id, dto, req.superAdmin.sub, req.ip);
    }
    suspendHotel(id, reason, req) {
        return this.svc.suspendHotel(id, reason, req.superAdmin.sub, req.ip);
    }
    activateHotel(id, req) {
        return this.svc.activateHotel(id, req.superAdmin.sub, req.ip);
    }
    deleteHotel(id, req) {
        return this.svc.deleteHotel(id, req.superAdmin.sub, req.ip);
    }
    listUsers(hotelId) {
        return this.svc.listHotelUsers(hotelId);
    }
    createUser(hotelId, dto, req) {
        return this.svc.createHotelUser(hotelId, dto, req.superAdmin.sub, req.ip);
    }
    resetPassword(hotelId, userId, password, req) {
        return this.svc.resetUserPassword(hotelId, userId, password, req.superAdmin.sub, req.ip);
    }
    enableUser(hotelId, userId, req) {
        return this.svc.toggleUserStatus(hotelId, userId, true, req.superAdmin.sub, req.ip);
    }
    disableUser(hotelId, userId, req) {
        return this.svc.toggleUserStatus(hotelId, userId, false, req.superAdmin.sub, req.ip);
    }
    deleteUser(hotelId, userId, req) {
        return this.svc.deleteHotelUser(hotelId, userId, req.superAdmin.sub, req.ip);
    }
    getPlans() {
        return this.svc.getSubscriptionPlans();
    }
    getSubscription(hotelId) {
        return this.svc.getHotelSubscription(hotelId);
    }
    updateSubscription(hotelId, planId, billingCycle, req) {
        return this.svc.updateSubscription(hotelId, planId, billingCycle || 'monthly', req.superAdmin.sub, req.ip);
    }
    listInvoices(hotelId, status) {
        return this.svc.listInvoices(hotelId, status);
    }
    generateInvoice(hotelId, body, req) {
        return this.svc.generateInvoice(hotelId, body, req.superAdmin.sub, req.ip);
    }
    updateInvoiceStatus(invoiceId, status, req) {
        return this.svc.updateInvoiceStatus(invoiceId, status, req.superAdmin.sub, req.ip);
    }
    getPricing() {
        return this.svc.getMessagePricing();
    }
    updatePricing(id, body, req) {
        return this.svc.updateMessagePricing(id, body, req.superAdmin.sub, req.ip);
    }
    getUsage(hotelId, month) {
        return this.svc.getHotelUsage(hotelId, month);
    }
    getUsageSummary(month) {
        return this.svc.getAllHotelsUsageSummary(month);
    }
    generateUsageInvoice(hotelId, body, req) {
        return this.svc.generateUsageInvoice(hotelId, body, req.superAdmin.sub, req.ip);
    }
    auditLogs(limit, offset, action, hotelId) {
        return this.audit.findAll(limit ? +limit : 200, offset ? +offset : 0, { action, hotelId });
    }
};
exports.SuperAdminController = SuperAdminController;
__decorate([
    (0, common_1.Get)('auth/me'),
    (0, swagger_1.ApiOperation)({ summary: 'Super admin profile' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "me", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'System-wide statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('dashboard/activity'),
    (0, swagger_1.ApiOperation)({ summary: 'Recent audit activity' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "activity", null);
__decorate([
    (0, common_1.Get)('dashboard/growth'),
    (0, swagger_1.ApiOperation)({ summary: 'Hotel growth (last 6 months)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "growth", null);
__decorate([
    (0, common_1.Post)('hotels'),
    (0, swagger_1.ApiOperation)({ summary: 'Create hotel + initial admin user' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_hotel_dto_1.CreateHotelDto, Object]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "createHotel", null);
__decorate([
    (0, common_1.Get)('hotels'),
    (0, swagger_1.ApiOperation)({ summary: 'List hotels with filters' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['trial', 'active', 'suspended', 'expired'] }),
    (0, swagger_1.ApiQuery)({ name: 'plan', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false }),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('plan')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "listHotels", null);
__decorate([
    (0, common_1.Get)('hotels/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get hotel detail' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "getHotel", null);
__decorate([
    (0, common_1.Patch)('hotels/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update hotel' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_hotel_admin_dto_1.UpdateHotelAdminDto, Object]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "updateHotel", null);
__decorate([
    (0, common_1.Patch)('hotels/:id/suspend'),
    (0, swagger_1.ApiOperation)({ summary: 'Suspend hotel account' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "suspendHotel", null);
__decorate([
    (0, common_1.Patch)('hotels/:id/activate'),
    (0, swagger_1.ApiOperation)({ summary: 'Activate hotel account' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "activateHotel", null);
__decorate([
    (0, common_1.Delete)('hotels/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete hotel' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "deleteHotel", null);
__decorate([
    (0, common_1.Get)('hotels/:hotelId/users'),
    (0, swagger_1.ApiOperation)({ summary: 'List hotel staff users' }),
    __param(0, (0, common_1.Param)('hotelId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Post)('hotels/:hotelId/users'),
    (0, swagger_1.ApiOperation)({ summary: 'Create user in hotel' }),
    __param(0, (0, common_1.Param)('hotelId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_hotel_admin_dto_1.CreateHotelUserDto, Object]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "createUser", null);
__decorate([
    (0, common_1.Patch)('hotels/:hotelId/users/:userId/reset-password'),
    (0, swagger_1.ApiOperation)({ summary: 'Reset user password' }),
    __param(0, (0, common_1.Param)('hotelId')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Body)('password')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Patch)('hotels/:hotelId/users/:userId/enable'),
    (0, swagger_1.ApiOperation)({ summary: 'Enable user' }),
    __param(0, (0, common_1.Param)('hotelId')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "enableUser", null);
__decorate([
    (0, common_1.Patch)('hotels/:hotelId/users/:userId/disable'),
    (0, swagger_1.ApiOperation)({ summary: 'Disable user' }),
    __param(0, (0, common_1.Param)('hotelId')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "disableUser", null);
__decorate([
    (0, common_1.Delete)('hotels/:hotelId/users/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete user from hotel' }),
    __param(0, (0, common_1.Param)('hotelId')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Get)('plans'),
    (0, swagger_1.ApiOperation)({ summary: 'List subscription plans' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "getPlans", null);
__decorate([
    (0, common_1.Get)('hotels/:hotelId/subscription'),
    (0, swagger_1.ApiOperation)({ summary: 'Get hotel subscription' }),
    __param(0, (0, common_1.Param)('hotelId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "getSubscription", null);
__decorate([
    (0, common_1.Patch)('hotels/:hotelId/subscription'),
    (0, swagger_1.ApiOperation)({ summary: 'Update/upgrade hotel subscription' }),
    __param(0, (0, common_1.Param)('hotelId')),
    __param(1, (0, common_1.Body)('planId')),
    __param(2, (0, common_1.Body)('billingCycle')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "updateSubscription", null);
__decorate([
    (0, common_1.Get)('invoices'),
    (0, swagger_1.ApiOperation)({ summary: 'List all invoices' }),
    (0, swagger_1.ApiQuery)({ name: 'hotelId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    __param(0, (0, common_1.Query)('hotelId')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "listInvoices", null);
__decorate([
    (0, common_1.Post)('hotels/:hotelId/invoices'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate invoice for hotel' }),
    __param(0, (0, common_1.Param)('hotelId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "generateInvoice", null);
__decorate([
    (0, common_1.Patch)('invoices/:invoiceId/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update invoice status (paid, sent, void…)' }),
    __param(0, (0, common_1.Param)('invoiceId')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "updateInvoiceStatus", null);
__decorate([
    (0, common_1.Get)('pricing'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all message pricing tiers' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "getPricing", null);
__decorate([
    (0, common_1.Patch)('pricing/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a pricing tier (meta base + markup)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "updatePricing", null);
__decorate([
    (0, common_1.Get)('hotels/:hotelId/usage'),
    (0, swagger_1.ApiOperation)({ summary: 'Per-hotel message usage summary' }),
    __param(0, (0, common_1.Param)('hotelId')),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "getUsage", null);
__decorate([
    (0, common_1.Get)('usage/summary'),
    (0, swagger_1.ApiOperation)({ summary: 'All-hotels usage summary for a billing month' }),
    __param(0, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "getUsageSummary", null);
__decorate([
    (0, common_1.Post)('hotels/:hotelId/invoices/from-usage'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate invoice from message usage + optional subscription fee' }),
    __param(0, (0, common_1.Param)('hotelId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "generateUsageInvoice", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Platform-wide audit log' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'action', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'hotelId', required: false }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('offset')),
    __param(2, (0, common_1.Query)('action')),
    __param(3, (0, common_1.Query)('hotelId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "auditLogs", null);
exports.SuperAdminController = SuperAdminController = __decorate([
    (0, swagger_1.ApiTags)('super-admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Controller)('super-admin'),
    __metadata("design:paramtypes", [super_admin_service_1.SuperAdminService,
        audit_service_1.AuditService])
], SuperAdminController);
//# sourceMappingURL=super-admin.controller.js.map