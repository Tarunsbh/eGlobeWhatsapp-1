import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { CreateAutomationRuleDto } from './dto/create-automation-rule.dto';
import { UpdateAutomationRuleDto } from './dto/update-automation-rule.dto';
export declare class AutomationService {
    private readonly prisma;
    private readonly whatsappService;
    private readonly automationQueue;
    private readonly logger;
    constructor(prisma: PrismaService, whatsappService: WhatsAppService, automationQueue: Queue);
    private normalizeTriggerType;
    private normalizeAudienceType;
    private normalizeOffsetDirection;
    findAll(hotelId: string): Promise<({
        template: {
            id: string;
            name: string;
            category: import(".prisma/client").$Enums.TemplateCategory;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        hotelId: string;
        description: string | null;
        templateId: string;
        variableValues: import("@prisma/client/runtime/library").JsonValue | null;
        createdById: string;
        triggerType: import(".prisma/client").$Enums.TriggerType;
        triggerOffsetHours: number;
        triggerOffsetDirection: import(".prisma/client").$Enums.OffsetDir;
        sendTime: string | null;
        audienceType: import(".prisma/client").$Enums.AudienceType;
        audienceFilter: import("@prisma/client/runtime/library").JsonValue | null;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        runCount: number;
        lastRunAt: Date | null;
    })[]>;
    findOne(hotelId: string, id: string): Promise<{
        template: {
            id: string;
            name: string;
            category: import(".prisma/client").$Enums.TemplateCategory;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        hotelId: string;
        description: string | null;
        templateId: string;
        variableValues: import("@prisma/client/runtime/library").JsonValue | null;
        createdById: string;
        triggerType: import(".prisma/client").$Enums.TriggerType;
        triggerOffsetHours: number;
        triggerOffsetDirection: import(".prisma/client").$Enums.OffsetDir;
        sendTime: string | null;
        audienceType: import(".prisma/client").$Enums.AudienceType;
        audienceFilter: import("@prisma/client/runtime/library").JsonValue | null;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        runCount: number;
        lastRunAt: Date | null;
    }>;
    create(hotelId: string, userId: string, dto: CreateAutomationRuleDto): Promise<{
        template: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        hotelId: string;
        description: string | null;
        templateId: string;
        variableValues: import("@prisma/client/runtime/library").JsonValue | null;
        createdById: string;
        triggerType: import(".prisma/client").$Enums.TriggerType;
        triggerOffsetHours: number;
        triggerOffsetDirection: import(".prisma/client").$Enums.OffsetDir;
        sendTime: string | null;
        audienceType: import(".prisma/client").$Enums.AudienceType;
        audienceFilter: import("@prisma/client/runtime/library").JsonValue | null;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        runCount: number;
        lastRunAt: Date | null;
    }>;
    update(hotelId: string, id: string, dto: UpdateAutomationRuleDto): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        hotelId: string;
        description: string | null;
        templateId: string;
        variableValues: import("@prisma/client/runtime/library").JsonValue | null;
        createdById: string;
        triggerType: import(".prisma/client").$Enums.TriggerType;
        triggerOffsetHours: number;
        triggerOffsetDirection: import(".prisma/client").$Enums.OffsetDir;
        sendTime: string | null;
        audienceType: import(".prisma/client").$Enums.AudienceType;
        audienceFilter: import("@prisma/client/runtime/library").JsonValue | null;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        runCount: number;
        lastRunAt: Date | null;
    }>;
    toggle(hotelId: string, id: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        hotelId: string;
        description: string | null;
        templateId: string;
        variableValues: import("@prisma/client/runtime/library").JsonValue | null;
        createdById: string;
        triggerType: import(".prisma/client").$Enums.TriggerType;
        triggerOffsetHours: number;
        triggerOffsetDirection: import(".prisma/client").$Enums.OffsetDir;
        sendTime: string | null;
        audienceType: import(".prisma/client").$Enums.AudienceType;
        audienceFilter: import("@prisma/client/runtime/library").JsonValue | null;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        runCount: number;
        lastRunAt: Date | null;
    }>;
    softDelete(hotelId: string, id: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        hotelId: string;
        description: string | null;
        templateId: string;
        variableValues: import("@prisma/client/runtime/library").JsonValue | null;
        createdById: string;
        triggerType: import(".prisma/client").$Enums.TriggerType;
        triggerOffsetHours: number;
        triggerOffsetDirection: import(".prisma/client").$Enums.OffsetDir;
        sendTime: string | null;
        audienceType: import(".prisma/client").$Enums.AudienceType;
        audienceFilter: import("@prisma/client/runtime/library").JsonValue | null;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        runCount: number;
        lastRunAt: Date | null;
    }>;
    getLogs(hotelId: string, ruleId: string, limit?: number): Promise<{
        logs: ({
            guest: {
                id: string;
                name: string;
                phone: string;
            };
        } & {
            error: string | null;
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.LogStatus;
            hotelId: string;
            messageId: string | null;
            guestId: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            ruleId: string;
            executedAt: Date;
        })[];
        stats: {
            total: number;
            success: number;
            failed: number;
        };
    }>;
    runRule(ruleId: string): Promise<{
        sent: number;
        failed: number;
        skipped: number;
        errors: string[];
    }>;
    runAllDueRules(): Promise<void>;
    runStayEventRulesForGuest(guestId: string, hotelId: string, stayStatus: string): Promise<void>;
    private buildSendComponents;
    private buildRuleAudience;
}
