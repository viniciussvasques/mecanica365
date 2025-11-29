import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class StartUsageDto {
  @ApiProperty({
    description: 'ID da Ordem de Serviço associada',
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
    description: 'Observações sobre o uso do elevador',
    example: 'Veículo com problema no freio',
    required: false,
  })
  @IsString({ message: 'Observações devem ser uma string' })
  @IsOptional()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value,
  )
  notes?: string;
}

