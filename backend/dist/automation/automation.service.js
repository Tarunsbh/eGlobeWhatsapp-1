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
var AutomationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
let AutomationService = AutomationService_1 = class AutomationService {
    constructor(prisma, whatsappService, automationQueue) {
        this.prisma = prisma;
        this.whatsappService = whatsappService;
        this.automationQueue = automationQueue;
        this.logger = new common_1.Logger(AutomationService_1.name);
    }
    normalizeTriggerType(triggerType) {
        if (!triggerType)
            return undefined;
        const normalized = triggerType.toUpperCase();
        if (normalized === 'SCHEDULED')
            return 'CUSTOM_DATE';
        if (normalized === 'CHECK_IN')
            return 'AFTER_CHECKIN';
        if (normalized === 'CHECK_OUT')
            return 'AFTER_CHECKOUT';
        if (normalized === 'KEYWORD' || normalized === 'INACTIVITY') {
            return 'CUSTOM_DATE';
        }
        return normalized;
    }
    normalizeAudienceType(audienceType) {
        if (!audienceType)
            return undefined;
        const normalized = audienceType.toUpperCase();
        if (normalized === 'CHECKED_IN')
            return 'IN_HOUSE';
        if (normalized === 'CUSTOM')
            return 'CSV';
        return normalized;
    }
    normalizeOffsetDirection(direction) {
        return direction?.toUpperCase() === 'BEFORE' ? 'BEFORE' : 'AFTER';
    }
    async findAll(hotelId) {
        return this.prisma.automationRule.findMany({
            where: { hotelId, deletedAt: null },
            include: {
                template: { select: { id: true, name: true, category: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(hotelId, id) {
        const rule = await this.prisma.automationRule.findFirst({
            where: { id, hotelId, deletedAt: null },
            include: {
                template: { select: { id: true, name: true, category: true } },
            },
        });
        if (!rule) {
            throw new common_1.NotFoundException(`Automation rule ${id} not found`);
        }
        return rule;
    }
    async create(hotelId, userId, dto) {
        return this.prisma.automationRule.create({
            data: {
                hotelId,
                createdById: userId,
                name: dto.name,
                triggerType: this.normalizeTriggerType(dto.triggerType),
                triggerOffsetHours: Number(dto.triggerConfig?.offsetHours || 0),
                triggerOffsetDirection: this.normalizeOffsetDirection(dto.triggerConfig?.offsetDirection),
                sendTime: dto.triggerConfig?.sendTime,
                conditions: dto.triggerConfig,
                templateId: dto.templateId,
                audienceType: this.normalizeAudienceType(dto.audienceType),
                audienceFilter: dto.audienceFilter,
                variableValues: dto.variableValues,
                isActive: dto.isActive ?? true,
            },
            include: {
                template: { select: { id: true, name: true } },
            },
        });
    }
    async update(hotelId, id, dto) {
        await this.findOne(hotelId, id);
        return this.prisma.automationRule.update({
            where: { id },
            data: {
                name: dto.name,
                triggerType: this.normalizeTriggerType(dto.triggerType),
                triggerOffsetHours: dto.triggerConfig?.offsetHours,
                triggerOffsetDirection: dto.triggerConfig?.offsetDirection
                    ? this.normalizeOffsetDirection(dto.triggerConfig.offsetDirection)
                    : undefined,
                sendTime: dto.triggerConfig?.sendTime,
                conditions: dto.triggerConfig,
                templateId: dto.templateId,
                audienceType: this.normalizeAudienceType(dto.audienceType),
                audienceFilter: dto.audienceFilter,
                variableValues: dto.variableValues,
                isActive: dto.isActive,
            },
        });
    }
    async toggle(hotelId, id) {
        const rule = await this.findOne(hotelId, id);
        return this.prisma.automationRule.update({
            where: { id },
            data: { isActive: !rule.isActive },
        });
    }
    async softDelete(hotelId, id) {
        await this.findOne(hotelId, id);
        return this.prisma.automationRule.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async getLogs(hotelId, ruleId, limit = 50) {
        await this.findOne(hotelId, ruleId);
        const logs = await this.prisma.automationLog.findMany({
            where: { ruleId, hotelId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                guest: { select: { id: true, name: true, phone: true } },
            },
        });
        const total = await this.prisma.automationLog.count({ where: { ruleId, hotelId } });
        const success = await this.prisma.automationLog.count({ where: { ruleId, hotelId, status: 'SUCCESS' } });
        const failed = await this.prisma.automationLog.count({ where: { ruleId, hotelId, status: 'FAILED' } });
        return { logs, stats: { total, success, failed } };
    }
    async runRule(ruleId) {
        const rule = await this.prisma.automationRule.findUnique({
            where: { id: ruleId },
            include: { template: true },
        });
        if (!rule)
            throw new common_1.NotFoundException(`Rule ${ruleId} not found`);
        if (!rule.template || rule.template.status !== 'APPROVED') {
            return { sent: 0, failed: 0, skipped: 0, errors: ['Template not approved'] };
        }
        const hotel = await this.prisma.hotel.findUnique({
            where: { id: rule.hotelId },
            select: { phoneNumberId: true },
        });
        if (!hotel?.phoneNumberId) {
            return { sent: 0, failed: 0, skipped: 0, errors: ['Hotel has no phoneNumberId'] };
        }
        const guests = await this.buildRuleAudience(rule.hotelId, rule.audienceType, rule.audienceFilter);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const sendComponents = this.buildSendComponents(rule.variableValues);
        let sent = 0;
        let failed = 0;
        let skipped = 0;
        const errors = [];
        for (const guest of guests) {
            const alreadyRan = await this.prisma.automationLog.findFirst({
                where: {
                    ruleId,
                    guestId: guest.id,
                    status: 'SUCCESS',
                    createdAt: { gte: todayStart },
                },
            });
            if (alreadyRan) {
                skipped++;
                continue;
            }
            try {
                const result = await this.whatsappService.sendTemplate(rule.hotelId, hotel.phoneNumberId, guest.phone, rule.template.name, rule.template.language, sendComponents);
                await this.prisma.automationLog.create({
                    data: {
                        ruleId,
                        hotelId: rule.hotelId,
                        guestId: guest.id,
                        status: 'SUCCESS',
                        metadata: { waMessageId: result },
                    },
                });
                sent++;
            }
            catch (e) {
                failed++;
                errors.push(`Guest ${guest.phone}: ${e.message}`);
                await this.prisma.automationLog.create({
                    data: {
                        ruleId,
                        hotelId: rule.hotelId,
                        guestId: guest.id,
                        status: 'FAILED',
                        error: e.message,
                    },
                });
            }
        }
        await this.prisma.automationRule.update({
            where: { id: ruleId },
            data: { lastRunAt: new Date(), runCount: { increment: 1 } },
        });
        this.logger.log(`Rule ${ruleId}: ${sent} sent, ${failed} failed, ${skipped} skipped`);
        return { sent, failed, skipped, errors };
    }
    async runAllDueRules() {
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const customRules = await this.prisma.automationRule.findMany({
            where: { isActive: true, deletedAt: null, triggerType: 'CUSTOM_DATE' },
        });
        const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        let queued = 0;
        for (const rule of customRules) {
            const sendTime = rule.sendTime || '00:00';
            const alreadyRunToday = rule.lastRunAt && rule.lastRunAt >= todayStart;
            if (sendTime === currentHHMM && !alreadyRunToday) {
                try {
                    await this.automationQueue.add('run-rule', { ruleId: rule.id }, { attempts: 2, backoff: { type: 'fixed', delay: 10_000 }, removeOnComplete: true });
                    queued++;
                }
                catch (e) {
                    this.logger.error(`Failed to queue CUSTOM_DATE rule ${rule.id}: ${e.message}`);
                }
            }
        }
        const twoMinsAgo = new Date(now.getTime() - 2 * 60 * 1_000);
        const recentGuests = await this.prisma.guest.findMany({
            where: {
                updatedAt: { gte: twoMinsAgo },
                deletedAt: null,
                optIn: true,
                stayStatus: { not: 'NO_STAY' },
            },
            select: { id: true, hotelId: true, stayStatus: true },
        });
        for (const guest of recentGuests) {
            await this.runStayEventRulesForGuest(guest.id, guest.hotelId, String(guest.stayStatus)).catch((e) => this.logger.error(`Stay-event check failed for guest ${guest.id}: ${e.message}`));
        }
        if (queued > 0) {
            this.logger.log(`Queued ${queued} CUSTOM_DATE automation rules at ${currentHHMM}`);
        }
    }
    async runStayEventRulesForGuest(guestId, hotelId, stayStatus) {
        const triggerMap = {
            ARRIVING: ['BEFORE_ARRIVAL'],
            IN_HOUSE: ['AFTER_CHECKIN', 'DURING_STAY'],
            CHECKED_OUT: ['BEFORE_CHECKOUT', 'AFTER_CHECKOUT'],
        };
        const triggerTypes = triggerMap[stayStatus];
        if (!triggerTypes || triggerTypes.length === 0)
            return;
        const rules = await this.prisma.automationRule.findMany({
            where: {
                hotelId,
                isActive: true,
                deletedAt: null,
                triggerType: { in: triggerTypes },
            },
        });
        if (rules.length === 0)
            return;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        for (const rule of rules) {
            const alreadyRan = await this.prisma.automationLog.findFirst({
                where: {
                    ruleId: rule.id,
                    guestId,
                    status: 'SUCCESS',
                    createdAt: { gte: todayStart },
                },
            });
            if (alreadyRan) {
                this.logger.debug(`Rule ${rule.id} already ran for guest ${guestId} today — skipping`);
                continue;
            }
            const delayMs = (rule.triggerOffsetHours || 0) * 60 * 60 * 1_000;
            await this.automationQueue.add('run-rule-for-guest', { ruleId: rule.id, guestId }, {
                attempts: 2,
                backoff: { type: 'fixed', delay: 10_000 },
                delay: delayMs,
                removeOnComplete: true,
            }).catch((e) => this.logger.error(`Failed to queue stay-event rule ${rule.id} for guest ${guestId}: ${e.message}`));
            this.logger.log(`Queued stay-event rule "${rule.name}" for guest ${guestId} (delay: ${delayMs / 60_000}min)`);
        }
    }
    buildSendComponents(variableValues) {
        if (!variableValues || Object.keys(variableValues).length === 0)
            return [];
        const bodyParams = Object.keys(variableValues)
            .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
            .map((k) => ({ type: 'text', text: String(variableValues[k] || '') }));
        return bodyParams.length > 0
            ? [{ type: 'body', parameters: bodyParams }]
            : [];
    }
    async buildRuleAudience(hotelId, audienceType, filter) {
        const where = {
            hotelId,
            deletedAt: null,
            optIn: true,
        };
        switch (this.normalizeAudienceType(audienceType)) {
            case 'ALL':
                break;
            case 'ARRIVING':
                where.stayStatus = 'ARRIVING';
                break;
            case 'IN_HOUSE':
                where.stayStatus = 'IN_HOUSE';
                break;
            case 'CHECKED_OUT':
                where.stayStatus = 'CHECKED_OUT';
                break;
            case 'TAG':
                if (filter?.tagId) {
                    where.guestTags = { some: { tagId: filter.tagId } };
                }
                break;
            case 'CSV':
                if (filter?.guestIds) {
                    where.id = { in: filter.guestIds };
                }
                break;
        }
        return this.prisma.guest.findMany({
            where,
            select: { id: true, phone: true, name: true },
        });
    }
};
exports.AutomationService = AutomationService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AutomationService.prototype, "runAllDueRules", null);
exports.AutomationService = AutomationService = AutomationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bull_1.InjectQueue)('automation')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        whatsapp_service_1.WhatsAppService, Object])
], AutomationService);
//# sourceMappingURL=automation.service.js.map