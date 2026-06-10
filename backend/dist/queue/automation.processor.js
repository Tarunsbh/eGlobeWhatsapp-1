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
var AutomationProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
let AutomationProcessor = AutomationProcessor_1 = class AutomationProcessor {
    constructor(prisma, whatsappService) {
        this.prisma = prisma;
        this.whatsappService = whatsappService;
        this.logger = new common_1.Logger(AutomationProcessor_1.name);
    }
    async handleRunRule(job) {
        return this.executeRule(job.data.ruleId, null);
    }
    async handleRunRuleForGuest(job) {
        const { ruleId, guestId } = job.data;
        if (!guestId)
            throw new Error('guestId is required for run-rule-for-guest');
        return this.executeRule(ruleId, guestId);
    }
    async executeRule(ruleId, singleGuestId) {
        const rule = await this.prisma.automationRule.findUnique({
            where: { id: ruleId },
            include: { template: true },
        });
        if (!rule)
            throw new Error(`Automation rule ${ruleId} not found`);
        if (!rule.isActive) {
            this.logger.warn(`Rule ${ruleId} is inactive — skipping`);
            return { sent: 0, failed: 0 };
        }
        if (!rule.template || rule.template.status !== 'APPROVED') {
            this.logger.warn(`Rule ${ruleId} template not APPROVED — skipping`);
            return { sent: 0, failed: 0, errors: ['Template not approved'] };
        }
        const hotel = await this.prisma.hotel.findUnique({
            where: { id: rule.hotelId },
            select: { phoneNumberId: true },
        });
        if (!hotel?.phoneNumberId) {
            throw new Error(`Hotel ${rule.hotelId} has no phoneNumberId`);
        }
        let guests;
        if (singleGuestId) {
            const g = await this.prisma.guest.findFirst({
                where: { id: singleGuestId, hotelId: rule.hotelId, deletedAt: null, optIn: true },
                select: { id: true, phone: true, name: true },
            });
            guests = g ? [g] : [];
        }
        else {
            guests = await this.buildAudience(rule.hotelId, String(rule.audienceType), rule.audienceFilter);
        }
        if (guests.length === 0) {
            this.logger.log(`Rule ${ruleId}: no eligible guests`);
            return { sent: 0, failed: 0 };
        }
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const sendComponents = this.buildSendComponents(rule.variableValues);
        let sent = 0;
        let failed = 0;
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
                this.logger.debug(`Rule ${ruleId} already ran for guest ${guest.id} today — skipping`);
                continue;
            }
            try {
                const waMessageId = await this.whatsappService.sendTemplate(rule.hotelId, hotel.phoneNumberId, guest.phone, rule.template.name, rule.template.language, sendComponents);
                await this.prisma.automationLog.create({
                    data: {
                        ruleId,
                        hotelId: rule.hotelId,
                        guestId: guest.id,
                        status: 'SUCCESS',
                        metadata: { waMessageId },
                    },
                });
                sent++;
            }
            catch (e) {
                failed++;
                const errMsg = `Guest ${guest.phone}: ${e.message}`;
                errors.push(errMsg);
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
            data: {
                lastRunAt: new Date(),
                runCount: { increment: 1 },
            },
        });
        this.logger.log(`Rule ${ruleId}: ${sent} sent, ${failed} failed`);
        return { sent, failed, errors };
    }
    buildSendComponents(variableValues) {
        if (!variableValues || Object.keys(variableValues).length === 0)
            return [];
        const bodyParams = Object.keys(variableValues)
            .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
            .map((k) => ({ type: 'text', text: String(variableValues[k] || '') }));
        return bodyParams.length > 0 ? [{ type: 'body', parameters: bodyParams }] : [];
    }
    async buildAudience(hotelId, audienceType, filter) {
        const where = { hotelId, deletedAt: null, optIn: true };
        switch (audienceType.toUpperCase()) {
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
                if (filter?.tagId)
                    where.guestTags = { some: { tagId: filter.tagId } };
                break;
            case 'CSV':
                if (filter?.guestIds)
                    where.id = { in: filter.guestIds };
                break;
            case 'ALL':
            default:
                break;
        }
        return this.prisma.guest.findMany({
            where,
            select: { id: true, phone: true, name: true },
        });
    }
    onFailed(job, error) {
        this.logger.error(`Automation job ${job.id} (${job.name}) failed after ${job.attemptsMade} attempts: ${error.message}`);
    }
    onCompleted(job) {
        this.logger.log(`Automation job ${job.id} (${job.name}) completed`);
    }
};
exports.AutomationProcessor = AutomationProcessor;
__decorate([
    (0, bull_1.Process)('run-rule'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AutomationProcessor.prototype, "handleRunRule", null);
__decorate([
    (0, bull_1.Process)('run-rule-for-guest'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AutomationProcessor.prototype, "handleRunRuleForGuest", null);
__decorate([
    (0, bull_1.OnQueueFailed)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Error]),
    __metadata("design:returntype", void 0)
], AutomationProcessor.prototype, "onFailed", null);
__decorate([
    (0, bull_1.OnQueueCompleted)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AutomationProcessor.prototype, "onCompleted", null);
exports.AutomationProcessor = AutomationProcessor = AutomationProcessor_1 = __decorate([
    (0, bull_1.Processor)('automation'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        whatsapp_service_1.WhatsAppService])
], AutomationProcessor);
//# sourceMappingURL=automation.processor.js.map