import { ApiProperty } from '@nestjs/swagger';
import { QuoteStatus } from './quote-status.enum';
import { QuoteItemType } from './quote-item.dto';

export class QuoteItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: QuoteItemType })
  type: QuoteItemType;

  @ApiProperty({ nullable: true })
  serviceId?: string;

  @ApiProperty({ nullable: true })
  partId?: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  description?: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitCost: number;

  @ApiProperty()
  totalCost: number;

  @ApiProperty({ nullable: true })
  hours?: number;
}

export class QuoteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  number: string;

  @ApiProperty({ nullable: true })
  customerId?: string;

  @ApiProperty({ nullable: true })
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };

  @ApiProperty({ nullable: true })
  vehicleId?: string;

  @ApiProperty({ nullable: true })
  vehicle?: {
    id: string;
    placa?: string;
    make?: string;
    model?: string;
    year?: number;
  };

  @ApiProperty({ nullable: true })
  elevatorId?: string;

  @ApiProperty({ nullable: true })
  elevator?: {
    id: string;
    name: string;
    number: string;
    status: string;
  };

  @ApiProperty({ nullable: true })
  serviceOrderId?: string;

  @ApiProperty({ enum: QuoteStatus })
  status: QuoteStatus;

  @ApiProperty()
  version: number;

  @ApiProperty({ nullable: true })
  parentQuoteId?: string;

  @ApiProperty({ nullable: true })
  laborCost?: number;

  @ApiProperty({ nullable: true })
  partsCost?: number;

  @ApiProperty()
  totalCost: number;

  @ApiProperty()
  discount: number;

  @ApiProperty()
  taxAmount: number;

  @ApiProperty({ nullable: true })
  expiresAt?: Date;

  @ApiProperty({ nullable: true })
  validUntil?: Date;

  @ApiProperty({ nullable: true })
  sentAt?: Date;

  @ApiProperty({ nullable: true })
  viewedAt?: Date;

  @ApiProperty({ nullable: true })
  acceptedAt?: Date;

  @ApiProperty({ nullable: true })
  rejectedAt?: Date;

  @ApiProperty({ nullable: true })
  rejectedReason?: string;

  @ApiProperty({ nullable: true })
  customerSignature?: string;

  @ApiProperty({ nullable: true })
  convertedAt?: Date;

  @ApiProperty({ nullable: true })
  convertedToServiceOrderId?: string;

  // Problema relatado pelo cliente
  @ApiProperty({ nullable: true })
  reportedProblemCategory?: string;

  @ApiProperty({ nullable: true })
  reportedProblemDescription?: string;

  @ApiProperty({ type: [String] })
  reportedProblemSymptoms: string[];

  // Problema identificado pelo mecânico
  @ApiProperty({ nullable: true })
  identifiedProblemCategory?: string;

  @ApiProperty({ nullable: true })
  identifiedProblemDescription?: string;

  @ApiProperty({ nullable: true })
  identifiedProblemId?: string;

  // Diagnóstico e observações
  @ApiProperty({ nullable: true })
  diagnosticNotes?: string;

  @ApiProperty({ nullable: true })
  inspectionNotes?: string;

  @ApiProperty({ type: [String] })
  inspectionPhotos: string[];

  // Recomendações
  @ApiProperty({ nullable: true })
  recommendations?: string;

  @ApiProperty({ type: [QuoteItemResponseDto] })
  items: QuoteItemResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
