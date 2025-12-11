import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BackupService } from '../backup.service';

/**
 * Job agendado para limpar backups expirados
 * Executa todos os dias às 3:00 AM
 */
@Injectable()
export class CleanupExpiredBackupsJob {
  private readonly logger = new Logger(CleanupExpiredBackupsJob.name);

  constructor(private readonly backupService: BackupService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCleanup(): Promise<void> {
    try {
      this.logger.log('Iniciando limpeza de backups expirados');

      const deleted = await this.backupService.cleanupExpiredBackups();

      this.logger.log(`Limpeza concluída: ${deleted} backups deletados`);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao limpar backups expirados: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
