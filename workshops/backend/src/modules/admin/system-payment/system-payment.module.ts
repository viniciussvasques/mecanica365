import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../../database/prisma.module';
import { EncryptionModule } from '../../shared/encryption/encryption.module';
import { SystemPaymentController } from './system-payment.controller';
import { SystemPaymentService } from './system-payment.service';

@Module({
  imports: [
    PrismaModule,
    EncryptionModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SystemPaymentController],
  providers: [SystemPaymentService],
  exports: [SystemPaymentService],
})
export class SystemPaymentModule {}
