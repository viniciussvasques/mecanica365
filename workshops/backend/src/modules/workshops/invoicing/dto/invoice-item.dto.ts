import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum InvoiceItemType {
  SERVICE = 'service',
  PART = 'part',
}

export class InvoiceItemDto {
  @ApiProperty({ description: 'Tipo do item', enum: InvoiceItemType })
  @IsEnum(InvoiceItemType)
  type: InvoiceItemType;

  @ApiProperty({ description: 'Nome do item' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição do item' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Quantidade', minimum: 1 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ description: 'Preço unitário', minimum: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitPrice: number;

  @ApiProperty({ description: 'Preço total', minimum: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  totalPrice: number;
}
