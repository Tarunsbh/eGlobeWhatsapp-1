import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
export declare class TenantMiddleware implements NestMiddleware {
    private readonly jwt;
    private readonly config;
    constructor(jwt: JwtService, config: ConfigService);
    use(req: Request & {
        tenantId?: string;
        user?: any;
    }, _res: Response, next: NextFunction): void;
}
