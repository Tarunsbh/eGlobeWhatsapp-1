import { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
export interface RunRuleJobData {
    ruleId: string;
    guestId?: string;
}
export declare class AutomationProcessor {
    private readonly prisma;
    private readonly whatsappService;
    private readonly logger;
    constructor(prisma: PrismaService, whatsappService: WhatsAppService);
    handleRunRule(job: Job<RunRuleJobData>): Promise<{
        sent: number;
        failed: number;
        errors?: undefined;
    } | {
        sent: number;
        failed: number;
        errors: string[];
    }>;
    handleRunRuleForGuest(job: Job<RunRuleJobData>): Promise<{
        sent: number;
        failed: number;
        errors?: undefined;
    } | {
        sent: number;
        failed: number;
        errors: string[];
    }>;
    private executeRule;
    private buildSendComponents;
    private buildAudience;
    onFailed(job: Job, error: Error): void;
    onCompleted(job: Job): void;
}
