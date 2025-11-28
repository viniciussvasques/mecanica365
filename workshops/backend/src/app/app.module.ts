import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../database/prisma.module';
import { HealthModule } from '../health/health.module';
import { TenantsModule } from '../modules/core/tenants/tenants.module';
import { AuthModule } from '../modules/core/auth/auth.module';
import { UsersModule } from '../modules/core/users/users.module';
import { BillingModule } from '../modules/core/billing/billing.module';
import { OnboardingModule } from '../modules/core/onboarding/onboarding.module';
import { FeatureFlagsModule } from '../modules/core/feature-flags/feature-flags.module';
import { EmailModule } from '../modules/shared/email/email.module';
import { CustomersModule } from '../modules/workshops/customers/customers.module';
import { VehiclesModule } from '../modules/workshops/vehicles/vehicles.module';
import { TenantResolverMiddleware } from '../common/middleware/tenant-resolver.middleware';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { ValidationPipe } from '../common/pipes/validation.pipe';
import appConfig from '../config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    PrismaModule,
    HealthModule,
    TenantsModule,
    AuthModule,
    UsersModule,
    BillingModule,
    OnboardingModule,
    FeatureFlagsModule,
    EmailModule,
    CustomersModule,
    VehiclesModule,
    // TODO: Adicionar outros módulos aqui
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantResolverMiddleware).forRoutes('*');
  }
}
