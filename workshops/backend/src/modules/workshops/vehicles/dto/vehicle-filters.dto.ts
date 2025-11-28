import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class VehicleFiltersDto {
  @ApiProperty({
    description: 'ID do cliente para filtrar veículos',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString({ message: 'customerId deve ser uma string' })
  @IsOptional()
  customerId?: string;

  @ApiProperty({
    description: 'Busca por placa (parcial)',
    example: 'ABC',
    required: false,
  })
  @IsString({ message: 'placa deve ser uma string' })
  @IsOptional()
  placa?: string;

  @ApiProperty({
    description: 'Busca por VIN (parcial)',
    example: '1HGBH41',
    required: false,
  })
  @IsString({ message: 'vin deve ser uma string' })
  @IsOptional()
  vin?: string;

  @ApiProperty({
    description: 'Busca por RENAVAN (parcial)',
    example: '123456789',
    required: false,
  })
  @IsString({ message: 'renavan deve ser uma string' })
  @IsOptional()
  renavan?: string;

  @ApiProperty({
    description: 'Busca por marca',
    example: 'Honda',
    required: false,
  })
  @IsString({ message: 'make deve ser uma string' })
  @IsOptional()
  make?: string;

  @ApiProperty({
    description: 'Busca por modelo',
    example: 'Civic',
    required: false,
  })
  @IsString({ message: 'model deve ser uma string' })
  @IsOptional()
  model?: string;

  @ApiProperty({
    description: 'Número da página',
    example: 1,
    required: false,
    default: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'page deve ser um número inteiro' })
  @IsOptional()
  @Min(1, { message: 'page deve ser maior ou igual a 1' })
  page?: number = 1;

  @ApiProperty({
    description: 'Itens por página',
    example: 20,
    required: false,
    default: 20,
  })
  @Type(() => Number)
  @IsInt({ message: 'limit deve ser um número inteiro' })
  @IsOptional()
  @Min(1, { message: 'limit deve ser maior ou igual a 1' })
  @Max(100, { message: 'limit deve ser menor ou igual a 100' })
  limit?: number = 20;
}

