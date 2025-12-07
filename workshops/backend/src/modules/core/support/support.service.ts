import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  CreateSupportTicketDto,
  SupportPriority,
  SupportCategory,
} from './dto/create-support-ticket.dto';
import {
  SupportStatus,
  SupportTicketResponseDto,
} from './dto/support-ticket-response.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';
import { CreateSupportReplyDto } from './dto/create-support-reply.dto';
import { SupportTicketFiltersDto } from './dto/support-ticket-filters.dto';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';
import { Prisma } from '@prisma/client';
import type { SupportTicket as SupportTicketModel } from '@prisma/client';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo ticket de suporte
   */
  async create(
    createDto: CreateSupportTicketDto,
    userId?: string,
    tenantId?: string,
  ): Promise<SupportTicketResponseDto> {
    try {
      const ticket = await this.prisma.supportTicket.create({
        data: {
          subject: createDto.subject,
          message: createDto.message,
          status: SupportStatus.OPEN,
          priority: createDto.priority || SupportPriority.NORMAL,
          category: createDto.category || SupportCategory.GENERAL,
          userId,
          userEmail: createDto.userEmail,
          userName: createDto.userName,
          tenantId,
        },
      });

      this.logger.log(
        `Ticket de suporte criado: ${ticket.id} - ${ticket.subject}`,
      );

      return this.toResponseDto(ticket);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao criar ticket de suporte: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Lista tickets de suporte com filtros
   */
  async findAll(
    filters: SupportTicketFiltersDto,
    userId?: string,
    tenantId?: string,
  ): Promise<{
    data: SupportTicketResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const where: Prisma.SupportTicketWhereInput = {};

      // Filtros básicos
      if (filters.status) where.status = filters.status;
      if (filters.priority) where.priority = filters.priority;
      if (filters.category) where.category = filters.category;
      if (filters.assignedToId) where.assignedToId = filters.assignedToId;
      if (filters.tenantId) where.tenantId = filters.tenantId;

      // Busca por texto
      if (filters.search) {
        where.OR = [
          { subject: { contains: filters.search, mode: 'insensitive' } },
          { message: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      // Se for usuário comum, mostrar apenas seus tickets
      if (userId && !tenantId) {
        where.userId = userId;
      }

      const [tickets, total] = await Promise.all([
        this.prisma.supportTicket.findMany({
          where,
          include: {
            replies: {
              orderBy: { createdAt: 'desc' },
              take: 1, // Última resposta
            },
            assignedTo: {
              select: { id: true, name: true, email: true },
            },
            _count: {
              select: { replies: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (filters.page! - 1) * filters.limit!,
          take: filters.limit!,
        }),
        this.prisma.supportTicket.count({ where }),
      ]);

      const totalPages = Math.ceil(total / filters.limit!);

      const data = tickets.map((ticket) => ({
        ...this.toResponseDto(ticket),
        repliesCount: ticket._count.replies,
        lastReplyAt: ticket.replies[0]?.createdAt,
        assignedToName: ticket.assignedTo?.name,
      }));

      return {
        data,
        total,
        page: filters.page!,
        limit: filters.limit!,
        totalPages,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao listar tickets de suporte: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Busca ticket por ID
   */
  async findOne(
    id: string,
    userId?: string,
    tenantId?: string,
  ): Promise<SupportTicketResponseDto & { replies?: unknown[] }> {
    try {
      const ticket = await this.prisma.supportTicket.findFirst({
        where: {
          id,
          ...(userId && !tenantId ? { userId } : {}),
        },
        include: {
          replies: {
            include: {
              user: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { replies: true },
          },
        },
      });

      if (!ticket) {
        throw new NotFoundException('Ticket não encontrado');
      }

      return {
        ...this.toResponseDto(ticket),
        replies: ticket.replies,
        repliesCount: ticket._count.replies,
        assignedToName: ticket.assignedTo?.name,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao buscar ticket de suporte: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Atualiza ticket
   */
  async update(
    id: string,
    updateDto: UpdateSupportTicketDto,
    userId?: string,
  ): Promise<SupportTicketResponseDto> {
    try {
      // Verifica se o ticket existe
      await this.findOne(id, userId);

      const updateData: Prisma.SupportTicketUpdateInput = {};

      if (updateDto.status) {
        updateData.status = updateDto.status;
        if (updateDto.status === SupportStatus.RESOLVED) {
          updateData.resolvedAt = new Date();
        }
      }

      if (updateDto.priority !== undefined)
        updateData.priority = updateDto.priority;
      if (updateDto.category !== undefined)
        updateData.category = updateDto.category;
      if (updateDto.assignedToId !== undefined)
        updateData.assignedTo = { connect: { id: updateDto.assignedToId } };
      if (updateDto.internalNotes !== undefined)
        updateData.internalNotes = updateDto.internalNotes;

      const ticket = await this.prisma.supportTicket.update({
        where: { id },
        data: updateData,
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      this.logger.log(`Ticket atualizado: ${id}`);

      return {
        ...this.toResponseDto(ticket),
        assignedToName: ticket.assignedTo?.name,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao atualizar ticket: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Remove ticket
   */
  async remove(id: string, userId?: string): Promise<void> {
    try {
      await this.findOne(id, userId);

      await this.prisma.supportTicket.delete({
        where: { id },
      });

      this.logger.log(`Ticket removido: ${id}`);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao remover ticket: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Adiciona resposta ao ticket
   */
  async addReply(
    ticketId: string,
    replyDto: CreateSupportReplyDto,
    userId: string,
  ): Promise<unknown> {
    try {
      // Verifica se o ticket existe
      const ticket = await this.findOne(ticketId, userId);

      const reply = await this.prisma.supportReply.create({
        data: {
          ticketId,
          message: replyDto.message,
          isInternal: replyDto.isInternal || false,
          attachments: replyDto.attachments || [],
          userId,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });

      // Atualiza lastReplyAt do ticket
      await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { lastReplyAt: new Date() },
      });

      // Se resposta não for interna, marcar como aguardando resposta do usuário
      if (!replyDto.isInternal && ticket.status === SupportStatus.OPEN) {
        await this.update(ticketId, { status: SupportStatus.WAITING_FOR_USER });
      }

      this.logger.log(`Resposta adicionada ao ticket ${ticketId}`);

      return reply;
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao adicionar resposta: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Estatísticas de tickets
   */
  async getStats(tenantId?: string): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    avgResponseTime: number;
  }> {
    try {
      const where = tenantId ? { tenantId } : {};

      const [total, open, inProgress, resolved] = await Promise.all([
        this.prisma.supportTicket.count({ where }),
        this.prisma.supportTicket.count({
          where: { ...where, status: SupportStatus.OPEN },
        }),
        this.prisma.supportTicket.count({
          where: { ...where, status: SupportStatus.IN_PROGRESS },
        }),
        this.prisma.supportTicket.count({
          where: { ...where, status: SupportStatus.RESOLVED },
        }),
      ]);

      // Calcular tempo médio de resposta (simplificado)
      const avgResponseTime = 24; // horas - implementação pode ser melhorada

      return {
        total,
        open,
        inProgress,
        resolved,
        avgResponseTime,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao calcular estatísticas: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Converte para DTO de resposta
   */
  private toResponseDto(ticket: SupportTicketModel): SupportTicketResponseDto {
    return {
      id: ticket.id,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status as SupportStatus,
      priority: ticket.priority as SupportPriority,
      category: ticket.category as SupportCategory,
      userId: ticket.userId || undefined,
      userEmail: ticket.userEmail || undefined,
      userName: ticket.userName || undefined,
      tenantId: ticket.tenantId || undefined,
      assignedToId: ticket.assignedToId || undefined,
      lastReplyAt: ticket.lastReplyAt || undefined,
      resolvedAt: ticket.resolvedAt || undefined,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };
  }
}
