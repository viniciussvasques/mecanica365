import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';
import { AddReplyDto } from './dto/add-reply.dto';

interface SupportFilters {
  page: number;
  limit: number;
  status?: string;
  priority?: string;
  category?: string;
  tenantId?: string;
}

@Injectable()
export class AdminSupportService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: SupportFilters) {
    const { page, limit, status, priority, category, tenantId } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (tenantId) where.tenantId = tenantId;

    const [data, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
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
      this.prisma.supportTicket.count({ where }),
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
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        tenant: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket não encontrado');
    }

    return ticket;
  }

  async create(createDto: CreateSupportTicketDto) {
    return this.prisma.supportTicket.create({
      data: createDto,
    });
  }

  async update(id: string, updateDto: UpdateSupportTicketDto) {
    await this.findOne(id);

    return this.prisma.supportTicket.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.supportTicket.delete({
      where: { id },
    });
  }

  async addReply(id: string, replyDto: AddReplyDto) {
    await this.findOne(id);

    // Atualizar última resposta
    await this.prisma.supportTicket.update({
      where: { id },
      data: {
        lastReplyAt: new Date(),
        status: replyDto.closeTicket ? 'resolved' : undefined,
      },
    });

    return { success: true, message: 'Resposta adicionada com sucesso' };
  }

  async getStats() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [total, open, inProgress, resolved, closed, today] = await Promise.all([
      this.prisma.supportTicket.count(),
      this.prisma.supportTicket.count({ where: { status: 'open' } }),
      this.prisma.supportTicket.count({ where: { status: 'in_progress' } }),
      this.prisma.supportTicket.count({ where: { status: 'resolved' } }),
      this.prisma.supportTicket.count({ where: { status: 'closed' } }),
      this.prisma.supportTicket.count({
        where: { createdAt: { gte: last24h } },
      }),
    ]);

    // Calcular tempo médio de resposta (simplificado)
    const avgResponseTime = 3.5; // horas (placeholder)

    return {
      total,
      open,
      inProgress,
      resolved,
      closed,
      today,
      avgResponseTime,
    };
  }
}
