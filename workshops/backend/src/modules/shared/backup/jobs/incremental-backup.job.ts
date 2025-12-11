import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BackupService } from '../backup.service';
import { BackupConfigDto, BackupType } from '../dto';

/**
 * Job agendado para backup incremental
 * Executa a cada 6 horas
 */
@Injectable()
export class IncrementalBackupJob {
  private readonly logger = new Logger(IncrementalBackupJob.name);

  constructor(private readonly backupService: BackupService) {}

  @Cron('0 */6 * * *') // A cada 6 horas
  async handleIncrementalBackup(): Promise<void> {
    try {
      this.logger.log('Iniciando backup incremental');

      const config: BackupConfigDto = {
        type: BackupType.INCREMENTAL,
        encrypted: true,
        retentionDays: 7, // Backups incrementais mantidos por 7 dias
      };

      await this.backupService.createBackup(config);

      this.logger.log('Backup incremental concluído');
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao executar backup incremental: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
