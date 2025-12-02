import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { AppointmentStatus } from './appointment-status.enum';

export class CreateAppointmentDto {
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
    description: 'Data e hora do agendamento',
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
    description: 'Tipo de serviço',
    example: 'Manutenção preventiva',
    required: false,
  })
  @IsString({ message: 'Tipo de serviço deve ser uma string' })
  @IsOptional()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value,
  )
  serviceType?: string;

  @ApiProperty({
    description: 'Observações sobre o agendamento',
    example: 'Cliente prefere manhã',
    required: false,
  })
  @IsString({ message: 'Observações devem ser uma string' })
  @IsOptional()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value,
  )
  notes?: string;

  @ApiProperty({
    description: 'Status do agendamento',
    enum: AppointmentStatus,
    example: AppointmentStatus.SCHEDULED,
    default: AppointmentStatus.SCHEDULED,
    required: false,
  })
  @IsEnum(AppointmentStatus, { message: 'Status inválido' })
  @IsOptional()
  status?: AppointmentStatus = AppointmentStatus.SCHEDULED;
}
