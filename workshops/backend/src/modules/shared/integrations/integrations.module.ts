import { Module } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { PrismaModule } from '@database/prisma.module';

/**
 * IntegrationsModule - Módulo para integrações externas
 *
 * Permite configurar integrações via painel admin:
 * - RENAVAN
 * - APIs de VIN
 * - CEP
 * - APIs customizadas
 *
 * TODO: Criar schema Prisma para Integration quando necessário
 */
@Module({
  imports: [PrismaModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
