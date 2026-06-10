"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
let SuperAdminGuard = class SuperAdminGuard {
    constructor(jwt, config) {
        this.jwt = jwt;
        this.config = config;
    }
    canActivate(ctx) {
        const req = ctx.switchToHttp().getRequest();
        const authHeader = req.headers['authorization'];
        if (!authHeader?.startsWith('Bearer '))
            throw new common_1.UnauthorizedException('No token provided');
        const token = authHeader.slice(7);
        try {
            const secret = this.config.get('JWT_SECRET');
            const payload = this.jwt.verify(token, { secret });
            if (!payload.isSuperAdmin) {
                throw new common_1.ForbiddenException('Super admin access only');
            }
            req.superAdmin = payload;
            return true;
        }
        catch (e) {
            if (e instanceof common_1.ForbiddenException)
                throw e;
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
};
exports.SuperAdminGuard = SuperAdminGuard;
exports.SuperAdminGuard = SuperAdminGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], SuperAdminGuard);
//# sourceMappingURL=super-admin.guard.js.map