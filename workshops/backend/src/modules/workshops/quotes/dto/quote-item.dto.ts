import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsEnum,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum QuoteItemType {
  SERVICE = 'service',
  PART = 'part',
}

export class QuoteItemDto {
  @ApiProperty({
    description: 'Tipo do item (service ou part)',
    enum: QuoteItemType,
    example: QuoteItemType.SERVICE,
  })
  @IsEnum(QuoteItemType, { message: 'Tipo deve ser "service" ou "part"' })
  type: QuoteItemType;

  @ApiProperty({
    description: 'ID do serviço (se tipo for service)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString({ message: 'ID do serviço deve ser uma string' })
  @IsOptional()
  @ValidateIf((o) => (o as QuoteItemDto).type === QuoteItemType.SERVICE)
  serviceId?: string;

  @ApiProperty({
    description: 'ID da peça (se tipo for part)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString({ message: 'ID da peça deve ser uma string' })
  @IsOptional()
  @ValidateIf((o) => (o as QuoteItemDto).type === QuoteItemType.PART)
  partId?: string;

  @ApiProperty({
    description: 'Nome do serviço ou peça',
    example: 'Troca de óleo',
  })
  @IsString({ message: 'Nome deve ser uma string' })
  name: string;

  @ApiProperty({
    description: 'Descrição detalhada',
    example: 'Troca de óleo do motor com filtro',
    required: false,
  })
  @IsString({ message: 'Descrição deve ser uma string' })
  @IsOptional()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value,
  )
  description?: string;

  @ApiProperty({
    description: 'Quantidade',
    example: 1,
    default: 1,
  })
  @IsInt({ message: 'Quantidade deve ser um número inteiro' })
  @Min(1, { message: 'Quantidade deve ser maior ou igual a 1' })
  quantity: number = 1;

  @ApiProperty({
    description: 'Custo unitário',
    example: 150.0,
  })
  @IsNumber({}, { message: 'Custo unitário deve ser um número' })
  @Min(0, { message: 'Custo unitário deve ser maior ou igual a 0' })
  unitCost: number;

  @ApiProperty({
    description: 'Horas estimadas (apenas para serviços)',
    example: 1.5,
    required: false,
  })
  @IsNumber({}, { message: 'Horas deve ser um número' })
  @IsOptional()
  @Min(0, { message: 'Horas deve ser maior ou igual a 0' })
  @ValidateIf((o) => (o as QuoteItemDto).type === QuoteItemType.SERVICE)
  hours?: number;
}
