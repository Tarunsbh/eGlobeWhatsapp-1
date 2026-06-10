import { PrismaService } from '../prisma/prisma.service';
export interface AuditParams {
    hotelId?: string;
    userId?: string;
    superAdminId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    ip?: string;
    userAgent?: string;
}
export declare class AuditService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    log(params: AuditParams): Promise<void>;
    findByHotel(hotelId: string, limit?: number, offset?: number): Promise<{
        id: bigint;
        createdAt: Date;
        hotelId: string | null;
        userId: string | null;
        superAdminId: string | null;
        action: string;
        resource: string;
        resourceId: string | null;
        oldValues: import("@prisma/client/runtime/library").JsonValue | null;
        newValues: import("@prisma/client/runtime/library").JsonValue | null;
        ip: string | null;
        userAgent: string | null;
    }[]>;
    findAll(limit?: number, offset?: number, filters?: {
        action?: string;
        hotelId?: string;
    }): Promise<{
        id: bigint;
        createdAt: Date;
        hotelId: string | null;
        userId: string | null;
        superAdminId: string | null;
        action: string;
        resource: string;
        resourceId: string | null;
        oldValues: import("@prisma/client/runtime/library").JsonValue | null;
        newValues: import("@prisma/client/runtime/library").JsonValue | null;
        ip: string | null;
        userAgent: string | null;
    }[]>;
}
