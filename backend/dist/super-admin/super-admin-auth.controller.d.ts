import { SuperAdminService } from './super-admin.service';
export declare class SuperAdminAuthController {
    private readonly svc;
    constructor(svc: SuperAdminService);
    login(email: string, password: string, req: any): Promise<{
        token: string;
        admin: {
            id: string;
            email: string;
            name: string;
            role: import(".prisma/client").$Enums.SuperAdminRole;
            isActive: boolean;
            mfaEnabled: boolean;
            lastLoginAt: Date | null;
            lastLoginIp: string | null;
            failedAttempts: number;
            lockedUntil: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
}
