import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../database/prisma.module';
import { EncryptionModule } from '../modules/shared/encryption/encryption.module';
import { HealthModule } from '../health/health.module';
import { TenantsModule } from '../modules/core/tenants/tenants.module';
import { AuthModule } from '../modules/core/auth/auth.module';
import { UsersModule } from '../modules/core/users/users.module';
import { BillingModule } from '../modules/core/billing/billing.module';
import { OnboardingModule } from '../modules/core/onboarding/onboarding.module';
import { FeatureFlagsModule } from '../modules/core/feature-flags/feature-flags.module';
import { EmailModule } from '../modules/shared/email/email.module';
import { CloudflareModule } from '../modules/shared/cloudflare/cloudflare.module';
import { CustomersModule } from '../modules/workshops/customers/customers.module';
import { VehiclesModule } from '../modules/workshops/vehicles/vehicles.module';
import { ElevatorsModule } from '../modules/workshops/elevators/elevators.module';
import { ServiceOrdersModule } from '../modules/workshops/service-orders/service-orders.module';
import { QuotesModule } from '../modules/workshops/quotes/quotes.module';
import { WorkshopSettingsModule } from '../modules/workshops/workshop-settings/workshop-settings.module';
import { SharedModule } from '../modules/workshops/shared/shared.module';
import { AuditModule } from '../modules/core/audit/audit.module';
import { PartsModule } from '../modules/workshops/parts/parts.module';
import { AppointmentsModule } from '../modules/workshops/appointments/appointments.module';
import { AttachmentsModule } from '../modules/workshops/attachments/attachments.module';
import { ChecklistsModule } from '../modules/workshops/checklists/checklists.module';
import { InvoicingModule } from '../modules/workshops/invoicing/invoicing.module';
import { PaymentsModule } from '../modules/workshops/payments/payments.module';
import { ReportsModule } from '../modules/workshops/reports/reports.module';
import { SuppliersModule } from '../modules/workshops/suppliers/suppliers.module';
import { WebhooksModule } from '../modules/shared/webhooks/webhooks.module';
import { JobsModule } from '../modules/shared/jobs/jobs.module';
import { RateLimitingModule } from '../modules/shared/rate-limiting/rate-limiting.module';
import { BackupModule } from '../modules/shared/backup/backup.module';
import { IntegrationsModule } from '../modules/shared/integrations/integrations.module';
import { AutomationsModule } from '../modules/shared/automations/automations.module';
import { NotificationsModule } from '../modules/core/notifications/notifications.module';
import { PlansModule } from '../modules/core/plans/plans.module';
import { SupportModule } from '../modules/core/support/support.module';
import { PaymentGatewaysModule } from '../modules/workshops/payment-gateways/payment-gateways.module';
import { EmailSettingsModule } from '../modules/admin/email-settings/email-settings.module';
import { AdminModule } from '../modules/admin/admin.module';
import { MaintenanceModule } from '../modules/workshops/maintenance/maintenance.module';
import { AnalyticsModule } from '../modules/workshops/analytics/analytics.module';
import { KnowledgeModule } from '../modules/workshops/knowledge/knowledge.module';
import { PredictiveModule } from '../modules/workshops/predictive/predictive.module';
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
    EncryptionModule,
    HealthModule,
    TenantsModule,
    AuthModule,
    UsersModule,
    BillingModule,
    OnboardingModule,
    FeatureFlagsModule,
    EmailModule,
    CloudflareModule,
    CustomersModule,
    VehiclesModule,
    ElevatorsModule,
    ServiceOrdersModule,
    QuotesModule,
    WorkshopSettingsModule,
    SharedModule,
    AuditModule,
    PartsModule,
    AppointmentsModule,
    AttachmentsModule,
    ChecklistsModule,
    InvoicingModule,
    PaymentsModule,
    ReportsModule,
    SuppliersModule,
    WebhooksModule,
    JobsModule,
    RateLimitingModule,
    BackupModule,
    IntegrationsModule,
    AutomationsModule,
    NotificationsModule,
    PlansModule,
    SupportModule,
    PaymentGatewaysModule,
    EmailSettingsModule,
    AdminModule,
    MaintenanceModule,
    AnalyticsModule,
    KnowledgeModule,
    PredictiveModule,
    // Módulos adicionais serão adicionados conforme necessário
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
