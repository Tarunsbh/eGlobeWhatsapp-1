import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
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
    register(dto: RegisterDto, actorHotelId: string, actorRole: string): Promise<{
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
    me(userId: string): Promise<{
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
    changePassword(userId: string, oldPw: string, newPw: string): Promise<{
        message: string;
    }>;
    listAgents(hotelId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        isActive: boolean;
        role: import(".prisma/client").$Enums.Role;
        email: string;
        lastLoginAt: Date;
    }[]>;
}
