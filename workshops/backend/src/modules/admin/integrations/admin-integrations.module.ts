import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminIntegrationsController } from './admin-integrations.controller';
import { AdminIntegrationsService } from './admin-integrations.service';
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
    controllers: [AdminIntegrationsController],
    providers: [AdminIntegrationsService],
})
export class AdminIntegrationsModule { }
