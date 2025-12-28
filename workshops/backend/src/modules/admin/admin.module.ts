import { Module } from '@nestjs/common';
import { AdminAuthModule } from './auth/admin-auth.module';
import { AdminDashboardModule } from './dashboard/admin-dashboard.module';
import { AdminPlansModule } from './plans/admin-plans.module';
import { AdminTenantsModule } from './tenants/admin-tenants.module';
import { AdminUsersModule } from './users/admin-users.module';
import { SystemEmailModule } from './system-email/system-email.module';
import { SystemPaymentModule } from './system-payment/system-payment.module';
import { AdminAuditModule } from './audit/admin-audit.module';
import { AdminSupportModule } from './support/admin-support.module';
import { AdminJobsModule } from './jobs/admin-jobs.module';
import { AdminWebhooksModule } from './webhooks/admin-webhooks.module';
import { AdminCommunicationsModule } from './communications/admin-communications.module';
import { AdminBackupModule } from './backup/admin-backup.module';
import { AdminIntegrationsModule } from './integrations/admin-integrations.module';
import { AdminAutomationsModule } from './automations/admin-automations.module';
import { AdminAffiliatesModule } from './affiliates/admin-affiliates.module';

@Module({
  imports: [
    AdminAuthModule,
    SystemEmailModule,
    SystemPaymentModule,
    AdminTenantsModule,
    AdminPlansModule,
    AdminDashboardModule,
    AdminUsersModule,
    AdminAuditModule,
    AdminSupportModule,
    AdminJobsModule,
    AdminWebhooksModule,
    AdminCommunicationsModule,
    AdminBackupModule,
    AdminIntegrationsModule,
    AdminAutomationsModule,
    AdminAffiliatesModule,
  ],
  exports: [
    AdminAuthModule,
    SystemEmailModule,
    SystemPaymentModule,
    AdminTenantsModule,
    AdminPlansModule,
    AdminDashboardModule,
    AdminUsersModule,
    AdminAuditModule,
    AdminSupportModule,
    AdminJobsModule,
    AdminWebhooksModule,
    AdminCommunicationsModule,
    AdminBackupModule,
    AdminIntegrationsModule,
    AdminAutomationsModule,
    AdminAffiliatesModule,
  ],
})
export class AdminModule { }
