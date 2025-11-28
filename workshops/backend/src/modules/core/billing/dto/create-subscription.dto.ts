import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SubscriptionPlan, BillingCycle } from './subscription-response.dto';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'ID do tenant',
    example: 'uuid-do-tenant',
  })
  @IsString()
  tenantId: string;

  @ApiProperty({
    description: 'Plano da assinatura',
    enum: SubscriptionPlan,
    example: SubscriptionPlan.WORKSHOPS_STARTER,
  })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiProperty({
    description: 'Ciclo de cobrança',
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
    required: false,
  })
  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @ApiProperty({
    description: 'ID da subscription no Stripe (opcional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  stripeSubscriptionId?: string;

  @ApiProperty({
    description: 'ID do customer no Stripe (opcional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  stripeCustomerId?: string;
}
