import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ElevatorStatus, ElevatorType } from './create-elevator.dto';

export class ElevatorFiltersDto {
  @ApiProperty({
    description: 'Filtrar por nome',
    example: 'Elevador',
    required: false,
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Filtrar por número',
    example: 'ELEV-001',
    required: false,
  })
  @IsString({ message: 'Número deve ser uma string' })
  @IsOptional()
  number?: string;

  @ApiProperty({
    description: 'Filtrar por tipo',
    enum: ElevatorType,
    required: false,
  })
  @IsEnum(ElevatorType, {
    message: 'Tipo deve ser hydraulic, pneumatic ou scissor',
  })
  @IsOptional()
  type?: ElevatorType;

  @ApiProperty({
    description: 'Filtrar por status',
    enum: ElevatorStatus,
    required: false,
  })
  @IsEnum(ElevatorStatus, {
    message: 'Status deve ser free, occupied, maintenance ou scheduled',
  })
  @IsOptional()
  status?: ElevatorStatus;

  @ApiProperty({
    description: 'Página (paginação)',
    example: 1,
    required: false,
    default: 1,
  })
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @Min(1, { message: 'Página deve ser maior ou igual a 1' })
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @ApiProperty({
    description: 'Limite de resultados por página',
    example: 10,
    required: false,
    default: 10,
  })
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Min(1, { message: 'Limite deve ser maior ou igual a 1' })
  @Max(100, { message: 'Limite deve ser menor ou igual a 100' })
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}
