import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  InvoiceType,
  InvoiceStatus,
  PaymentStatus,
  PaymentPreference,
} from './invoice-status.enum';
import { InvoiceItemDto } from './invoice-item.dto';

export class UpdateInvoiceDto {
  @ApiPropertyOptional({
    description: 'ID do cliente',
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Tipo de fatura',
    enum: InvoiceType,
  })
  @IsOptional()
  @IsEnum(InvoiceType)
  type?: InvoiceType;

  @ApiPropertyOptional({
    description: 'Itens da fatura',
    type: [InvoiceItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items?: InvoiceItemDto[];

  @ApiPropertyOptional({
    description: 'Valor total',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  total?: number;

  @ApiPropertyOptional({
    description: 'Valor do desconto',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discount?: number;

  @ApiPropertyOptional({
    description: 'Valor do imposto',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  taxAmount?: number;

  @ApiPropertyOptional({
    description: 'Método de pagamento',
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({
    description: 'Preferência de pagamento',
    enum: PaymentPreference,
  })
  @IsOptional()
  @IsEnum(PaymentPreference)
  paymentPreference?: PaymentPreference;

  @ApiPropertyOptional({
    description: 'Gateway usado para pagamento',
  })
  @IsOptional()
  @IsString()
  paymentGatewayId?: string;

  @ApiPropertyOptional({
    description: 'Status do pagamento',
    enum: PaymentStatus,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({
    description: 'Status da fatura',
    enum: InvoiceStatus,
  })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiPropertyOptional({
    description: 'Data de vencimento',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Chave da NFe',
  })
  @IsOptional()
  @IsString()
  nfeKey?: string;

  @ApiPropertyOptional({
    description: 'URL do XML da NFe',
  })
  @IsOptional()
  @IsString()
  nfeXmlUrl?: string;

  @ApiPropertyOptional({
    description: 'URL do PDF da NFe',
  })
  @IsOptional()
  @IsString()
  nfePdfUrl?: string;

  @ApiPropertyOptional({
    description: 'Status da NFe',
  })
  @IsOptional()
  @IsString()
  nfeStatus?: string;
}
