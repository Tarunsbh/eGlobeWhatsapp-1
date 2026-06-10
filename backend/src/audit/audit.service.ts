import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditParams {
  hotelId?: string;
  userId?: string;
  superAdminId?: string;
  action: string;          // e.g. 'user.create', 'campaign.delete'
  resource: string;        // table name
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: AuditParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          hotelId: params.hotelId ?? null,
          userId: params.userId ?? null,
          superAdminId: params.superAdminId ?? null,
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId ?? null,
          oldValues: params.oldValues ?? undefined,
          newValues: params.newValues ?? undefined,
          ip: params.ip ?? null,
          userAgent: params.userAgent ?? null,
        },
      });
    } catch (err) {
      // Audit failures must never crash business logic
      this.logger.error(`Audit log failed: ${err.message}`, err.stack);
    }
  }

  async findByHotel(hotelId: string, limit = 100, offset = 0) {
    return this.prisma.auditLog.findMany({
      where: { hotelId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async findAll(limit = 200, offset = 0, filters?: { action?: string; hotelId?: string }) {
    return this.prisma.auditLog.findMany({
      where: {
        ...(filters?.action && { action: { contains: filters.action } }),
        ...(filters?.hotelId && { hotelId: filters.hotelId }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }
}
