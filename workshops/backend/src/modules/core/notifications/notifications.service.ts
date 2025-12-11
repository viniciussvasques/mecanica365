import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';
import { getErrorMessage } from '@common/utils/error.utils';

export enum NotificationType {
  QUOTE_ASSIGNED = 'quote_assigned',
  QUOTE_AVAILABLE = 'quote_available',
  QUOTE_DIAGNOSIS_COMPLETED = 'diagnosis_completed',
  QUOTE_APPROVED = 'quote_approved',
  QUOTE_REJECTED = 'quote_rejected',
  SERVICE_ORDER_STARTED = 'service_order_started',
  SERVICE_ORDER_COMPLETED = 'service_order_completed',
}

export interface CreateNotificationDto {
  tenantId: string;
  userId?: string; // null = notificação para todos do tenant
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma notificação
   */
  async create(dto: CreateNotificationDto): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          tenantId: dto.tenantId,
          userId: dto.userId || null,
          type: dto.type,
          title: dto.title,
          message: dto.message,
          data: dto.data ? (dto.data as Prisma.InputJsonValue) : undefined,
        },
      });

      this.logger.log(
        `Notificação criada: ${dto.type} para ${dto.userId || 'todos'} no tenant ${dto.tenantId}`,
      );
    } catch (error: unknown) {
      this.logger.error(`Erro ao criar notificação: ${getErrorMessage(error)}`);
      // Não lançar erro para não quebrar o fluxo principal
    }
  }

  /**
   * Cria notificação para todos os mecânicos do tenant
   */
  async notifyAllMechanics(
    tenantId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    try {
      // Buscar todos os mecânicos ativos
      const mechanics = await this.prisma.user.findMany({
        where: {
          tenantId,
          role: 'mechanic',
          isActive: true,
        },
        select: { id: true },
      });

      // Criar notificação para cada mecânico
      const notifications = mechanics.map((mechanic) => ({
        tenantId,
        userId: mechanic.id,
        type,
        title,
        message,
        data: data ? (data as Prisma.InputJsonValue) : undefined,
      }));

      if (notifications.length > 0) {
        await this.prisma.notification.createMany({
          data: notifications,
        });

        this.logger.log(
          `Notificações criadas para ${mechanics.length} mecânicos: ${type}`,
        );
      }
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao notificar mecânicos: ${getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Marca notificação como lida
   */
  async markAsRead(
    tenantId: string,
    userId: string,
    notificationId: string,
  ): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        tenantId,
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Marca todas as notificações do usuário como lidas
   */
  async markAllAsRead(tenantId: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        tenantId,
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Busca notificações do usuário
   */
  async findByUser(
    tenantId: string,
    userId: string | null | undefined,
    limit = 50,
    unreadOnly = false,
  ) {
    // Construir where clause corretamente
    // Para campos nullable String no Prisma, usar null diretamente
    const where: Prisma.NotificationWhereInput = {
      tenantId,
    };

    // Adicionar filtro de userId
    if (userId !== undefined && userId !== null) {
      where.userId = userId;
    } else {
      // Para buscar notificações gerais (userId = null), usar equals: null
      where.userId = null;
    }

    // Adicionar filtro de não lidas se solicitado
    if (unreadOnly) {
      where.read = false;
    }

    // Construir where para contagem de não lidas
    const unreadWhere: Prisma.NotificationWhereInput = {
      tenantId,
      read: false,
    };

    // Adicionar filtro de userId para contagem
    if (userId !== undefined && userId !== null) {
      unreadWhere.userId = userId;
    } else {
      unreadWhere.userId = null;
    }

    const [notifications, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.notification.count({
        where: unreadWhere,
      }),
    ]);

    return {
      notifications,
      unreadCount,
    };
  }
}
