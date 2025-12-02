import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckAvailabilityDto {
  @ApiProperty({
    description: 'Data e hora para verificar disponibilidade',
    example: '2024-01-15T10:00:00Z',
    required: true,
  })
  @IsDateString({}, { message: 'Data deve ser uma data válida' })
  date: string;

  @ApiProperty({
    description: 'Duração estimada em minutos',
    example: 60,
    default: 60,
    required: false,
  })
  @IsInt({ message: 'Duração deve ser um número inteiro' })
  @IsOptional()
  @Min(15, { message: 'Duração mínima é 15 minutos' })
  @Max(480, { message: 'Duração máxima é 480 minutos (8 horas)' })
  duration?: number = 60;

  @ApiProperty({
    description:
      'ID do elevador (opcional, para verificar disponibilidade do elevador)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString({ message: 'ID do elevador deve ser uma string' })
  @IsOptional()
  elevatorId?: string;
}
