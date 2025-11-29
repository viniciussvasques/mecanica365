import { ApiProperty } from '@nestjs/swagger';
import { ElevatorType, ElevatorStatus } from './create-elevator.dto';

export class ElevatorResponseDto {
  @ApiProperty({ description: 'ID do elevador', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'ID do tenant', example: 'uuid' })
  tenantId: string;

  @ApiProperty({ description: 'Nome do elevador', example: 'Elevador 1' })
  name: string;

  @ApiProperty({
    description: 'Número do elevador',
    example: 'ELEV-001',
  })
  number: string;

  @ApiProperty({
    description: 'Tipo do elevador',
    enum: ElevatorType,
    example: ElevatorType.HYDRAULIC,
  })
  type: ElevatorType;

  @ApiProperty({
    description: 'Capacidade em toneladas',
    example: 3.5,
  })
  capacity: number;

  @ApiProperty({
    description: 'Status do elevador',
    enum: ElevatorStatus,
    example: ElevatorStatus.FREE,
  })
  status: ElevatorStatus;

  @ApiProperty({
    description: 'Localização do elevador',
    example: 'Setor A - Box 1',
    required: false,
  })
  location?: string | null;

  @ApiProperty({
    description: 'Observações',
    example: 'Revisão anual em dezembro',
    required: false,
  })
  notes?: string | null;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
