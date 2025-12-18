import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

interface JobFilters {
  page: number;
  limit: number;
  type?: string;
  status?: string;
  tenantId?: string;
}

@Injectable()
export class AdminJobsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: JobFilters) {
    const { page, limit, type, status, tenantId } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (tenantId) where.tenantId = tenantId;

    const [data, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              subdomain: true,
            },
          },
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        tenant: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job não encontrado');
    }

    return job;
  }

  async retry(id: string) {
    const job = await this.findOne(id);

    if (job.status !== 'failed') {
      throw new Error('Apenas jobs falhados podem ser retentados');
    }

    await this.prisma.job.update({
      where: { id },
      data: {
        status: 'pending',
        attempts: job.attempts + 1,
        error: null,
      },
    });

    return { success: true, message: 'Job reenfileirado com sucesso' };
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.job.delete({
      where: { id },
    });
  }

  async getStats() {
    const [total, pending, processing, completed, failed] = await Promise.all([
      this.prisma.job.count(),
      this.prisma.job.count({ where: { status: 'pending' } }),
      this.prisma.job.count({ where: { status: 'processing' } }),
      this.prisma.job.count({ where: { status: 'completed' } }),
      this.prisma.job.count({ where: { status: 'failed' } }),
    ]);

    return {
      total,
      pending,
      processing,
      completed,
      failed,
    };
  }
}
