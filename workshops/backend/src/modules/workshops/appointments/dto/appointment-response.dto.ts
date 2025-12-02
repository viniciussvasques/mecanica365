import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from './appointment-status.enum';

export class AppointmentResponseDto {
  @ApiProperty({
    description: 'ID do agendamento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'ID do tenant',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  tenantId: string;

  @ApiProperty({
    description: 'ID do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  customerId?: string;

  @ApiProperty({
    description: 'ID da ordem de serviço',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  serviceOrderId?: string;

  @ApiProperty({
    description: 'ID do mecânico responsável',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  assignedToId?: string;

  @ApiProperty({
    description: 'Data e hora do agendamento',
    example: '2024-01-15T10:00:00Z',
  })
  date: Date;

  @ApiProperty({
    description: 'Duração estimada em minutos',
    example: 60,
  })
  duration: number;

  @ApiProperty({
    description: 'Tipo de serviço',
    example: 'Manutenção preventiva',
    required: false,
  })
  serviceType?: string;

  @ApiProperty({
    description: 'Observações sobre o agendamento',
    example: 'Cliente prefere manhã',
    required: false,
  })
  notes?: string;

  @ApiProperty({
    description: 'Status do agendamento',
    enum: AppointmentStatus,
    example: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @ApiProperty({
    description: 'Indica se lembrete foi enviado',
    example: false,
  })
  reminderSent: boolean;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-15T10:00:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Cliente (se incluído)',
    required: false,
  })
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };

  @ApiProperty({
    description: 'Ordem de serviço (se incluída)',
    required: false,
  })
  serviceOrder?: {
    id: string;
    number: string;
    status: string;
  };

  @ApiProperty({
    description: 'Mecânico responsável (se incluído)',
    required: false,
  })
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
}
