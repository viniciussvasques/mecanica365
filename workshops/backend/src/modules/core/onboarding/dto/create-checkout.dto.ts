import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlan, BillingCycle } from '../../billing/dto/subscription-response.dto';

export class CreateCheckoutDto {
  @ApiProperty({
    description: 'ID do tenant criado no registro',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'ID do tenant inválido' })
  @IsString()
  tenantId: string;

  @ApiProperty({
    description: 'Plano escolhido',
    enum: SubscriptionPlan,
    example: SubscriptionPlan.WORKSHOPS_STARTER,
  })
  @IsEnum(SubscriptionPlan, { message: 'Plano inválido' })
  plan: SubscriptionPlan;

  @ApiProperty({
    description: 'Ciclo de cobrança',
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
    required: false,
  })
  @IsEnum(BillingCycle, { message: 'Ciclo de cobrança inválido' })
  @IsOptional()
  billingCycle?: BillingCycle;
}
