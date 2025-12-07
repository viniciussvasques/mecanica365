import { BackupType, BackupStatus } from './backup-config.dto';

export class BackupResponseDto {
  id: string;
  tenantId?: string;
  type: BackupType;
  status: BackupStatus;
  size?: bigint;
  path?: string;
  s3Key?: string;
  encrypted: boolean;
  startedAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
  error?: string;
}

