import { IsDateString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetAvailableSlotsDto {
  @ApiProperty({
    description: 'Data para buscar horários disponíveis (formato: YYYY-MM-DD)',
    example: '2024-01-15',
    required: true,
  })
  @IsDateString(
    {},
    { message: 'Data deve ser uma data válida no formato YYYY-MM-DD' },
  )
  date: string;

  @ApiProperty({
    description: 'Duração estimada em minutos (padrão: 60)',
    example: 60,
    required: false,
  })
  @IsInt({ message: 'Duração deve ser um número inteiro' })
  @IsOptional()
  @Min(15, { message: 'Duração mínima é 15 minutos' })
  @Max(480, { message: 'Duração máxima é 480 minutos (8 horas)' })
  duration?: number = 60;

  @ApiProperty({
    description: 'ID do elevador (opcional, para filtrar por elevador)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  elevatorId?: string;
}
