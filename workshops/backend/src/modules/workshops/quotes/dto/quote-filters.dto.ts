import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { QuoteStatus } from './quote-status.enum';

export class QuoteFiltersDto {
  @ApiPropertyOptional({
    description: 'Buscar por número do orçamento',
    example: 'ORC-001',
  })
  @IsString({ message: 'Número deve ser uma string' })
  @IsOptional()
  number?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por status',
    enum: QuoteStatus,
    example: QuoteStatus.ACCEPTED,
  })
  @IsEnum(QuoteStatus, { message: 'Status inválido' })
  @IsOptional()
  status?: QuoteStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por ID do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'ID do cliente deve ser uma string' })
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID do veículo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'ID do veículo deve ser uma string' })
  @IsOptional()
  vehicleId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID do elevador',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'ID do elevador deve ser uma string' })
  @IsOptional()
  elevatorId?: string;

  @ApiPropertyOptional({
    description: 'Data inicial para filtrar por data de criação',
    example: '2024-01-01',
  })
  @IsDateString({}, { message: 'Data inicial deve ser uma data válida' })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Data final para filtrar por data de criação',
    example: '2024-12-31',
  })
  @IsDateString({}, { message: 'Data final deve ser uma data válida' })
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Número da página',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @Min(1, { message: 'Página deve ser maior ou igual a 1' })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Limite de itens por página',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Min(1, { message: 'Limite deve ser maior ou igual a 1' })
  @Max(100, { message: 'Limite deve ser menor ou igual a 100' })
  @IsOptional()
  limit?: number = 20;
}
