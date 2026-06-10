import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { HotelsModule } from '../hotels/hotels.module';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminAuthController } from './super-admin-auth.controller';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    HotelsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('SA_JWT_EXPIRES_IN') || '8h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [SuperAdminService, SuperAdminGuard],
  controllers: [SuperAdminController, SuperAdminAuthController],
  exports: [SuperAdminService],
})
export class SuperAdminModule {}
