import { ConversationsService } from './conversations.service';
export declare class ConversationsController {
    private readonly conversationsService;
    constructor(conversationsService: ConversationsService);
    findAll(req: any, status?: string, agentId?: string, search?: string, page?: number, limit?: number): Promise<{
        data: ({
            guest: {
                id: string;
                email: string;
                name: string;
                phone: string;
                roomNumber: string;
            };
            assignedAgent: {
                id: string;
                email: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.ConversationStatus;
            deletedAt: Date | null;
            tags: import("@prisma/client/runtime/library").JsonValue | null;
            hotelId: string;
            guestId: string;
            assignedAgentId: string | null;
            channel: string;
            lastMessage: string | null;
            lastMessageAt: Date | null;
            lastMessageType: string | null;
            unreadCount: number;
            resolvedAt: Date | null;
            resolvedBy: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(req: any, id: string): Promise<{
        guest: {
            id: string;
            email: string | null;
            name: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            hotelId: string;
            notes: string | null;
            phone: string;
            source: import(".prisma/client").$Enums.GuestSource;
            language: string;
            countryCode: string | null;
            gender: import(".prisma/client").$Enums.Gender | null;
            stayStatus: import(".prisma/client").$Enums.StayStatus;
            checkInDate: Date | null;
            checkOutDate: Date | null;
            roomNumber: string | null;
            bookingRef: string | null;
            pmsGuestId: string | null;
            nationality: string | null;
            optIn: boolean;
            optInAt: Date | null;
            optOutAt: Date | null;
            customFields: import("@prisma/client/runtime/library").JsonValue | null;
        };
        assignedAgent: {
            id: string;
            email: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ConversationStatus;
        deletedAt: Date | null;
        tags: import("@prisma/client/runtime/library").JsonValue | null;
        hotelId: string;
        guestId: string;
        assignedAgentId: string | null;
        channel: string;
        lastMessage: string | null;
        lastMessageAt: Date | null;
        lastMessageType: string | null;
        unreadCount: number;
        resolvedAt: Date | null;
        resolvedBy: string | null;
    }>;
    assign(req: any, id: string, agentId: string): Promise<{
        guest: {
            id: string;
            name: string;
            phone: string;
        };
        assignedAgent: {
            id: string;
            email: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ConversationStatus;
        deletedAt: Date | null;
        tags: import("@prisma/client/runtime/library").JsonValue | null;
        hotelId: string;
        guestId: string;
        assignedAgentId: string | null;
        channel: string;
        lastMessage: string | null;
        lastMessageAt: Date | null;
        lastMessageType: string | null;
        unreadCount: number;
        resolvedAt: Date | null;
        resolvedBy: string | null;
    }>;
    updateStatus(req: any, id: string, status: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ConversationStatus;
        deletedAt: Date | null;
        tags: import("@prisma/client/runtime/library").JsonValue | null;
        hotelId: string;
        guestId: string;
        assignedAgentId: string | null;
        channel: string;
        lastMessage: string | null;
        lastMessageAt: Date | null;
        lastMessageType: string | null;
        unreadCount: number;
        resolvedAt: Date | null;
        resolvedBy: string | null;
    }>;
    markRead(req: any, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ConversationStatus;
        deletedAt: Date | null;
        tags: import("@prisma/client/runtime/library").JsonValue | null;
        hotelId: string;
        guestId: string;
        assignedAgentId: string | null;
        channel: string;
        lastMessage: string | null;
        lastMessageAt: Date | null;
        lastMessageType: string | null;
        unreadCount: number;
        resolvedAt: Date | null;
        resolvedBy: string | null;
    }>;
    remove(req: any, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ConversationStatus;
        deletedAt: Date | null;
        tags: import("@prisma/client/runtime/library").JsonValue | null;
        hotelId: string;
        guestId: string;
        assignedAgentId: string | null;
        channel: string;
        lastMessage: string | null;
        lastMessageAt: Date | null;
        lastMessageType: string | null;
        unreadCount: number;
        resolvedAt: Date | null;
        resolvedBy: string | null;
    }>;
}
