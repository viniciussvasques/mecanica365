import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsObject, IsEnum } from 'class-validator';

export enum JobType {
  EMAIL = 'email',
  REPORT = 'report',
  WEBHOOK = 'webhook',
  CLEANUP = 'cleanup',
  EXPORT = 'export',
}

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export class CreateJobDto {
  @ApiProperty({ description: 'Tipo do job', enum: JobType })
  @IsEnum(JobType)
  type: JobType;

  @ApiProperty({ description: 'Dados do job' })
  @IsObject()
  data: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Prioridade (1-10, 10 = mais alta)',
    default: 5,
  })
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ description: 'Delay em segundos antes de executar' })
  @IsOptional()
  delay?: number;

  @ApiPropertyOptional({
    description: 'Tentativas máximas em caso de falha',
    default: 3,
  })
  @IsOptional()
  attempts?: number;
}
