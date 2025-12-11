import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export enum BackupType {
  FULL = 'full',
  INCREMENTAL = 'incremental',
}

export enum BackupStatus {
  IN_PROGRESS = 'in_progress',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export class BackupConfigDto {
  @IsEnum(BackupType)
  type: BackupType;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsBoolean()
  encrypted?: boolean;

  @IsOptional()
  @IsNumber()
  retentionDays?: number; // Dias de retenção (padrão: 30)
}
