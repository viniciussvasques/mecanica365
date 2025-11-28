import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsArray } from 'class-validator';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  BillingCycle,
} from './subscription-response.dto';

export class UpdateSubscriptionDto {
  @ApiProperty({
    description: 'Plano da assinatura',
    enum: SubscriptionPlan,
    required: false,
  })
  @IsEnum(SubscriptionPlan)
  @IsOptional()
  plan?: SubscriptionPlan;

  @ApiProperty({
    description: 'Status da assinatura',
    enum: SubscriptionStatus,
    required: false,
  })
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @ApiProperty({
    description: 'Features ativos',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  activeFeatures?: string[];

  @ApiProperty({
    description: 'Limite de service orders (null = ilimitado)',
    nullable: true,
    required: false,
  })
  @IsOptional()
  serviceOrdersLimit?: number | null;

  @ApiProperty({
    description: 'Limite de peças (null = ilimitado)',
    nullable: true,
    required: false,
  })
  @IsOptional()
  partsLimit?: number | null;

  @ApiProperty({
    description: 'Ciclo de cobrança',
    enum: BillingCycle,
    required: false,
  })
  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @ApiProperty({
    description: 'ID da subscription no Stripe',
    required: false,
  })
  @IsString()
  @IsOptional()
  stripeSubscriptionId?: string;

  @ApiProperty({
    description: 'ID do customer no Stripe',
    required: false,
  })
  @IsString()
  @IsOptional()
  stripeCustomerId?: string;
}
