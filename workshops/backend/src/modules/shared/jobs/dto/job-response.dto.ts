import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobType, JobStatus } from './create-job.dto';

export class JobResponseDto {
  @ApiProperty({ description: 'ID do job' })
  id: string;

  @ApiProperty({ description: 'Tipo do job', enum: JobType })
  type: JobType;

  @ApiProperty({ description: 'Status do job', enum: JobStatus })
  status: JobStatus;

  @ApiProperty({ description: 'Dados do job' })
  data: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Prioridade' })
  priority?: number;

  @ApiPropertyOptional({ description: 'Tentativas realizadas' })
  attempts?: number;

  @ApiPropertyOptional({ description: 'Erro (se falhou)' })
  error?: string;

  @ApiPropertyOptional({ description: 'Resultado (se completado)' })
  result?: Record<string, unknown>;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Data de processamento' })
  processedAt?: Date;

  @ApiPropertyOptional({ description: 'Data de conclusão' })
  completedAt?: Date;
}
