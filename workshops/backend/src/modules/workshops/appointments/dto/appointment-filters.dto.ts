import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { AppointmentStatus } from './appointment-status.enum';

export class AppointmentFiltersDto {
  @ApiProperty({
    description: 'ID do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString({ message: 'ID do cliente deve ser uma string' })
  @IsOptional()
  customerId?: string;

  @ApiProperty({
    description: 'ID da ordem de serviço',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString({ message: 'ID da ordem de serviço deve ser uma string' })
  @IsOptional()
  serviceOrderId?: string;

  @ApiProperty({
    description: 'ID do mecânico responsável',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString({ message: 'ID do mecânico deve ser uma string' })
  @IsOptional()
  assignedToId?: string;

  @ApiProperty({
    description: 'Status do agendamento',
    enum: AppointmentStatus,
    required: false,
  })
  @IsEnum(AppointmentStatus, { message: 'Status inválido' })
  @IsOptional()
  status?: AppointmentStatus;

  @ApiProperty({
    description: 'Data inicial para filtro',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsDateString({}, { message: 'Data inicial deve ser uma data válida' })
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'Data final para filtro',
    example: '2024-01-31T23:59:59Z',
    required: false,
  })
  @IsDateString({}, { message: 'Data final deve ser uma data válida' })
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Página para paginação',
    example: 1,
    default: 1,
    required: false,
  })
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @IsOptional()
  @Min(1, { message: 'Página deve ser maior ou igual a 1' })
  @Transform(({ value }): number => Number.parseInt(value, 10))
  page?: number = 1;

  @ApiProperty({
    description: 'Itens por página',
    example: 10,
    default: 10,
    required: false,
  })
  @IsInt({ message: 'Itens por página deve ser um número inteiro' })
  @IsOptional()
  @Min(1, { message: 'Itens por página deve ser maior ou igual a 1' })
  @Transform(({ value }): number => Number.parseInt(value, 10))
  limit?: number = 10;
}
