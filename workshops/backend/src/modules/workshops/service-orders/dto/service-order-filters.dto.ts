import { IsString, IsOptional, IsInt, IsEnum, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceOrderStatus } from './service-order-status.enum';

export class ServiceOrderFiltersDto {
  @ApiPropertyOptional({
    description: 'Buscar por número da OS',
    example: 'OS-001',
  })
  @IsString({ message: 'Número deve ser uma string' })
  @IsOptional()
  number?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por status',
    enum: ServiceOrderStatus,
    example: ServiceOrderStatus.IN_PROGRESS,
  })
  @IsEnum(ServiceOrderStatus, { message: 'Status inválido' })
  @IsOptional()
  status?: ServiceOrderStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por ID do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'ID do cliente deve ser uma string' })
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID do mecânico',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'ID do mecânico deve ser uma string' })
  @IsOptional()
  technicianId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por placa do veículo',
    example: 'ABC1234',
  })
  @IsString({ message: 'Placa deve ser uma string' })
  @IsOptional()
  vehiclePlaca?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por VIN do veículo',
    example: '1HGBH41JXMN109186',
  })
  @IsString({ message: 'VIN deve ser uma string' })
  @IsOptional()
  vehicleVin?: string;

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

