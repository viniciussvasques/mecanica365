import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { BackupStrategy, BackupResult } from './backup-strategy.interface';
import { BackupType } from '../dto';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';

const execAsync = promisify(exec);

@Injectable()
export class LocalBackupStrategy implements BackupStrategy {
  private readonly logger = new Logger(LocalBackupStrategy.name);

  constructor(private readonly configService: ConfigService) {}

  async createBackup(
    type: BackupType,
    outputPath: string,
    tenantId?: string,
  ): Promise<BackupResult> {
    try {
      const databaseUrl = this.configService.get<string>('DATABASE_URL');
      if (!databaseUrl) {
        throw new Error('DATABASE_URL não configurada');
      }

      // Extrair informações do DATABASE_URL
      const url = new URL(databaseUrl);
      const dbName = url.pathname.slice(1); // Remove a barra inicial
      const dbUser = url.username;
      const dbHost = url.hostname;
      const dbPort = url.port || '5432';
      const dbPassword = url.password;

      // Criar diretório se não existir
      const path = require('node:path');
      const fs = require('node:fs');
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Comando pg_dump
      const pgDumpCommand = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F c -f "${outputPath}"`;

      this.logger.log(`Criando backup ${type} em: ${outputPath}`);

      await execAsync(pgDumpCommand);

      // Verificar se o arquivo foi criado
      if (!existsSync(outputPath)) {
        throw new Error('Backup não foi criado');
      }

      const stats = statSync(outputPath);
      const size = stats.size;

      this.logger.log(`Backup criado com sucesso: ${size} bytes`);

      return {
        path: outputPath,
        size,
        metadata: {
          type,
          tenantId,
          createdAt: new Date().toISOString(),
          host: dbHost,
          port: dbPort,
          database: dbName,
        },
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao criar backup: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async restoreBackup(
    backupPath: string,
    tenantId?: string,
  ): Promise<void> {
    try {
      if (!existsSync(backupPath)) {
        throw new Error(`Backup não encontrado: ${backupPath}`);
      }

      const databaseUrl = this.configService.get<string>('DATABASE_URL');
      if (!databaseUrl) {
        throw new Error('DATABASE_URL não configurada');
      }

      const url = new URL(databaseUrl);
      const dbName = url.pathname.slice(1);
      const dbUser = url.username;
      const dbHost = url.hostname;
      const dbPort = url.port || '5432';
      const dbPassword = url.password;

      // Comando pg_restore
      const pgRestoreCommand = `PGPASSWORD="${dbPassword}" pg_restore -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --clean --if-exists "${backupPath}"`;

      this.logger.log(`Restaurando backup de: ${backupPath}`);

      await execAsync(pgRestoreCommand);

      this.logger.log('Backup restaurado com sucesso');
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao restaurar backup: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async validateBackup(backupPath: string): Promise<boolean> {
    try {
      if (!existsSync(backupPath)) {
        return false;
      }

      const stats = statSync(backupPath);
      if (stats.size === 0) {
        return false;
      }

      // Verificar se é um arquivo válido do pg_dump (formato custom)
      // Arquivos pg_dump custom começam com "PGDMP"
      const fs = require('node:fs');
      const fd = fs.openSync(backupPath, 'r');
      const buffer = Buffer.alloc(5);
      fs.readSync(fd, buffer, 0, 5, 0);
      fs.closeSync(fd);

      const header = buffer.toString('utf8');
      return header === 'PGDMP';
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao validar backup: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      return false;
    }
  }
}

