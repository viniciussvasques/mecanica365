import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminBackupController } from './admin-backup.controller';
import { BackupModule } from '../../shared/backup/backup.module';

@Module({
    imports: [
        BackupModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '8h' },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AdminBackupController],
})
export class AdminBackupModule { }
