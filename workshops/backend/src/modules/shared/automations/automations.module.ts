import { Module } from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { AutomationsController } from './automations.controller';
import { PrismaModule } from '@database/prisma.module';

/**
 * AutomationsModule - Módulo para automações
 *
 * Permite configurar regras de negócio e workflows via painel admin:
 * - Triggers (eventos que disparam automações)
 * - Ações (o que fazer quando trigger é disparado)
 * - Condições (quando executar)
 *
 * TODO: Criar schema Prisma para Automation quando necessário
 */
@Module({
  imports: [PrismaModule],
  controllers: [AutomationsController],
  providers: [AutomationsService],
  exports: [AutomationsService],
})
export class AutomationsModule {}
