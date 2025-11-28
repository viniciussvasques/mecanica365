import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { SubscriptionPlan } from './subscription-response.dto';

export class UpgradeSubscriptionDto {
  @ApiProperty({
    description: 'Novo plano para upgrade',
    enum: SubscriptionPlan,
    example: SubscriptionPlan.WORKSHOPS_PROFESSIONAL,
  })
  @IsEnum(SubscriptionPlan)
  newPlan: SubscriptionPlan;
}


