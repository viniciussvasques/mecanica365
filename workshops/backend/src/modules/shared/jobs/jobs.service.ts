import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job as BullJob } from 'bull';
import { PrismaService } from '@database/prisma.service';
import { CreateJobDto, JobResponseDto, JobFiltersDto, JobStatus } from './dto';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';
import { Prisma } from '@prisma/client';

interface JobData {
  id: string;
  type: string;
  payload?: Record<string, unknown>;
}

/**
 * JobsService - Serviço para gerenciamento de jobs
 *
 * Por enquanto, implementação básica sem Bull.
 * TODO: Implementar com Bull + Redis quando necessário para processamento assíncrono real.
 */
@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('jobs') private readonly jobsQueue: Queue,
  ) {}

  /**
   * Cria um novo job e adiciona à fila Bull
   */
  async create(
    tenantId: string,
    createJobDto: CreateJobDto,
  ): Promise<JobResponseDto> {
    try {
      // Criar job no banco de dados
      const job = await this.prisma.job.create({
        data: {
          tenantId,
          type: createJobDto.type,
          status: JobStatus.PENDING,
          data: createJobDto.data as Prisma.InputJsonValue,
          priority: createJobDto.priority || 5,
          attempts: 0,
          maxAttempts: createJobDto.attempts || 3,
        },
      });

      // Adicionar à fila Bull
      const queueOptions: {
        priority?: number;
        delay?: number;
        attempts?: number;
        backoff?: { type: string; delay: number };
      } = {
        priority: createJobDto.priority || 5,
        attempts: createJobDto.attempts || 3,
        backoff: {
          type: 'exponential',
          delay: 2000, // 2 segundos base
        },
      };

      if (createJobDto.delay) {
        queueOptions.delay = createJobDto.delay * 1000; // Converter para ms
      }

      await this.jobsQueue.add(
        createJobDto.type,
        {
          id: job.id,
          tenantId,
          type: createJobDto.type,
          data: createJobDto.data,
        },
        queueOptions,
      );

      this.logger.log(
        `Job criado e adicionado à fila: ${job.id} (tipo: ${job.type})`,
      );

      return this.toResponseDto(job);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao criar job: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Lista jobs com filtros
   * Se tenantId for undefined, retorna jobs de todos os tenants (superadmin)
   */
  async findAll(
    tenantId: string | undefined,
    filters: JobFiltersDto,
  ): Promise<{
    data: JobResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        status,
        startDate,
        endDate,
      } = filters;
      const skip = (page - 1) * limit;

      const where: {
        tenantId?: string;
        type?: string;
        status?: string;
        createdAt?: { gte?: Date; lte?: Date };
      } = {};

      // Se tenantId for undefined, não filtra por tenant (superadmin vê tudo)
      if (tenantId) {
        where.tenantId = tenantId;
      }

      if (type) {
        where.type = type;
      }

      if (status) {
        where.status = status;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      const [jobs, total] = await this.prisma.$transaction([
        this.prisma.job.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        }),
        this.prisma.job.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: jobs.map((job) => this.toResponseDto(job)),
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao listar jobs: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Busca um job por ID
   * Se tenantId for undefined, busca em todos os tenants (superadmin)
   */
  async findOne(
    tenantId: string | undefined,
    id: string,
  ): Promise<JobResponseDto> {
    try {
      const job = await this.prisma.job.findFirst({
        where: {
          id,
          // Se tenantId for undefined, não filtra por tenant (superadmin vê tudo)
          ...(tenantId && { tenantId }),
        },
      });

      if (!job) {
        throw new NotFoundException(`Job com ID ${id} não encontrado`);
      }

      return this.toResponseDto(job);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao buscar job: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Processa um job manualmente (para casos especiais)
   * Normalmente, jobs são processados automaticamente pela fila Bull
   */
  async processJob(jobId: string): Promise<void> {
    try {
      const jobRecord = await this.prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!jobRecord) {
        throw new NotFoundException(`Job com ID ${jobId} não encontrado`);
      }

      const job = this.toResponseDto(jobRecord);

      if (job.status !== JobStatus.PENDING) {
        throw new Error(
          `Job ${jobId} não está pendente (status: ${job.status})`,
        );
      }

      // Adicionar à fila para processamento
      await this.jobsQueue.add(
        job.type,
        {
          id: job.id,
          tenantId: '', // Será preenchido pelo processador
          type: job.type,
          data: job.data,
        },
        {
          priority: job.priority || 5,
        },
      );

      this.logger.log(`Job ${jobId} adicionado à fila para processamento`);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao processar job: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Cancela um job pendente
   */
  async cancelJob(tenantId: string, jobId: string): Promise<void> {
    try {
      const job = await this.findOne(tenantId, jobId);

      if (
        job.status !== JobStatus.PENDING &&
        job.status !== JobStatus.PROCESSING
      ) {
        throw new Error(
          `Job ${jobId} não pode ser cancelado (status: ${job.status})`,
        );
      }

      // Remover da fila Bull se ainda estiver pendente
      const jobs = await this.jobsQueue.getJobs([
        'waiting',
        'active',
        'delayed',
      ]);
      const bullJob = jobs.find((j: BullJob<JobData>) => j.data.id === jobId);

      if (bullJob) {
        await bullJob.remove();
      }

      // Atualizar status no banco
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.CANCELLED,
        },
      });

      this.logger.log(`Job ${jobId} cancelado`);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao cancelar job: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Retorna estatísticas da fila
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.jobsQueue.getWaitingCount(),
        this.jobsQueue.getActiveCount(),
        this.jobsQueue.getCompletedCount(),
        this.jobsQueue.getFailedCount(),
        this.jobsQueue.getDelayedCount(),
      ]);

      return {
        waiting,
        active,
        completed,
        failed,
        delayed,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao obter estatísticas da fila: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Converte para DTO de resposta
   */
  private toResponseDto(job: {
    id: string;
    type: string;
    status: string;
    data: unknown;
    priority: number;
    attempts: number;
    error?: string | null;
    result?: unknown;
    createdAt: Date;
    processedAt?: Date | null;
    completedAt?: Date | null;
  }): JobResponseDto {
    return {
      id: job.id,
      type: job.type as never,
      status: job.status as JobStatus,
      data: job.data as Record<string, unknown>,
      priority: job.priority,
      attempts: job.attempts,
      error: job.error ?? undefined,
      result: job.result ? (job.result as Record<string, unknown>) : undefined,
      createdAt: job.createdAt,
      processedAt: job.processedAt ?? undefined,
      completedAt: job.completedAt ?? undefined,
    };
  }
}
