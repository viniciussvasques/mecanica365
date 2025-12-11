import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BackupService } from '../backup.service';
import { BackupConfigDto, BackupType } from '../dto';

/**
 * Job agendado para backup diário completo
 * Executa todos os dias às 2:00 AM
 */
@Injectable()
export class ScheduledBackupJob {
  private readonly logger = new Logger(ScheduledBackupJob.name);

  constructor(private readonly backupService: BackupService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyBackup(): Promise<void> {
    try {
      this.logger.log('Iniciando backup diário completo');

      const config: BackupConfigDto = {
        type: BackupType.FULL,
        encrypted: true,
        retentionDays: 30,
      };

      await this.backupService.createBackup(config);

      this.logger.log('Backup diário completo concluído');
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao executar backup diário: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
