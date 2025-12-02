import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportType, ReportFormat } from './report-type.enum';

export class ReportResponseDto {
  @ApiProperty({ description: 'ID do relatório' })
  id: string;

  @ApiProperty({ description: 'Tipo de relatório', enum: ReportType })
  type: ReportType;

  @ApiProperty({ description: 'Formato do relatório', enum: ReportFormat })
  format: ReportFormat;

  @ApiProperty({ description: 'URL para download do relatório' })
  downloadUrl: string;

  @ApiPropertyOptional({ description: 'Nome do arquivo' })
  filename?: string;

  @ApiProperty({ description: 'Data de geração' })
  generatedAt: Date;

  @ApiPropertyOptional({ description: 'Tamanho do arquivo em bytes' })
  fileSize?: number;

  @ApiPropertyOptional({ description: 'Resumo dos dados do relatório' })
  summary?: Record<string, unknown>;
}
