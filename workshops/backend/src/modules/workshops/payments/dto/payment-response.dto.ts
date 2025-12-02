import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus, PaymentMethod } from './payment-status.enum';

export class PaymentResponseDto {
  @ApiProperty({ description: 'ID do pagamento' })
  id: string;

  @ApiProperty({ description: 'ID do tenant' })
  tenantId: string;

  @ApiPropertyOptional({ description: 'ID da fatura' })
  invoiceId?: string;

  @ApiPropertyOptional({
    description: 'Dados da fatura',
  })
  invoice?: {
    id: string;
    invoiceNumber: string;
    total: number;
    status: string;
  };

  @ApiProperty({ description: 'Valor do pagamento' })
  amount: number;

  @ApiProperty({ description: 'Método de pagamento', enum: PaymentMethod })
  method: PaymentMethod;

  @ApiProperty({ description: 'Status do pagamento', enum: PaymentStatus })
  status: PaymentStatus;

  @ApiPropertyOptional({ description: 'Data de pagamento' })
  paidAt?: Date;

  @ApiPropertyOptional({ description: 'ID da transação no gateway' })
  transactionId?: string;

  @ApiProperty({ description: 'Número de parcelas', default: 1 })
  installments: number;

  @ApiPropertyOptional({ description: 'Observações' })
  notes?: string;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}
