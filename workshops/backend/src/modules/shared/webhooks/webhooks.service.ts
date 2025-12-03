import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  CreateWebhookDto,
  UpdateWebhookDto,
  WebhookResponseDto,
} from './dto';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo webhook
   */
  async create(
    tenantId: string,
    createWebhookDto: CreateWebhookDto,
  ): Promise<WebhookResponseDto> {
    try {
      const webhook = await this.prisma.webhook.create({
        data: {
          tenantId,
          url: createWebhookDto.url,
          secret: createWebhookDto.secret,
          events: createWebhookDto.events,
          isActive: true,
        },
      });

      return this.toResponseDto(webhook);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao criar webhook: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Lista webhooks do tenant
   */
  async findAll(tenantId: string): Promise<WebhookResponseDto[]> {
    try {
      const webhooks = await this.prisma.webhook.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });

      return webhooks.map((webhook) => this.toResponseDto(webhook));
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao listar webhooks: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Busca webhook por ID
   */
  async findOne(
    tenantId: string,
    id: string,
  ): Promise<WebhookResponseDto> {
    try {
      const webhook = await this.prisma.webhook.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!webhook) {
        throw new NotFoundException('Webhook não encontrado');
      }

      return this.toResponseDto(webhook);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao buscar webhook: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Atualiza webhook
   */
  async update(
    tenantId: string,
    id: string,
    updateWebhookDto: UpdateWebhookDto,
  ): Promise<WebhookResponseDto> {
    try {
      await this.findWebhookByIdAndTenant(id, tenantId);

      const updateData: {
        url?: string;
        secret?: string;
        events?: string[];
        isActive?: boolean;
      } = {};

      if (updateWebhookDto.url !== undefined) {
        updateData.url = updateWebhookDto.url;
      }
      if (updateWebhookDto.secret !== undefined) {
        updateData.secret = updateWebhookDto.secret;
      }
      if (updateWebhookDto.events !== undefined) {
        updateData.events = updateWebhookDto.events;
      }
      if (updateWebhookDto.isActive !== undefined) {
        updateData.isActive = updateWebhookDto.isActive;
      }

      const webhook = await this.prisma.webhook.update({
        where: { id },
        data: updateData,
      });

      return this.toResponseDto(webhook);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao atualizar webhook: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Remove webhook
   */
  async remove(tenantId: string, id: string): Promise<void> {
    try {
      await this.findWebhookByIdAndTenant(id, tenantId);

      await this.prisma.webhook.delete({
        where: { id },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao remover webhook: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Dispara webhook para um evento
   */
  async trigger(
    tenantId: string,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      const webhooks = await this.prisma.webhook.findMany({
        where: {
          tenantId,
          isActive: true,
          events: {
            has: event,
          },
        },
      });

      for (const webhook of webhooks) {
        await this.sendWebhook(webhook, event, payload);
      }
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao disparar webhook: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      // Não lançar erro para não interromper o fluxo principal
    }
  }

  /**
   * Envia webhook
   */
  private async sendWebhook(
    webhook: { id: string; url: string; secret: string },
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      // TODO: Implementar envio real de webhook com retry
      // Por enquanto, apenas registra a tentativa
      await this.prisma.webhookAttempt.create({
        data: {
          webhookId: webhook.id,
          event,
          payload: payload as never,
          status: 'pending',
        },
      });

      // Atualizar lastTriggeredAt
      await this.prisma.webhook.update({
        where: { id: webhook.id },
        data: { lastTriggeredAt: new Date() },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao enviar webhook: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );

      // Registrar tentativa falha
      await this.prisma.webhookAttempt.create({
        data: {
          webhookId: webhook.id,
          event,
          payload: payload as never,
          status: 'failed',
          error: getErrorMessage(error),
        },
      });
    }
  }

  /**
   * Busca webhook por ID e tenant
   */
  private async findWebhookByIdAndTenant(
    id: string,
    tenantId: string,
  ): Promise<{ id: string }> {
    const webhook = await this.prisma.webhook.findFirst({
      where: {
        id,
        tenantId,
      },
      select: {
        id: true,
      },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook não encontrado');
    }

    return webhook;
  }

  /**
   * Converte para DTO de resposta
   */
  private toResponseDto(webhook: {
    id: string;
    url: string;
    secret: string;
    events: string[];
    isActive: boolean;
    lastTriggeredAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): WebhookResponseDto {
    return {
      id: webhook.id,
      url: webhook.url,
      secret: webhook.secret,
      events: webhook.events,
      isActive: webhook.isActive,
      lastTriggeredAt: webhook.lastTriggeredAt || undefined,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
    };
  }
}

