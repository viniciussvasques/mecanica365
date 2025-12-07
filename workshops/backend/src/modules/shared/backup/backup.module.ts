import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@database/prisma.module';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { LocalBackupStrategy } from './strategies/local-backup.strategy';
import { S3BackupStrategy } from './strategies/s3-backup.strategy';
import { ScheduledBackupJob } from './jobs/scheduled-backup.job';
import { IncrementalBackupJob } from './jobs/incremental-backup.job';
import { CleanupExpiredBackupsJob } from './jobs/cleanup-expired-backups.job';

/**
 * BackupModule - Módulo para backup automatizado
 */
@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    ScheduleModule.forRoot(), // Para jobs agendados
  ],
  controllers: [BackupController],
  providers: [
    BackupService,
    LocalBackupStrategy,
    S3BackupStrategy,
    ScheduledBackupJob,
    IncrementalBackupJob,
    CleanupExpiredBackupsJob,
  ],
  exports: [BackupService],
})
export class BackupModule {}

