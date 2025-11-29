import { ApiProperty } from '@nestjs/swagger';

export class UsageResponseDto {
  @ApiProperty({
    description: 'ID do uso do elevador',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'ID do elevador',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  elevatorId: string;

  @ApiProperty({
    description: 'Informações do elevador',
  })
  elevator: {
    id: string;
    name: string;
    number: string;
    status: string;
  };

  @ApiProperty({
    description: 'ID da Ordem de Serviço',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  serviceOrderId?: string;

  @ApiProperty({
    description: 'Informações da Ordem de Serviço',
    nullable: true,
  })
  serviceOrder?: {
    id: string;
    number: string;
    customer?: {
      id: string;
      name: string;
    };
    technician?: {
      id: string;
      name: string;
    };
  };

  @ApiProperty({
    description: 'ID do veículo',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  vehicleId?: string;

  @ApiProperty({
    description: 'Informações do veículo',
    nullable: true,
  })
  vehicle?: {
    id: string;
    placa?: string;
    make?: string;
    model?: string;
    year?: number;
    customer?: {
      id: string;
      name: string;
    };
  };

  @ApiProperty({
    description: 'Data/hora de início do uso',
    example: '2024-01-15T10:00:00Z',
  })
  startTime: Date;

  @ApiProperty({
    description: 'Data/hora de fim do uso',
    example: '2024-01-15T14:30:00Z',
    nullable: true,
  })
  endTime?: Date;

  @ApiProperty({
    description: 'Duração do uso em minutos',
    example: 270,
    nullable: true,
  })
  durationMinutes?: number;

  @ApiProperty({
    description: 'Observações',
    example: 'Serviço de freio completo',
    nullable: true,
  })
  notes?: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:00:00Z',
  })
  createdAt: Date;
}

