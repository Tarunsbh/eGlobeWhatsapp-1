import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Guards routes that only super admins may access.
 * Reads the same Authorization header but validates isSuperAdmin flag.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) throw new UnauthorizedException('No token provided');

    const token = authHeader.slice(7);
    try {
      const secret = this.config.get<string>('JWT_SECRET');
      const payload = this.jwt.verify(token, { secret });

      if (!payload.isSuperAdmin) {
        throw new ForbiddenException('Super admin access only');
      }

      req.superAdmin = payload;
      return true;
    } catch (e) {
      if (e instanceof ForbiddenException) throw e;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
