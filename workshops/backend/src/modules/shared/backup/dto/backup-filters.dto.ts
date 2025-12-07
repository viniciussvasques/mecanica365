import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { BackupType, BackupStatus } from './backup-config.dto';

export class BackupFiltersDto {
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsEnum(BackupType)
  type?: BackupType;

  @IsOptional()
  @IsEnum(BackupStatus)
  status?: BackupStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

