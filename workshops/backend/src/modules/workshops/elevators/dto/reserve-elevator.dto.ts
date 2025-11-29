import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class ReserveElevatorDto {
  @ApiProperty({
    description: 'ID da Ordem de Serviço que reservará o elevador',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString({ message: 'ID da OS deve ser uma string' })
  @IsOptional()
  serviceOrderId?: string;

  @ApiProperty({
    description: 'ID do veículo que será colocado no elevador',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString({ message: 'ID do veículo deve ser uma string' })
  @IsOptional()
  vehicleId?: string;

  @ApiProperty({
    description: 'Data/hora prevista para início do uso',
    example: '2024-01-15T10:00:00Z',
    required: false,
  })
  @IsDateString({}, { message: 'Data de início deve ser uma data válida' })
  @IsOptional()
  scheduledStartTime?: string;

  @ApiProperty({
    description: 'Observações sobre a reserva',
    example: 'Reservado para manutenção preventiva',
    required: false,
  })
  @IsString({ message: 'Observações devem ser uma string' })
  @IsOptional()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value,
  )
  notes?: string;
}

