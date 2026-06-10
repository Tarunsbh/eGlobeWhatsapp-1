import { AutomationService } from './automation.service';
import { CreateAutomationRuleDto } from './dto/create-automation-rule.dto';
import { UpdateAutomationRuleDto } from './dto/update-automation-rule.dto';
export declare class AutomationController {
    private readonly automationService;
    constructor(automationService: AutomationService);
    findAll(req: any): Promise<({
        template: {
            id: string;
            name: string;
            category: import(".prisma/client").$Enums.TemplateCategory;
        };
    } & {
        id: string;
        hotelId: string;
        name: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        templateId: string;
        createdById: string;
        audienceType: import(".prisma/client").$Enums.AudienceType;
        audienceFilter: import("@prisma/client/runtime/library").JsonValue | null;
        variableValues: import("@prisma/client/runtime/library").JsonValue | null;
        triggerType: import(".prisma/client").$Enums.TriggerType;
        triggerOffsetHours: number;
        triggerOffsetDirection: import(".prisma/client").$Enums.OffsetDir;
        sendTime: string | null;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        runCount: number;
        lastRunAt: Date | null;
    })[]>;
    findOne(req: any, id: string): Promise<{
        template: {
            id: string;
            name: string;
            category: import(".prisma/client").$Enums.TemplateCategory;
        };
    } & {
        id: string;
        hotelId: string;
        name: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        templateId: string;
        createdById: string;
        audienceType: import(".prisma/client").$Enums.AudienceType;
        audienceFilter: import("@prisma/client/runtime/library").JsonValue | null;
        variableValues: import("@prisma/client/runtime/library").JsonValue | null;
        triggerType: import(".prisma/client").$Enums.TriggerType;
        triggerOffsetHours: number;
        triggerOffsetDirection: import(".prisma/client").$Enums.OffsetDir;
        sendTime: string | null;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        runCount: number;
        lastRunAt: Date | null;
    }>;
    create(req: any, dto: CreateAutomationRuleDto): Promise<{
        template: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        hotelId: string;
        name: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        templateId: string;
        createdById: string;
        audienceType: import(".prisma/client").$Enums.AudienceType;
        audienceFilter: import("@prisma/client/runtime/library").JsonValue | null;
        variableValues: import("@prisma/client/runtime/library").JsonValue | null;
        triggerType: import(".prisma/client").$Enums.TriggerType;
        triggerOffsetHours: number;
        triggerOffsetDirection: import(".prisma/client").$Enums.OffsetDir;
        sendTime: string | null;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        runCount: number;
        lastRunAt: Date | null;
    }>;
    update(req: any, id: string, dto: UpdateAutomationRuleDto): Promise<{
        id: string;
        hotelId: string;
        name: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        templateId: string;
        createdById: string;
        audienceType: import(".prisma/client").$Enums.AudienceType;
        audienceFilter: import("@prisma/client/runtime/library").JsonValue | null;
        variableValues: import("@prisma/client/runtime/library").JsonValue | null;
        triggerType: import(".prisma/client").$Enums.TriggerType;
        triggerOffsetHours: number;
        triggerOffsetDirection: import(".prisma/client").$Enums.OffsetDir;
        sendTime: string | null;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        runCount: number;
        lastRunAt: Date | null;
    }>;
    softDelete(req: any, id: string): Promise<{
        id: string;
        hotelId: string;
        name: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        templateId: string;
        createdById: string;
        audienceType: import(".prisma/client").$Enums.AudienceType;
        audienceFilter: import("@prisma/client/runtime/library").JsonValue | null;
        variableValues: import("@prisma/client/runtime/library").JsonValue | null;
        triggerType: import(".prisma/client").$Enums.TriggerType;
        triggerOffsetHours: number;
        triggerOffsetDirection: import(".prisma/client").$Enums.OffsetDir;
        sendTime: string | null;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        runCount: number;
        lastRunAt: Date | null;
    }>;
    toggle(req: any, id: string): Promise<{
        id: string;
        hotelId: string;
        name: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        templateId: string;
        createdById: string;
        audienceType: import(".prisma/client").$Enums.AudienceType;
        audienceFilter: import("@prisma/client/runtime/library").JsonValue | null;
        variableValues: import("@prisma/client/runtime/library").JsonValue | null;
        triggerType: import(".prisma/client").$Enums.TriggerType;
        triggerOffsetHours: number;
        triggerOffsetDirection: import(".prisma/client").$Enums.OffsetDir;
        sendTime: string | null;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
        runCount: number;
        lastRunAt: Date | null;
    }>;
    runNow(req: any, id: string): Promise<{
        sent: number;
        failed: number;
        skipped: number;
        errors: string[];
    }>;
    getLogs(req: any, id: string): Promise<{
        logs: ({
            guest: {
                id: string;
                name: string;
                phone: string;
            };
        } & {
            error: string | null;
            id: string;
            hotelId: string;
            status: import(".prisma/client").$Enums.LogStatus;
            createdAt: Date;
            guestId: string;
            ruleId: string;
            messageId: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            executedAt: Date;
        })[];
        stats: {
            total: number;
            success: number;
            failed: number;
        };
    }>;
}
