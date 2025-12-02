import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  InvoiceStatus,
  PaymentStatus,
  InvoiceType,
} from './invoice-status.enum';

export class InvoiceItemResponseDto {
  @ApiProperty({ description: 'ID do item' })
  id: string;

  @ApiProperty({ description: 'Tipo do item', enum: ['service', 'part'] })
  type: string;

  @ApiProperty({ description: 'Nome do item' })
  name: string;

  @ApiPropertyOptional({ description: 'Descrição do item' })
  description?: string;

  @ApiProperty({ description: 'Quantidade' })
  quantity: number;

  @ApiProperty({ description: 'Preço unitário' })
  unitPrice: number;

  @ApiProperty({ description: 'Preço total' })
  totalPrice: number;
}

export class InvoiceResponseDto {
  @ApiProperty({ description: 'ID da fatura' })
  id: string;

  @ApiProperty({ description: 'ID do tenant' })
  tenantId: string;

  @ApiProperty({ description: 'Número da fatura' })
  invoiceNumber: string;

  @ApiPropertyOptional({ description: 'ID da ordem de serviço' })
  serviceOrderId?: string;

  @ApiPropertyOptional({ description: 'ID do cliente' })
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Dados do cliente',
  })
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };

  @ApiPropertyOptional({
    description: 'Dados da ordem de serviço',
  })
  serviceOrder?: {
    id: string;
    number: string;
    status: string;
  };

  @ApiProperty({ description: 'Tipo de fatura', enum: InvoiceType })
  type: InvoiceType;

  @ApiProperty({ description: 'Valor total' })
  total: number;

  @ApiProperty({ description: 'Valor do desconto' })
  discount: number;

  @ApiProperty({ description: 'Valor do imposto' })
  taxAmount: number;

  @ApiPropertyOptional({ description: 'Chave da NFe' })
  nfeKey?: string;

  @ApiPropertyOptional({ description: 'URL do XML da NFe' })
  nfeXmlUrl?: string;

  @ApiPropertyOptional({ description: 'URL do PDF da NFe' })
  nfePdfUrl?: string;

  @ApiPropertyOptional({ description: 'Status da NFe' })
  nfeStatus?: string;

  @ApiPropertyOptional({ description: 'Método de pagamento' })
  paymentMethod?: string;

  @ApiProperty({ description: 'Status do pagamento', enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @ApiPropertyOptional({ description: 'Data de pagamento' })
  paidAt?: Date;

  @ApiProperty({ description: 'Status da fatura', enum: InvoiceStatus })
  status: InvoiceStatus;

  @ApiPropertyOptional({ description: 'Data de emissão' })
  issuedAt?: Date;

  @ApiPropertyOptional({ description: 'Data de vencimento' })
  dueDate?: Date;

  @ApiProperty({
    description: 'Itens da fatura',
    type: [InvoiceItemResponseDto],
  })
  items: InvoiceItemResponseDto[];

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}
