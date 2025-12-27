import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminAutomationsController } from './admin-automations.controller';
import { AdminAutomationsService } from './admin-automations.service';
import { PrismaModule } from '../../../database/prisma.module';

@Module({
    imports: [
        PrismaModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '8h' },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AdminAutomationsController],
    providers: [AdminAutomationsService],
})
export class AdminAutomationsModule { }
