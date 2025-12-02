import { ApiProperty } from '@nestjs/swagger';
import { AuditAction } from './create-audit-log.dto';

export class AuditLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ required: false })
  tenantId?: string;

  @ApiProperty({ required: false })
  userId?: string;

  @ApiProperty({ enum: AuditAction })
  action: AuditAction;

  @ApiProperty({ required: false })
  resourceType?: string;

  @ApiProperty({ required: false })
  resourceId?: string;

  @ApiProperty({ required: false })
  changes?: Record<string, unknown>;

  @ApiProperty({ required: false })
  ipAddress?: string;

  @ApiProperty({ required: false })
  userAgent?: string;

  @ApiProperty({ required: false })
  metadata?: Record<string, unknown>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  user?: {
    id: string;
    name: string;
    email: string;
  };
}
