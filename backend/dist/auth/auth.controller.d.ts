import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    login(dto: LoginDto): Promise<{
        token: string;
        access_token: string;
        user: {
            hotel: {
                id: string;
                name: string;
                deletedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                phoneNumberId: string;
                wabaId: string;
                businessId: string | null;
                webhookVerifyToken: string;
                timezone: string;
                country: string;
                plan: import(".prisma/client").$Enums.Plan;
                isActive: boolean;
                settings: import("@prisma/client/runtime/library").JsonValue | null;
            };
            id: string;
            hotelId: string;
            name: string;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            role: import(".prisma/client").$Enums.Role;
            email: string;
            avatarUrl: string | null;
            lastLoginAt: Date | null;
        };
    }>;
    register(dto: RegisterDto, req: any): Promise<{
        id: string;
        hotelId: string;
        name: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        role: import(".prisma/client").$Enums.Role;
        email: string;
        avatarUrl: string | null;
        lastLoginAt: Date | null;
    }>;
    me(req: any): Promise<{
        hotel: {
            id: string;
            name: string;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            phoneNumberId: string;
            wabaId: string;
            businessId: string | null;
            webhookVerifyToken: string;
            timezone: string;
            country: string;
            plan: import(".prisma/client").$Enums.Plan;
            isActive: boolean;
            settings: import("@prisma/client/runtime/library").JsonValue | null;
        };
        id: string;
        hotelId: string;
        name: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        role: import(".prisma/client").$Enums.Role;
        email: string;
        avatarUrl: string | null;
        lastLoginAt: Date | null;
    }>;
    agents(req: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        isActive: boolean;
        role: import(".prisma/client").$Enums.Role;
        email: string;
        lastLoginAt: Date;
    }[]>;
    changePassword(body: {
        currentPassword: string;
        newPassword: string;
    }, req: any): Promise<{
        message: string;
    }>;
}
