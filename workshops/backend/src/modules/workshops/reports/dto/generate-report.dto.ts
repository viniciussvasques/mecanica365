import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
} from 'class-validator';
import { ReportType, ReportFormat } from './report-type.enum';

export class GenerateReportDto {
  @ApiProperty({
    description: 'Tipo de relatório',
    enum: ReportType,
  })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiPropertyOptional({
    description: 'Formato de exportação',
    enum: ReportFormat,
    default: ReportFormat.PDF,
  })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat;

  @ApiPropertyOptional({
    description: 'Data inicial',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Data final',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filtros adicionais (dependem do tipo de relatório)',
    type: Object,
    additionalProperties: true,
  })
  @IsOptional()
  filters?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Campos a incluir no relatório',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];
}
