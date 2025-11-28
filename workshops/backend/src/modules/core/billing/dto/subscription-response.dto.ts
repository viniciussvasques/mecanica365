import { ApiProperty } from '@nestjs/swagger';

export enum SubscriptionPlan {
  WORKSHOPS_STARTER = 'workshops_starter',
  WORKSHOPS_PROFESSIONAL = 'workshops_professional',
  WORKSHOPS_ENTERPRISE = 'workshops_enterprise',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  ANNUAL = 'annual',
}

export class SubscriptionResponseDto {
  @ApiProperty({ description: 'ID da subscription' })
  id: string;

  @ApiProperty({ description: 'ID do tenant' })
  tenantId: string;

  @ApiProperty({
    description: 'Plano da assinatura',
    enum: SubscriptionPlan,
  })
  plan: SubscriptionPlan;

  @ApiProperty({
    description: 'Status da assinatura',
    enum: SubscriptionStatus,
  })
  status: SubscriptionStatus;

  @ApiProperty({ description: 'Início do período atual' })
  currentPeriodStart: Date;

  @ApiProperty({ description: 'Fim do período atual' })
  currentPeriodEnd: Date;

  @ApiProperty({
    description: 'Features ativos',
    type: [String],
  })
  activeFeatures: string[];

  @ApiProperty({
    description: 'Limite de service orders (null = ilimitado)',
    nullable: true,
  })
  serviceOrdersLimit: number | null;

  @ApiProperty({ description: 'Service orders usados no período' })
  serviceOrdersUsed: number;

  @ApiProperty({
    description: 'Limite de peças (null = ilimitado)',
    nullable: true,
  })
  partsLimit: number | null;

  @ApiProperty({
    description: 'ID da subscription no Stripe',
    nullable: true,
  })
  stripeSubscriptionId: string | null;

  @ApiProperty({
    description: 'ID do customer no Stripe',
    nullable: true,
  })
  stripeCustomerId: string | null;

  @ApiProperty({
    description: 'Ciclo de cobrança',
    enum: BillingCycle,
  })
  billingCycle: BillingCycle;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}
