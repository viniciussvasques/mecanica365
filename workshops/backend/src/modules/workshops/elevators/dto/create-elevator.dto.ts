import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum ElevatorType {
  HYDRAULIC = 'hydraulic',
  PNEUMATIC = 'pneumatic',
  SCISSOR = 'scissor',
}

export enum ElevatorStatus {
  FREE = 'free',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  SCHEDULED = 'scheduled',
}

export class CreateElevatorDto {
  @ApiProperty({
    description: 'Nome do elevador',
    example: 'Elevador 1',
    required: true,
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Número do elevador (identificador único por tenant)',
    example: 'ELEV-001',
    required: true,
  })
  @IsString({ message: 'Número deve ser uma string' })
  @MaxLength(50, { message: 'Número deve ter no máximo 50 caracteres' })
  number: string;

  @ApiProperty({
    description: 'Tipo do elevador',
    enum: ElevatorType,
    example: ElevatorType.HYDRAULIC,
    required: false,
    default: ElevatorType.HYDRAULIC,
  })
  @IsEnum(ElevatorType, {
    message: 'Tipo deve ser hydraulic, pneumatic ou scissor',
  })
  @IsOptional()
  type?: ElevatorType;

  @ApiProperty({
    description: 'Capacidade do elevador em toneladas',
    example: 3.5,
    required: true,
  })
  @IsNumber({}, { message: 'Capacidade deve ser um número' })
  @Min(0.1, { message: 'Capacidade deve ser maior que 0' })
  @Transform(({ value }): number => {
    if (typeof value === 'string') {
      return Number.parseFloat(value);
    }
    return value as number;
  })
  capacity: number;

  @ApiProperty({
    description: 'Status inicial do elevador',
    enum: ElevatorStatus,
    example: ElevatorStatus.FREE,
    required: false,
    default: ElevatorStatus.FREE,
  })
  @IsEnum(ElevatorStatus, {
    message: 'Status deve ser free, occupied, maintenance ou scheduled',
  })
  @IsOptional()
  status?: ElevatorStatus;

  @ApiProperty({
    description: 'Localização do elevador na oficina',
    example: 'Setor A - Box 1',
    required: false,
  })
  @IsString({ message: 'Localização deve ser uma string' })
  @IsOptional()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value,
  )
  @MaxLength(200, { message: 'Localização deve ter no máximo 200 caracteres' })
  location?: string;

  @ApiProperty({
    description: 'Observações sobre o elevador',
    example: 'Revisão anual em dezembro',
    required: false,
  })
  @IsString({ message: 'Observações devem ser uma string' })
  @IsOptional()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value,
  )
  @MaxLength(500, { message: 'Observações devem ter no máximo 500 caracteres' })
  notes?: string;
}
