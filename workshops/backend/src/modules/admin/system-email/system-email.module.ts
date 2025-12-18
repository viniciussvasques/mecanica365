import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SystemEmailController } from './system-email.controller';
import { SystemEmailService } from './system-email.service';
import { PrismaModule } from '../../../database/prisma.module';
import { EncryptionModule } from '../../shared/encryption/encryption.module';

@Module({
  imports: [
    PrismaModule,
    EncryptionModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SystemEmailController],
  providers: [SystemEmailService],
  exports: [SystemEmailService],
})
export class SystemEmailModule {}
