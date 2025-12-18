import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminCommunicationsController } from './admin-communications.controller';
import { AdminCommunicationsService } from './admin-communications.service';
import { PrismaService } from '../../../database/prisma.service';
import { EmailService } from '../../shared/email/email.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  controllers: [AdminCommunicationsController],
  providers: [AdminCommunicationsService, PrismaService, EmailService],
  exports: [AdminCommunicationsService],
})
export class AdminCommunicationsModule {}
