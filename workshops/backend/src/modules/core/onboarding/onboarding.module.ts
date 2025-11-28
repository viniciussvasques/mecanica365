import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { PrismaModule } from '../../../database/prisma.module';
import { TenantsModule } from '../tenants/tenants.module';
import { BillingModule } from '../billing/billing.module';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../../shared/email/email.module';

@Module({
  imports: [
    PrismaModule,
    TenantsModule,
    BillingModule,
    UsersModule,
    EmailModule,
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}


