import { BackupType } from '../dto';

export interface BackupResult {
  path: string;
  size: number;
  s3Key?: string;
  metadata?: Record<string, unknown>;
}

export interface BackupStrategy {
  /**
   * Cria um backup do banco de dados
   */
  createBackup(
    type: BackupType,
    outputPath: string,
    tenantId?: string,
  ): Promise<BackupResult>;

  /**
   * Restaura um backup do banco de dados
   */
  restoreBackup(backupPath: string, tenantId?: string): Promise<void>;

  /**
   * Verifica se o backup existe e é válido
   */
  validateBackup(backupPath: string): Promise<boolean>;
}

