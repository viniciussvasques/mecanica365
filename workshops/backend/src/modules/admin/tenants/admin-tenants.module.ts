import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../../database/prisma.module';
import { AdminTenantsController } from './admin-tenants.controller';
import { AdminTenantsService } from './admin-tenants.service';
import { EmailService } from '../../shared/email/email.service';
import { TenantsModule } from '../../core/tenants/tenants.module';

@Module({
  imports: [
    PrismaModule,
    TenantsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AdminTenantsController],
  providers: [AdminTenantsService, EmailService],
  exports: [AdminTenantsService],
})
export class AdminTenantsModule { }
