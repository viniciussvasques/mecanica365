import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';
import {
  BackupConfigDto,
  BackupType,
  BackupStatus,
  BackupResponseDto,
  BackupFiltersDto,
  RestoreRequestDto,
} from './dto';
import { LocalBackupStrategy } from './strategies/local-backup.strategy';
import { S3BackupStrategy } from './strategies/s3-backup.strategy';
import { EncryptionUtil } from './utils/encryption.util';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';
import { Prisma } from '@prisma/client';
import { join } from 'node:path';
import { existsSync, unlinkSync, statSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir: string;
  private readonly encryptionKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly localStrategy: LocalBackupStrategy,
    private readonly s3Strategy: S3BackupStrategy,
  ) {
    this.backupDir =
      this.configService.get<string>('BACKUP_DIR') || './backups';
    this.encryptionKey =
      this.configService.get<string>('BACKUP_ENCRYPTION_KEY') ||
      this.configService.get<string>('JWT_SECRET') ||
      'default-backup-key-change-in-production';
  }

  /**
   * Cria um backup
   */
  async createBackup(
    config: BackupConfigDto,
    tenantId?: string,
  ): Promise<BackupResponseDto> {
    const backupId = randomUUID();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${config.type}-${timestamp}.dump`;
    const backupPath = join(this.backupDir, filename);
    const encryptedPath = config.encrypted
      ? `${backupPath}.encrypted`
      : backupPath;

    try {
      // Criar registro de backup no banco
      await this.prisma.backup.create({
        data: {
          id: backupId,
          tenantId: tenantId || null,
          type: config.type,
          status: BackupStatus.IN_PROGRESS,
          encrypted: config.encrypted || false,
          startedAt: new Date(),
          expiresAt: config.retentionDays
            ? new Date(Date.now() + config.retentionDays * 24 * 60 * 60 * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias padrão
        },
      });

      this.logger.log(
        `Iniciando backup ${config.type} para tenant ${tenantId || 'all'}`,
      );

      // Criar backup usando estratégia (S3 se configurado, senão local)
      const s3Bucket = this.configService.get<string>('AWS_S3_BACKUP_BUCKET');
      const strategy = s3Bucket ? this.s3Strategy : this.localStrategy;

      const result = await strategy.createBackup(
        config.type,
        backupPath,
        tenantId,
      );

      // Criptografar se necessário
      let finalPath = result.path;
      let finalSize = result.size;

      if (config.encrypted) {
        await EncryptionUtil.encryptFile(
          backupPath,
          encryptedPath,
          this.encryptionKey,
        );
        finalPath = encryptedPath;
        finalSize = statSync(encryptedPath).size;

        // Remover arquivo não criptografado
        if (existsSync(backupPath)) {
          unlinkSync(backupPath);
        }
      }

      // Atualizar registro de backup
      const updatedBackup = await this.prisma.backup.update({
        where: { id: backupId },
        data: {
          status: BackupStatus.SUCCESS,
          path: finalPath,
          s3Key: result.s3Key,
          size: BigInt(finalSize),
          completedAt: new Date(),
          metadata: result.metadata as Prisma.InputJsonValue,
        },
      });

      this.logger.log(`Backup criado com sucesso: ${backupId}`);

      return this.toResponseDto(updatedBackup);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao criar backup: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );

      // Atualizar status para failed
      try {
        await this.prisma.backup.update({
          where: { id: backupId },
          data: {
            status: BackupStatus.FAILED,
            error: getErrorMessage(error),
            completedAt: new Date(),
          },
        });
      } catch (updateError: unknown) {
        this.logger.error(
          `Erro ao atualizar status do backup: ${getErrorMessage(updateError)}`,
        );
      }

      throw error;
    }
  }

  /**
   * Lista backups com filtros
   */
  async listBackups(
    filters: BackupFiltersDto,
    tenantId?: string,
  ): Promise<{ backups: BackupResponseDto[]; total: number }> {
    try {
      const where: Prisma.BackupWhereInput = {};

      if (tenantId) {
        where.tenantId = tenantId;
      } else if (filters.tenantId) {
        where.tenantId = filters.tenantId;
      }

      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.startDate || filters.endDate) {
        where.startedAt = {};
        if (filters.startDate) {
          where.startedAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.startedAt.lte = new Date(filters.endDate);
        }
      }

      const page = filters.page ? Number.parseInt(filters.page, 10) : 1;
      const limit = filters.limit ? Number.parseInt(filters.limit, 10) : 20;
      const skip = (page - 1) * limit;

      const [backups, total] = await Promise.all([
        this.prisma.backup.findMany({
          where,
          orderBy: { startedAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.backup.count({ where }),
      ]);

      return {
        backups: backups.map((backup) => this.toResponseDto(backup)),
        total,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao listar backups: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Obtém um backup por ID
   */
  async getBackup(id: string, tenantId?: string): Promise<BackupResponseDto> {
    try {
      const where: Prisma.BackupWhereInput = { id };
      if (tenantId) {
        where.tenantId = tenantId;
      }

      const backup = await this.prisma.backup.findFirst({ where });

      if (!backup) {
        throw new NotFoundException('Backup não encontrado');
      }

      return this.toResponseDto(backup);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao obter backup: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Restaura um backup
   */
  async restoreBackup(
    request: RestoreRequestDto,
    tenantId?: string,
  ): Promise<{ id: string; status: string }> {
    const restoreId = randomUUID();

    try {
      // Verificar se backup existe
      const backup = await this.getBackup(request.backupId, tenantId);

      if (backup.status !== BackupStatus.SUCCESS) {
        throw new BadRequestException(
          'Backup não pode ser restaurado (status inválido)',
        );
      }

      // Criar registro de restauração
      await this.prisma.restoreOperation.create({
        data: {
          id: restoreId,
          backupId: request.backupId,
          tenantId: tenantId || request.tenantId || null,
          status: 'in_progress',
          startedAt: new Date(),
        },
      });

      this.logger.log(`Iniciando restauração do backup: ${request.backupId}`);

      // Descriptografar se necessário
      let restorePath = backup.path;
      if (backup.encrypted && backup.path) {
        const decryptedPath = backup.path.replace('.encrypted', '');
        await EncryptionUtil.decryptFile(
          backup.path,
          decryptedPath,
          this.encryptionKey,
        );
        restorePath = decryptedPath;
      }

      // Restaurar backup
      const strategy = backup.s3Key ? this.s3Strategy : this.localStrategy;
      await strategy.restoreBackup(restorePath || '');

      // Limpar arquivo descriptografado temporário
      if (backup.encrypted && restorePath && existsSync(restorePath)) {
        unlinkSync(restorePath);
      }

      // Atualizar status
      await this.prisma.restoreOperation.update({
        where: { id: restoreId },
        data: {
          status: 'success',
          completedAt: new Date(),
        },
      });

      this.logger.log(`Restauração concluída: ${restoreId}`);

      return {
        id: restoreId,
        status: 'success',
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao restaurar backup: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );

      // Atualizar status para failed
      try {
        await this.prisma.restoreOperation.update({
          where: { id: restoreId },
          data: {
            status: 'failed',
            error: getErrorMessage(error),
            completedAt: new Date(),
          },
        });
      } catch (updateError: unknown) {
        this.logger.error(
          `Erro ao atualizar status da restauração: ${getErrorMessage(updateError)}`,
        );
      }

      throw error;
    }
  }

  /**
   * Deleta um backup
   */
  async deleteBackup(id: string, tenantId?: string): Promise<void> {
    try {
      const backup = await this.getBackup(id, tenantId);

      // Deletar arquivo físico
      if (backup.path && existsSync(backup.path)) {
        unlinkSync(backup.path);
      }

      // Deletar registro
      await this.prisma.backup.delete({
        where: { id },
      });

      this.logger.log(`Backup deletado: ${id}`);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao deletar backup: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Limpa backups expirados
   */
  async cleanupExpiredBackups(): Promise<number> {
    try {
      const now = new Date();
      const expiredBackups = await this.prisma.backup.findMany({
        where: {
          expiresAt: {
            lte: now,
          },
        },
      });

      let deleted = 0;
      for (const backup of expiredBackups) {
        try {
          await this.deleteBackup(backup.id);
          deleted++;
        } catch (error: unknown) {
          this.logger.warn(
            `Erro ao deletar backup expirado ${backup.id}: ${getErrorMessage(error)}`,
          );
        }
      }

      this.logger.log(`Limpeza concluída: ${deleted} backups deletados`);
      return deleted;
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao limpar backups expirados: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Obtém status dos backups
   */
  async getBackupStatus(): Promise<{
    total: number;
    success: number;
    failed: number;
    inProgress: number;
    expired: number;
  }> {
    try {
      const now = new Date();
      const [total, success, failed, inProgress, expired] = await Promise.all([
        this.prisma.backup.count(),
        this.prisma.backup.count({ where: { status: BackupStatus.SUCCESS } }),
        this.prisma.backup.count({ where: { status: BackupStatus.FAILED } }),
        this.prisma.backup.count({
          where: { status: BackupStatus.IN_PROGRESS },
        }),
        this.prisma.backup.count({
          where: {
            expiresAt: {
              lte: now,
            },
          },
        }),
      ]);

      return {
        total,
        success,
        failed,
        inProgress,
        expired,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao obter status dos backups: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Converte Prisma Backup para DTO
   */
  private toResponseDto(backup: {
    id: string;
    tenantId: string | null;
    type: string;
    status: string;
    size: bigint | null;
    path: string | null;
    s3Key: string | null;
    encrypted: boolean;
    startedAt: Date;
    completedAt: Date | null;
    expiresAt: Date | null;
    metadata: Prisma.JsonValue;
    error: string | null;
  }): BackupResponseDto {
    return {
      id: backup.id,
      tenantId: backup.tenantId || undefined,
      type: backup.type as BackupType,
      status: backup.status as BackupStatus,
      size: backup.size || undefined,
      path: backup.path || undefined,
      s3Key: backup.s3Key || undefined,
      encrypted: backup.encrypted,
      startedAt: backup.startedAt,
      completedAt: backup.completedAt || undefined,
      expiresAt: backup.expiresAt || undefined,
      metadata: (backup.metadata as Record<string, unknown>) || undefined,
      error: backup.error || undefined,
    };
  }
}
