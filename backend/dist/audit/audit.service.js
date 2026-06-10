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
var AuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AuditService = AuditService_1 = class AuditService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AuditService_1.name);
    }
    async log(params) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    hotelId: params.hotelId ?? null,
                    userId: params.userId ?? null,
                    superAdminId: params.superAdminId ?? null,
                    action: params.action,
                    resource: params.resource,
                    resourceId: params.resourceId ?? null,
                    oldValues: params.oldValues ?? undefined,
                    newValues: params.newValues ?? undefined,
                    ip: params.ip ?? null,
                    userAgent: params.userAgent ?? null,
                },
            });
        }
        catch (err) {
            this.logger.error(`Audit log failed: ${err.message}`, err.stack);
        }
    }
    async findByHotel(hotelId, limit = 100, offset = 0) {
        return this.prisma.auditLog.findMany({
            where: { hotelId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });
    }
    async findAll(limit = 200, offset = 0, filters) {
        return this.prisma.auditLog.findMany({
            where: {
                ...(filters?.action && { action: { contains: filters.action } }),
                ...(filters?.hotelId && { hotelId: filters.hotelId }),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = AuditService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map