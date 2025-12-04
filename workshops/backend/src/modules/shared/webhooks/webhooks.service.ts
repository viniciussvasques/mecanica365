import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CreateWebhookDto, UpdateWebhookDto, WebhookResponseDto } from './dto';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';
import axios, { AxiosError } from 'axios';
import * as crypto from 'node:crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000; // 1 segundo base
  private readonly TIMEOUT_MS = 10000; // 10 segundos

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
  async findOne(tenantId: string, id: string): Promise<WebhookResponseDto> {
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
   * Envia webhook com retry automático
   */
  private async sendWebhook(
    webhook: { id: string; url: string; secret: string },
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const attemptId = crypto.randomUUID();
    let lastError: unknown;

    // Criar tentativa inicial
    await this.prisma.webhookAttempt.create({
      data: {
        id: attemptId,
        webhookId: webhook.id,
        event,
        payload: payload as never,
        status: 'pending',
      },
    });

    // Tentar enviar com retry
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        await this.attemptSendWebhook(
          webhook,
          event,
          payload,
          attemptId,
          attempt,
        );
        return; // Sucesso
      } catch (error: unknown) {
        lastError = error;
        const shouldContinue = await this.handleWebhookError(
          error,
          webhook.id,
          attemptId,
          attempt,
        );
        if (!shouldContinue) {
          break;
        }
      }
    }

    // Todas as tentativas falharam - adicionar à fila de retry manual se necessário
    this.logger.error(
      `Webhook ${webhook.id} falhou após ${this.MAX_RETRIES} tentativas`,
    );
    // Lançar erro para que o chamador saiba que falhou
    if (lastError instanceof Error) {
      throw lastError;
    }
    throw new Error(
      `Webhook ${webhook.id} falhou após ${this.MAX_RETRIES} tentativas`,
    );
  }

  /**
   * Tenta enviar webhook uma vez
   */
  private async attemptSendWebhook(
    webhook: { id: string; url: string; secret: string },
    event: string,
    payload: Record<string, unknown>,
    attemptId: string,
    attempt: number,
  ): Promise<void> {
    const signature = this.generateSignature(
      JSON.stringify(payload),
      webhook.secret,
    );

    const response = await axios.post<unknown>(
      webhook.url,
      {
        event,
        payload,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
          'Content-Type': 'application/json',
        },
        timeout: this.TIMEOUT_MS,
        validateStatus: (status) => status >= 200 && status < 300,
      },
    );

    // Sucesso - atualizar tentativa e webhook
    const responseData = response as { status: number; data: unknown };
    await this.prisma.webhookAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'success',
        statusCode: responseData.status,
        response: JSON.stringify(responseData.data),
      },
    });

    await this.prisma.webhook.update({
      where: { id: webhook.id },
      data: { lastTriggeredAt: new Date() },
    });

    this.logger.log(
      `Webhook ${webhook.id} enviado com sucesso (tentativa ${attempt}/${this.MAX_RETRIES})`,
    );
  }

  /**
   * Trata erro ao enviar webhook e decide se deve continuar tentando
   */
  private async handleWebhookError(
    error: unknown,
    webhookId: string,
    attemptId: string,
    attempt: number,
  ): Promise<boolean> {
    const isLastAttempt = attempt === this.MAX_RETRIES;
    const isRetryable = this.isRetryableError(error);

    this.logger.warn(
      `Tentativa ${attempt}/${this.MAX_RETRIES} falhou para webhook ${webhookId}: ${getErrorMessage(error)}`,
    );

    // Atualizar tentativa com erro
    const axiosError = error as AxiosError;
    await this.prisma.webhookAttempt.update({
      where: { id: attemptId },
      data: {
        status: isLastAttempt || !isRetryable ? 'failed' : 'pending',
        error: getErrorMessage(error),
        statusCode:
          axiosError.response && 'status' in axiosError.response
            ? axiosError.response.status
            : null,
      },
    });

    // Se não for última tentativa e for retryable, aguardar antes de tentar novamente
    if (!isLastAttempt && isRetryable) {
      const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Backoff exponencial
      await this.sleep(delay);
      return true;
    }

    if (!isRetryable) {
      // Erro não retryable, parar tentativas
      this.logger.error(
        `Erro não retryable para webhook ${webhookId}, parando tentativas`,
      );
      return false;
    }

    return false;
  }

  /**
   * Verifica se o erro é retryable
   */
  private isRetryableError(error: unknown): boolean {
    const axiosError = error as AxiosError;
    // Erros de rede ou timeout são retryable
    if (axiosError && !axiosError.response) {
      return true; // Erro de rede
    }

    if (axiosError?.response && 'status' in axiosError.response) {
      // Status codes 5xx são retryable
      const status = axiosError.response.status;
      if (status >= 500 && status < 600) {
        return true;
      }

      // 429 (Too Many Requests) é retryable
      if (status === 429) {
        return true;
      }

      // 408 (Request Timeout) é retryable
      if (status === 408) {
        return true;
      }
    }

    return false;
  }

  /**
   * Gera assinatura HMAC para webhook
   */
  private generateSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Reprocessa webhooks falhos (para retry manual)
   */
  async retryFailedWebhooks(
    tenantId: string,
    limit = 10,
  ): Promise<{ retried: number; succeeded: number; failed: number }> {
    try {
      const failedAttempts = await this.prisma.webhookAttempt.findMany({
        where: {
          status: 'failed',
          webhook: {
            tenantId,
            isActive: true,
          },
        },
        include: {
          webhook: true,
        },
        take: limit,
        orderBy: {
          attemptedAt: 'desc',
        },
      });

      let succeeded = 0;
      let failed = 0;

      for (const attempt of failedAttempts) {
        if (!attempt.webhook) {
          continue;
        }
        try {
          await this.sendWebhook(
            attempt.webhook,
            attempt.event,
            attempt.payload as Record<string, unknown>,
          );
          succeeded++;
        } catch (error: unknown) {
          failed++;
          this.logger.error(
            `Erro ao reprocessar webhook ${attempt.webhookId}: ${getErrorMessage(error)}`,
          );
        }
      }

      return {
        retried: failedAttempts.length,
        succeeded,
        failed,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao reprocessar webhooks falhos: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
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
