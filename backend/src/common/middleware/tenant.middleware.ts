import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Global tenant isolation middleware.
 * Validates the JWT and injects tenantId + user into every request.
 * All subsequent service calls MUST filter by req.tenantId.
 *
 * Super admin routes bypass tenant enforcement — they carry isSuperAdmin=true.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  use(req: Request & { tenantId?: string; user?: any }, _res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) return next();

    try {
      const token = authHeader.slice(7);
      const secret = this.config.get<string>('JWT_SECRET');
      const payload = this.jwt.verify(token, { secret });

      // Super admin tokens carry isSuperAdmin flag — skip tenant enforcement
      if (payload.isSuperAdmin) {
        req.user = payload;
        return next();
      }

      if (!payload.hotelId) {
        throw new ForbiddenException('Token missing tenant context');
      }

      // Inject tenantId — all services downstream read from req.tenantId
      req.tenantId = payload.hotelId;
      req.user = payload;
    } catch {
      // Let the JWT guard handle 401 — middleware just enriches context
    }

    next();
  }
}
