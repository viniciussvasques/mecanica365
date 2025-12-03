import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { PrismaModule } from '@database/prisma.module';

/**
 * JobsModule - Módulo para processamento assíncrono
 *
 * Estrutura básica implementada.
 * TODO: Adicionar Bull + Redis para processamento assíncrono real quando necessário.
 *
 * Para implementar Bull:
 * 1. npm install @nestjs/bull bull
 * 2. Configurar BullModule com Redis
 * 3. Criar processadores de fila
 * 4. Atualizar JobsService para usar Bull
 */
@Module({
  imports: [PrismaModule],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
