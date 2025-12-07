import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
  MaxLength,
  IsInt,
} from 'class-validator';

export class CreatePlanDto {
  @ApiProperty({
    description: 'Código único do plano',
    example: 'workshops_starter',
  })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'Nome do plano', example: 'Starter' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Descrição do plano', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Preço mensal', example: 99 })
  @IsNumber()
  @Min(0)
  monthlyPrice: number;

  @ApiProperty({ description: 'Preço anual', example: 990 })
  @IsNumber()
  @Min(0)
  annualPrice: number;

  @ApiProperty({
    description: 'Limite de ordens de serviço (null = ilimitado)',
    required: false,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  serviceOrdersLimit?: number | null;

  @ApiProperty({
    description: 'Limite de peças (null = ilimitado)',
    required: false,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  partsLimit?: number | null;

  @ApiProperty({
    description: 'Limite de usuários (null = ilimitado)',
    required: false,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  usersLimit?: number | null;

  @ApiProperty({
    description: 'Features incluídas',
    example: ['basic_service_orders', 'basic_customers'],
  })
  @IsArray()
  @IsString({ each: true })
  features: string[];

  @ApiProperty({ description: 'Plano ativo', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Plano padrão para novos tenants',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({ description: 'Ordem de exibição', default: 0 })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiProperty({
    description: 'Texto de destaque (ex: Popular)',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  highlightText?: string;

  @ApiProperty({ description: 'ID do preço mensal no Stripe', required: false })
  @IsString()
  @IsOptional()
  stripePriceIdMonthly?: string;

  @ApiProperty({ description: 'ID do preço anual no Stripe', required: false })
  @IsString()
  @IsOptional()
  stripePriceIdAnnual?: string;

  @ApiProperty({ description: 'ID do produto no Stripe', required: false })
  @IsString()
  @IsOptional()
  stripeProductId?: string;
}
