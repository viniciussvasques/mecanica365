import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  IsArray,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { QuoteItemDto } from './quote-item.dto';
import { QuoteStatus } from './quote-status.enum';
import { ProblemCategory } from '@modules/workshops/shared/enums/problem-category.enum';

export class CreateQuoteDto {
  @ApiProperty({
    description: 'ID do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString({ message: 'ID do cliente deve ser uma string' })
  @IsOptional()
  customerId?: string;

  @ApiProperty({
    description: 'ID do veículo',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString({ message: 'ID do veículo deve ser uma string' })
  @IsOptional()
  vehicleId?: string;

  @ApiProperty({
    description: 'ID do elevador (se necessário para o serviço)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString({ message: 'ID do elevador deve ser uma string' })
  @IsOptional()
  elevatorId?: string;

  @ApiProperty({
    description: 'Status do orçamento',
    enum: QuoteStatus,
    example: QuoteStatus.DRAFT,
    default: QuoteStatus.DRAFT,
    required: false,
  })
  @IsEnum(QuoteStatus, { message: 'Status inválido' })
  @IsOptional()
  status?: QuoteStatus = QuoteStatus.DRAFT;

  @ApiProperty({
    description: 'Custo de mão de obra',
    example: 200,
    required: false,
  })
  @IsNumber({}, { message: 'Custo de mão de obra deve ser um número' })
  @IsOptional()
  @Min(0, { message: 'Custo de mão de obra deve ser maior ou igual a 0' })
  laborCost?: number;

  @ApiProperty({
    description: 'Custo de peças',
    example: 300,
    required: false,
  })
  @IsNumber({}, { message: 'Custo de peças deve ser um número' })
  @IsOptional()
  @Min(0, { message: 'Custo de peças deve ser maior ou igual a 0' })
  partsCost?: number;

  @ApiProperty({
    description: 'Desconto aplicado',
    example: 50,
    required: false,
    default: 0,
  })
  @IsNumber({}, { message: 'Desconto deve ser um número' })
  @IsOptional()
  @Min(0, { message: 'Desconto deve ser maior ou igual a 0' })
  discount?: number = 0;

  @ApiProperty({
    description: 'Valor de impostos',
    example: 0,
    required: false,
    default: 0,
  })
  @IsNumber({}, { message: 'Valor de impostos deve ser um número' })
  @IsOptional()
  @Min(0, { message: 'Valor de impostos deve ser maior ou igual a 0' })
  taxAmount?: number = 0;

  @ApiProperty({
    description: 'Data de validade do orçamento',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsDateString({}, { message: 'Data de validade deve ser uma data válida' })
  @IsOptional()
  validUntil?: string;

  @ApiProperty({
    description: 'Itens do orçamento',
    type: [QuoteItemDto],
    example: [
      {
        type: 'service',
        name: 'Troca de óleo',
        description: 'Troca de óleo do motor com filtro',
        quantity: 1,
        unitCost: 150,
        hours: 1.5,
      },
    ],
  })
  @IsArray({ message: 'Itens deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  items: QuoteItemDto[];

  @ApiProperty({
    description: 'Observações do mecânico durante diagnóstico',
    example: 'Veículo apresenta ruído no freio dianteiro',
    required: false,
  })
  @IsString({ message: 'Observações devem ser uma string' })
  @IsOptional()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value,
  )
  diagnosticNotes?: string;

  @ApiProperty({
    description: 'Notas de inspeção',
    example: 'Pastilhas de freio desgastadas, precisa troca',
    required: false,
  })
  @IsString({ message: 'Notas de inspeção devem ser uma string' })
  @IsOptional()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value,
  )
  inspectionNotes?: string;

  @ApiProperty({
    description: 'Fotos da inspeção (URLs)',
    example: ['https://example.com/photo1.jpg'],
    type: [String],
    required: false,
  })
  @IsArray({ message: 'Fotos devem ser um array' })
  @IsString({ each: true, message: 'Cada foto deve ser uma string (URL)' })
  @IsOptional()
  inspectionPhotos?: string[];

  // Problema relatado pelo cliente
  @ApiProperty({
    description: 'Categoria do problema relatado pelo cliente',
    enum: ProblemCategory,
    example: ProblemCategory.FREIOS,
    required: false,
  })
  @IsEnum(ProblemCategory, { message: 'Categoria de problema inválida' })
  @IsOptional()
  reportedProblemCategory?: ProblemCategory;

  @ApiProperty({
    description: 'Descrição detalhada do problema relatado pelo cliente',
    example: 'Barulho no freio ao frear, parece estar rangendo',
    required: false,
  })
  @IsString({ message: 'Descrição do problema deve ser uma string' })
  @IsOptional()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value,
  )
  reportedProblemDescription?: string;

  @ApiProperty({
    description: 'Sintomas relatados pelo cliente',
    example: ['ruído no freio', 'barulho ao frear', 'freio rangendo'],
    type: [String],
    required: false,
  })
  @IsArray({ message: 'Sintomas devem ser um array' })
  @IsString({ each: true, message: 'Cada sintoma deve ser uma string' })
  @IsOptional()
  reportedProblemSymptoms?: string[];

  // Problema identificado pelo mecânico
  @ApiProperty({
    description: 'Categoria do problema identificado pelo mecânico',
    enum: ProblemCategory,
    example: ProblemCategory.FREIOS,
    required: false,
  })
  @IsEnum(ProblemCategory, { message: 'Categoria de problema inválida' })
  @IsOptional()
  identifiedProblemCategory?: ProblemCategory;

  @ApiProperty({
    description: 'Descrição do problema identificado pelo mecânico',
    example: 'Pastilhas de freio desgastadas, necessária troca',
    required: false,
  })
  @IsString({
    message: 'Descrição do problema identificado deve ser uma string',
  })
  @IsOptional()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value,
  )
  identifiedProblemDescription?: string;

  @ApiProperty({
    description:
      'ID do problema comum identificado (referência a CommonProblem)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString({ message: 'ID do problema comum deve ser uma string' })
  @IsOptional()
  identifiedProblemId?: string;

  @ApiProperty({
    description:
      'Recomendações do mecânico (troca de peça, manutenção preventiva, etc.)',
    example:
      'Recomendada troca de pastilhas e verificação do sistema de freios completo',
    required: false,
  })
  @IsString({ message: 'Recomendações devem ser uma string' })
  @IsOptional()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value,
  )
  recommendations?: string;
}
