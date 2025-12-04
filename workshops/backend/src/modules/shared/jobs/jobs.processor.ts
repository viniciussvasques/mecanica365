import { Processor, Process } from '@nestjs/bull';
import { Job as BullJob } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { JobType, JobStatus } from './dto';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';

export interface JobData {
  id: string;
  tenantId: string;
  type: JobType;
  data: Record<string, unknown>;
}

@Processor('jobs')
export class JobsProcessor {
  private readonly logger = new Logger(JobsProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process({ name: 'email', concurrency: 5 })
  async handleEmailJob(job: BullJob<JobData>): Promise<void> {
    await this.processJob(job, async (jobData) => {
      this.logger.log(`Processando job de email: ${jobData.id}`);
      // Implementar lógica de envio de email aqui
      // Por enquanto, apenas log
      return { success: true, message: 'Email processado' };
    });
  }

  @Process({ name: 'report', concurrency: 2 })
  async handleReportJob(job: BullJob<JobData>): Promise<void> {
    await this.processJob(job, async (jobData) => {
      this.logger.log(`Processando job de relatório: ${jobData.id}`);
      // Implementar lógica de geração de relatório aqui
      return { success: true, message: 'Relatório processado' };
    });
  }

  @Process({ name: 'webhook', concurrency: 10 })
  async handleWebhookJob(job: BullJob<JobData>): Promise<void> {
    await this.processJob(job, async (jobData) => {
      this.logger.log(`Processando job de webhook: ${jobData.id}`);
      // Implementar lógica de webhook aqui
      return { success: true, message: 'Webhook processado' };
    });
  }

  @Process({ name: 'cleanup', concurrency: 1 })
  async handleCleanupJob(job: BullJob<JobData>): Promise<void> {
    await this.processJob(job, async (jobData) => {
      this.logger.log(`Processando job de limpeza: ${jobData.id}`);
      // Implementar lógica de limpeza aqui
      return { success: true, message: 'Limpeza processada' };
    });
  }

  @Process({ name: 'export', concurrency: 2 })
  async handleExportJob(job: BullJob<JobData>): Promise<void> {
    await this.processJob(job, async (jobData) => {
      this.logger.log(`Processando job de exportação: ${jobData.id}`);
      // Implementar lógica de exportação aqui
      return { success: true, message: 'Exportação processada' };
    });
  }

  /**
   * Processa um job genérico
   */
  private async processJob(
    job: BullJob<JobData>,
    processor: (jobData: JobData) => Promise<Record<string, unknown>>,
  ): Promise<void> {
    const jobData = job.data;

    try {
      // Atualizar status para processing
      await this.prisma.job.update({
        where: { id: jobData.id },
        data: {
          status: JobStatus.PROCESSING,
          processedAt: new Date(),
          attempts: { increment: 1 },
        },
      });

      // Processar job
      const result = await processor(jobData);

      // Atualizar status para completed
      await this.prisma.job.update({
        where: { id: jobData.id },
        data: {
          status: JobStatus.COMPLETED,
          completedAt: new Date(),
          result: result as never,
        },
      });

      this.logger.log(`Job ${jobData.id} processado com sucesso`);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(
        `Erro ao processar job ${jobData.id}: ${errorMessage}`,
        getErrorStack(error),
      );

      // Verificar se deve fazer retry
      const jobRecord = await this.prisma.job.findUnique({
        where: { id: jobData.id },
      });

      if (jobRecord && jobRecord.attempts < jobRecord.maxAttempts) {
        // Retry será feito automaticamente pelo Bull
        this.logger.warn(
          `Job ${jobData.id} falhou, será reprocessado (tentativa ${jobRecord.attempts + 1}/${jobRecord.maxAttempts})`,
        );
      } else {
        // Marcar como failed
        await this.prisma.job.update({
          where: { id: jobData.id },
          data: {
            status: JobStatus.FAILED,
            error: errorMessage,
          },
        });
      }

      throw error;
    }
  }
}
