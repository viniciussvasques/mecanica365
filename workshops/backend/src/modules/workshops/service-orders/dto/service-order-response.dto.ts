import { ApiProperty } from '@nestjs/swagger';
import { ServiceOrderStatus } from './service-order-status.enum';

export class ServiceOrderResponseDto {
  @ApiProperty({
    description: 'ID único da ordem de serviço',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'ID do tenant',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  tenantId: string;

  @ApiProperty({
    description: 'Número da ordem de serviço',
    example: 'OS-001',
  })
  number: string;

  @ApiProperty({
    description: 'ID do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  customerId?: string;

  @ApiProperty({
    description: 'Informações do cliente',
    nullable: true,
  })
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };

  @ApiProperty({
    description: 'VIN do veículo',
    example: '1HGBH41JXMN109186',
    nullable: true,
  })
  vehicleVin?: string;

  @ApiProperty({
    description: 'Placa do veículo',
    example: 'ABC1234',
    nullable: true,
  })
  vehiclePlaca?: string;

  @ApiProperty({
    description: 'Marca do veículo',
    example: 'Honda',
    nullable: true,
  })
  vehicleMake?: string;

  @ApiProperty({
    description: 'Modelo do veículo',
    example: 'Civic',
    nullable: true,
  })
  vehicleModel?: string;

  @ApiProperty({
    description: 'Ano do veículo',
    example: 2020,
    nullable: true,
  })
  vehicleYear?: number;

  @ApiProperty({
    description: 'Quilometragem do veículo',
    example: 50000,
    nullable: true,
  })
  vehicleMileage?: number;

  @ApiProperty({
    description: 'ID do mecânico responsável',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  technicianId?: string;

  @ApiProperty({
    description: 'Informações do mecânico',
    nullable: true,
  })
  technician?: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty({
    description: 'Status da ordem de serviço',
    enum: ServiceOrderStatus,
    example: ServiceOrderStatus.SCHEDULED,
  })
  status: ServiceOrderStatus;

  @ApiProperty({
    description: 'Data/hora do agendamento',
    example: '2024-01-15T10:00:00Z',
    nullable: true,
  })
  appointmentDate?: Date;

  @ApiProperty({
    description: 'Data/hora de check-in',
    example: '2024-01-15T10:00:00Z',
    nullable: true,
  })
  checkInDate?: Date;

  @ApiProperty({
    description: 'Quilometragem no check-in',
    example: 50000,
    nullable: true,
  })
  checkInKm?: number;

  @ApiProperty({
    description: 'Nível de combustível no check-in',
    example: '1/4',
    nullable: true,
  })
  checkInFuelLevel?: string;

  // Problema relatado pelo cliente
  @ApiProperty({
    description: 'Categoria do problema relatado pelo cliente',
    example: 'freios',
    nullable: true,
  })
  reportedProblemCategory?: string;

  @ApiProperty({
    description: 'Descrição do problema relatado pelo cliente',
    example: 'Barulho no freio ao frear',
    nullable: true,
  })
  reportedProblemDescription?: string;

  @ApiProperty({
    description: 'Sintomas relatados pelo cliente',
    example: ['ruído no freio', 'barulho ao frear'],
    type: [String],
  })
  reportedProblemSymptoms: string[];

  // Problema identificado pelo mecânico
  @ApiProperty({
    description: 'Categoria do problema identificado pelo mecânico',
    example: 'freios',
    nullable: true,
  })
  identifiedProblemCategory?: string;

  @ApiProperty({
    description: 'Descrição do problema identificado pelo mecânico',
    example: 'Pastilhas de freio desgastadas',
    nullable: true,
  })
  identifiedProblemDescription?: string;

  @ApiProperty({
    description: 'ID do problema comum identificado',
    nullable: true,
  })
  identifiedProblemId?: string;

  // Observações e diagnóstico
  @ApiProperty({
    description: 'Notas de inspeção',
    example: 'Freios desgastados, precisa troca',
    nullable: true,
  })
  inspectionNotes?: string;

  @ApiProperty({
    description: 'Fotos da inspeção',
    example: ['https://example.com/photo1.jpg'],
    type: [String],
  })
  inspectionPhotos: string[];

  @ApiProperty({
    description: 'Observações do mecânico durante diagnóstico',
    example: 'Pastilhas com 80% de desgaste',
    nullable: true,
  })
  diagnosticNotes?: string;

  @ApiProperty({
    description: 'Recomendações do mecânico',
    example: 'Recomendada troca de pastilhas',
    nullable: true,
  })
  recommendations?: string;

  @ApiProperty({
    description: 'Horas estimadas',
    example: 2.5,
    nullable: true,
  })
  estimatedHours?: number;

  @ApiProperty({
    description: 'Custo de mão de obra',
    example: 150,
    nullable: true,
  })
  laborCost?: number;

  @ApiProperty({
    description: 'Custo de peças',
    example: 300,
    nullable: true,
  })
  partsCost?: number;

  @ApiProperty({
    description: 'Custo total',
    example: 450,
    nullable: true,
  })
  totalCost?: number;

  @ApiProperty({
    description: 'Desconto aplicado',
    example: 50,
    nullable: true,
  })
  discount?: number;

  @ApiProperty({
    description: 'Horas reais trabalhadas',
    example: 2.75,
    nullable: true,
  })
  actualHours?: number;

  @ApiProperty({
    description: 'Data/hora de início',
    example: '2024-01-15T10:00:00Z',
    nullable: true,
  })
  startedAt?: Date;

  @ApiProperty({
    description: 'Data/hora de conclusão',
    example: '2024-01-15T14:30:00Z',
    nullable: true,
  })
  completedAt?: Date;

  @ApiProperty({
    description: 'ID da fatura associada',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  invoiceId?: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-15T11:00:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Informações do elevador',
    nullable: true,
  })
  elevator?: {
    id: string;
    name: string;
    number: string;
    status: string;
  };

  @ApiProperty({
    description: 'Informações do orçamento relacionado',
    nullable: true,
  })
  quote?: {
    id: string;
    number: string;
    totalCost: number;
  };

  @ApiProperty({
    description: 'Itens da ordem de serviço',
    type: 'array',
    required: false,
  })
  items?: Array<{
    id?: string;
    serviceId?: string;
    partId?: string;
    name: string;
    description?: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    hours?: number;
  }>;

  // Integrações com novos módulos
  @ApiProperty({ type: [Object], required: false })
  attachments?: Array<{
    id: string;
    type: string;
    url: string;
    originalName: string;
  }>;

  @ApiProperty({ type: [Object], required: false })
  checklists?: Array<{
    id: string;
    checklistType: string;
    name: string;
    status: string;
  }>;
}
