import { Controller, Post, Body, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SuperAdminService } from './super-admin.service';

/** Public endpoint — no guard required */
@ApiTags('super-admin-auth')
@Controller('super-admin/auth')
export class SuperAdminAuthController {
  constructor(private readonly svc: SuperAdminService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Super admin login (public)' })
  login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Request() req: any,
  ) {
    return this.svc.login(email, password, req.ip, req.headers['user-agent']);
  }
}
