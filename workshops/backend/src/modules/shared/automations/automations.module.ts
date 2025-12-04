import { Module, forwardRef } from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { AutomationsController } from './automations.controller';
import { PrismaModule } from '@database/prisma.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '@modules/core/notifications/notifications.module';
import { JobsModule } from '../jobs/jobs.module';

/**
 * AutomationsModule - Módulo para automações
 *
 * Permite configurar regras de negócio e workflows via painel admin:
 * - Triggers (eventos que disparam automações)
 * - Ações (o que fazer quando trigger é disparado)
 * - Condições (quando executar)
 */
@Module({
  imports: [
    PrismaModule,
    forwardRef(() => EmailModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => JobsModule),
  ],
  controllers: [AutomationsController],
  providers: [AutomationsService],
  exports: [AutomationsService],
})
export class AutomationsModule {}
