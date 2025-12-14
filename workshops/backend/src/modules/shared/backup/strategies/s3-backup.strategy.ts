import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BackupStrategy, BackupResult } from './backup-strategy.interface';
import { BackupType } from '../dto';
import { LocalBackupStrategy } from './local-backup.strategy';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';

/**
 * Estratégia de backup para S3
 * Por enquanto, faz backup local e depois faz upload para S3 (quando AWS SDK estiver disponível)
 */
@Injectable()
export class S3BackupStrategy implements BackupStrategy {
  private readonly logger = new Logger(S3BackupStrategy.name);
  private readonly localStrategy: LocalBackupStrategy;

  constructor(
    private readonly configService: ConfigService,
    localStrategy: LocalBackupStrategy,
  ) {
    this.localStrategy = localStrategy;
  }

  async createBackup(
    type: BackupType,
    outputPath: string,
    tenantId?: string,
  ): Promise<BackupResult> {
    try {
      // Primeiro, criar backup local
      const localResult = await this.localStrategy.createBackup(
        type,
        outputPath,
        tenantId,
      );

      // Tentar fazer upload para S3 se configurado
      const s3Bucket = this.configService.get<string>('AWS_S3_BACKUP_BUCKET');
      const s3Region = this.configService.get<string>('AWS_REGION');

      if (s3Bucket && s3Region) {
        try {
          // TODO: Implementar upload para S3 quando AWS SDK estiver disponível
          // Por enquanto, apenas log
          this.logger.log(
            `S3 configurado (bucket: ${s3Bucket}), mas upload não implementado ainda`,
          );

          // Gerar chave S3
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const s3Key = `backups/${tenantId || 'all'}/${type}/${timestamp}.dump`;

          return {
            ...localResult,
            s3Key,
            metadata: {
              ...localResult.metadata,
              s3Bucket,
              s3Region,
            },
          };
        } catch (error: unknown) {
          this.logger.warn(
            `Erro ao fazer upload para S3, mantendo apenas backup local: ${getErrorMessage(error)}`,
          );
        }
      }

      return localResult;
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao criar backup S3: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async restoreBackup(backupPath: string): Promise<void> {
    // Por enquanto, usa a estratégia local
    return this.localStrategy.restoreBackup(backupPath);
  }

  validateBackup(backupPath: string): boolean {
    return this.localStrategy.validateBackup(backupPath);
  }
}
