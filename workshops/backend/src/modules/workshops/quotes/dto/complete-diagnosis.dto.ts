import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProblemCategory } from '@modules/workshops/shared/enums/problem-category.enum';

export class CompleteDiagnosisDto {
  @ApiProperty({
    description: 'Categoria do problema identificado',
    enum: ProblemCategory,
    required: false,
  })
  @IsEnum(ProblemCategory, {
    message: 'Categoria deve ser um valor válido',
  })
  @IsOptional()
  identifiedProblemCategory?: ProblemCategory;

  @ApiProperty({
    description: 'Descrição do problema identificado pelo mecânico',
    example: 'Pastilhas de freio desgastadas, necessária troca',
    required: false,
  })
  @IsString({ message: 'Descrição deve ser uma string' })
  @IsOptional()
  identifiedProblemDescription?: string;

  @ApiProperty({
    description: 'ID do problema comum identificado (se aplicável)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString({ message: 'ID do problema deve ser uma string' })
  @IsOptional()
  identifiedProblemId?: string;

  @ApiProperty({
    description: 'Recomendações do mecânico',
    example: 'Trocar pastilhas de freio e verificar discos',
    required: false,
  })
  @IsString({ message: 'Recomendações deve ser uma string' })
  @IsOptional()
  recommendations?: string;

  @ApiProperty({
    description: 'Notas de diagnóstico do mecânico',
    example: 'Veículo apresentou ruído ao frear, pastilhas com 80% de desgaste',
    required: false,
  })
  @IsString({ message: 'Notas de diagnóstico deve ser uma string' })
  @IsOptional()
  diagnosticNotes?: string;

  @ApiProperty({
    description:
      'Tempo estimado de serviço em horas (ex: 2.5 para 2 horas e 30 minutos)',
    example: 3.5,
    required: false,
  })
  @IsNumber({}, { message: 'Tempo estimado deve ser um número' })
  @IsOptional()
  @Min(0.25, { message: 'Tempo estimado mínimo é 0.25 horas (15 minutos)' })
  @Max(24, { message: 'Tempo estimado máximo é 24 horas' })
  estimatedHours?: number;
}
