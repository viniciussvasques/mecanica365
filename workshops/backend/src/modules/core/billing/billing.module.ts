import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { PrismaModule } from '@database/prisma.module';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module';
import { PlanLimitGuard } from './guards/plan-limit.guard';

@Module({
  imports: [PrismaModule, FeatureFlagsModule],
  controllers: [BillingController],
  providers: [BillingService, PlanLimitGuard],
  exports: [BillingService, PlanLimitGuard],
})
export class BillingModule {}
