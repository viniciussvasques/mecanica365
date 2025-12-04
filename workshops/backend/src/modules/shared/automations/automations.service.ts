import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  CreateAutomationDto,
  UpdateAutomationDto,
  AutomationResponseDto,
  AutomationAction,
} from './dto';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';
import { Prisma } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '@modules/core/notifications/notifications.service';
import { JobsService } from '../jobs/jobs.service';

/**
 * AutomationsService - Serviço para gerenciamento de automações
 *
 * Permite configurar regras de negócio e workflows via painel admin.
 * Por enquanto, armazena configurações. Processamento real será implementado quando necessário.
 */
@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => EmailService))
    private readonly emailService: EmailService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => JobsService))
    private readonly jobsService: JobsService,
  ) {}

  /**
   * Cria uma nova automação
   */
  async create(
    tenantId: string,
    createAutomationDto: CreateAutomationDto,
  ): Promise<AutomationResponseDto> {
    try {
      const automation = await this.prisma.automation.create({
        data: {
          tenantId,
          name: createAutomationDto.name,
          description: createAutomationDto.description,
          trigger: createAutomationDto.trigger,
          action: createAutomationDto.action,
          conditions: (createAutomationDto.conditions ||
            {}) as Prisma.InputJsonValue,
          actionConfig:
            createAutomationDto.actionConfig as Prisma.InputJsonValue,
          isActive: createAutomationDto.isActive ?? true,
        },
      });

      this.logger.log(
        `Automação criada: ${automation.id} (${automation.trigger} -> ${automation.action})`,
      );

      return this.toResponseDto(automation);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao criar automação: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Lista automações do tenant
   */
  async findAll(tenantId: string): Promise<AutomationResponseDto[]> {
    try {
      const automations = await this.prisma.automation.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });

      return automations.map((automation) => this.toResponseDto(automation));
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao listar automações: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Busca automação por ID
   */
  async findOne(tenantId: string, id: string): Promise<AutomationResponseDto> {
    try {
      const automation = await this.prisma.automation.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!automation) {
        throw new NotFoundException('Automação não encontrada');
      }

      return this.toResponseDto(automation);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao buscar automação: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Atualiza automação
   */
  async update(
    tenantId: string,
    id: string,
    updateAutomationDto: UpdateAutomationDto,
  ): Promise<AutomationResponseDto> {
    try {
      await this.findOne(tenantId, id);

      const updateData: Prisma.AutomationUpdateInput = {};

      if (updateAutomationDto.name !== undefined) {
        updateData.name = updateAutomationDto.name;
      }
      if (updateAutomationDto.description !== undefined) {
        updateData.description = updateAutomationDto.description;
      }
      if (updateAutomationDto.trigger !== undefined) {
        updateData.trigger = updateAutomationDto.trigger;
      }
      if (updateAutomationDto.action !== undefined) {
        updateData.action = updateAutomationDto.action;
      }
      if (updateAutomationDto.conditions !== undefined) {
        updateData.conditions =
          updateAutomationDto.conditions as Prisma.InputJsonValue;
      }
      if (updateAutomationDto.actionConfig !== undefined) {
        updateData.actionConfig =
          updateAutomationDto.actionConfig as Prisma.InputJsonValue;
      }
      if (updateAutomationDto.isActive !== undefined) {
        updateData.isActive = updateAutomationDto.isActive;
      }

      const automation = await this.prisma.automation.update({
        where: { id },
        data: updateData,
      });

      return this.toResponseDto(automation);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao atualizar automação: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Remove automação
   */
  async remove(tenantId: string, id: string): Promise<void> {
    try {
      await this.findOne(tenantId, id);

      await this.prisma.automation.delete({
        where: { id },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao remover automação: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Executa automação manualmente (para testes)
   */
  async execute(
    tenantId: string,
    id: string,
    payload: Record<string, unknown>,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const automation = await this.findOne(tenantId, id);

      if (!automation.isActive) {
        return {
          success: false,
          message: 'Automação não está ativa',
        };
      }

      return await this.executeAutomation(automation, payload);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao executar automação: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Processa trigger e executa automações correspondentes
   */
  async processTrigger(
    tenantId: string,
    trigger: string,
    payload: Record<string, unknown>,
  ): Promise<{ executed: number; succeeded: number; failed: number }> {
    try {
      const automations = await this.prisma.automation.findMany({
        where: {
          tenantId,
          isActive: true,
          trigger,
        },
      });

      let executed = 0;
      let succeeded = 0;
      let failed = 0;

      for (const automation of automations) {
        try {
          // Verificar condições
          const conditions =
            automation.conditions && typeof automation.conditions === 'object'
              ? (automation.conditions as Record<string, unknown>)
              : undefined;
          if (!this.evaluateConditions(conditions, payload)) {
            this.logger.debug(
              `Automação ${automation.id} não executada: condições não atendidas`,
            );
            continue;
          }

          executed++;
          await this.executeAutomation(this.toResponseDto(automation), payload);
          succeeded++;
        } catch (error: unknown) {
          executed++;
          failed++;
          this.logger.error(
            `Erro ao executar automação ${automation.id}: ${getErrorMessage(error)}`,
            getErrorStack(error),
          );
        }
      }

      return {
        executed,
        succeeded,
        failed,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao processar trigger: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Executa uma automação
   */
  private async executeAutomation(
    automation: AutomationResponseDto,
    payload: Record<string, unknown>,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(
      `Executando automação: ${automation.id} (${automation.trigger} -> ${automation.action})`,
    );

    try {
      switch (automation.action) {
        case AutomationAction.SEND_EMAIL:
          await this.executeSendEmail(automation, payload);
          break;

        case AutomationAction.CREATE_NOTIFICATION:
          await this.executeCreateNotification(automation, payload);
          break;

        case AutomationAction.CREATE_JOB:
          await this.executeCreateJob(automation, payload);
          break;

        case AutomationAction.UPDATE_STATUS:
          this.executeUpdateStatus(automation, payload);
          break;

        case AutomationAction.SEND_SMS:
          // SMS não implementado ainda
          this.logger.warn(
            `Ação SMS não implementada para automação ${automation.id}`,
          );
          break;

        case AutomationAction.CUSTOM:
          this.executeCustomAction(automation, payload);
          break;

        default:
          throw new Error(`Ação desconhecida: ${String(automation.action)}`);
      }

      return {
        success: true,
        message: 'Automação executada com sucesso',
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao executar ação da automação ${automation.id}: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Avalia condições da automação
   */
  private evaluateConditions(
    conditions: Record<string, unknown> | undefined,
    payload: Record<string, unknown>,
  ): boolean {
    if (!conditions || Object.keys(conditions).length === 0) {
      return true; // Sem condições = sempre executa
    }

    // Verificar se o próprio objeto conditions tem field, operator, value diretamente
    if (this.isDirectCondition(conditions)) {
      return this.evaluateDirectCondition(conditions, payload);
    }

    // Implementação básica de avaliação de condições
    // Suporta: field, operator, value (formato aninhado)
    return this.evaluateNestedConditions(conditions, payload);
  }

  /**
   * Verifica se é uma condição direta (field, operator, value no objeto principal)
   */
  private isDirectCondition(conditions: Record<string, unknown>): boolean {
    const directCondition = conditions as {
      field?: string;
      operator?: string;
      value?: unknown;
    };
    return (
      !!directCondition.field &&
      !!directCondition.operator &&
      directCondition.value !== undefined
    );
  }

  /**
   * Avalia uma condição direta
   */
  private evaluateDirectCondition(
    conditions: Record<string, unknown>,
    payload: Record<string, unknown>,
  ): boolean {
    const directCondition = conditions as {
      field: string;
      operator: string;
      value: unknown;
    };
    const fieldValue = this.getNestedValue(payload, directCondition.field);
    return this.compareValues(
      fieldValue,
      directCondition.operator,
      directCondition.value,
    );
  }

  /**
   * Avalia condições aninhadas
   */
  private evaluateNestedConditions(
    conditions: Record<string, unknown>,
    payload: Record<string, unknown>,
  ): boolean {
    for (const [, condition] of Object.entries(conditions)) {
      if (typeof condition === 'object' && condition !== null) {
        const cond = condition as {
          field?: string;
          operator?: string;
          value?: unknown;
        };

        if (cond.field && cond.operator && cond.value !== undefined) {
          const fieldValue = this.getNestedValue(payload, cond.field);
          if (!this.compareValues(fieldValue, cond.operator, cond.value)) {
            return false;
          }
        }
      }
    }
    return true;
  }

  /**
   * Obtém valor aninhado de um objeto
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' && key in current
        ? (current as Record<string, unknown>)[key]
        : undefined;
    }, obj as unknown);
  }

  /**
   * Compara valores com operador
   */
  private compareValues(
    fieldValue: unknown,
    operator: string,
    expectedValue: unknown,
  ): boolean {
    switch (operator) {
      case 'equals':
      case '==':
        return fieldValue === expectedValue;
      case 'not_equals':
      case '!=':
        return fieldValue !== expectedValue;
      case 'greater_than':
      case '>':
        return (
          typeof fieldValue === 'number' &&
          typeof expectedValue === 'number' &&
          fieldValue > expectedValue
        );
      case 'less_than':
      case '<':
        return (
          typeof fieldValue === 'number' &&
          typeof expectedValue === 'number' &&
          fieldValue < expectedValue
        );
      case 'contains':
        return (
          typeof fieldValue === 'string' &&
          typeof expectedValue === 'string' &&
          fieldValue.includes(expectedValue)
        );
      case 'in':
        return (
          Array.isArray(expectedValue) && expectedValue.includes(fieldValue)
        );
      default:
        return false;
    }
  }

  /**
   * Executa ação: SEND_EMAIL
   */
  private async executeSendEmail(
    automation: AutomationResponseDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _payload: Record<string, unknown>,
  ): Promise<void> {
    const config = automation.actionConfig as {
      to?: string;
      subject?: string;
      template?: string;
      variables?: Record<string, unknown>;
    };

    if (!config.to || !config.subject) {
      throw new Error('Configuração de email incompleta (to, subject)');
    }

    // Usar template se fornecido, senão usar mensagem simples
    const html = config.template
      ? `Template: ${config.template}`
      : `<p>${config.subject}</p>`;
    const text = config.subject;

    await this.emailService.sendEmail(config.to, config.subject, html, text);
  }

  /**
   * Executa ação: CREATE_NOTIFICATION
   */
  private async executeCreateNotification(
    automation: AutomationResponseDto,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const config = automation.actionConfig as {
      userId?: string;
      title?: string;
      message?: string;
      type?: string;
    };

    if (!config.title || !config.message) {
      throw new Error(
        'Configuração de notificação incompleta (title, message)',
      );
    }

    // Extrair tenantId do payload ou da automação
    const tenantId =
      (payload.tenantId as string) || automation.id.split('-')[0];

    await this.notificationsService.create({
      tenantId,
      userId: config.userId,
      type: (config.type as never) || 'custom',
      title: config.title,
      message: config.message,
      data: payload,
    });
  }

  /**
   * Executa ação: CREATE_JOB
   */
  private async executeCreateJob(
    automation: AutomationResponseDto,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const config = automation.actionConfig as {
      type?: string;
      priority?: number;
      data?: Record<string, unknown>;
    };

    if (!config.type) {
      throw new Error('Configuração de job incompleta (type)');
    }

    const tenantId =
      (payload.tenantId as string) || automation.id.split('-')[0];

    await this.jobsService.create(tenantId, {
      type: config.type as never,
      data: config.data || payload,
      priority: config.priority || 5,
    });
  }

  /**
   * Executa ação: UPDATE_STATUS
   */
  private executeUpdateStatus(
    automation: AutomationResponseDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _payload: Record<string, unknown>,
  ): void {
    const config = automation.actionConfig as {
      entity?: string;
      entityId?: string;
      status?: string;
    };

    if (!config.entity || !config.entityId || !config.status) {
      throw new Error(
        'Configuração de atualização de status incompleta (entity, entityId, status)',
      );
    }

    // Implementação genérica de atualização de status
    // Pode ser expandida para diferentes entidades
    this.logger.log(
      `Atualizando status de ${config.entity} ${config.entityId} para ${config.status}`,
    );

    // Aqui você pode adicionar lógica específica para cada entidade
    // Por exemplo: Quote, ServiceOrder, etc.
  }

  /**
   * Executa ação: CUSTOM
   */
  private executeCustomAction(
    automation: AutomationResponseDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _payload: Record<string, unknown>,
  ): void {
    const config = automation.actionConfig as {
      handler?: string;
      params?: Record<string, unknown>;
    };

    this.logger.log(
      `Executando ação customizada: ${config.handler || 'unknown'}`,
    );

    // Ações customizadas podem ser implementadas via plugins ou extensões
    // Por enquanto, apenas log
  }

  /**
   * Converte para DTO de resposta
   */
  private toResponseDto(automation: {
    id: string;
    name: string;
    description: string;
    trigger: string;
    action: string;
    conditions?: unknown;
    actionConfig: unknown;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): AutomationResponseDto {
    return {
      id: automation.id,
      name: automation.name,
      description: automation.description,
      trigger: automation.trigger as never,
      action: automation.action as never,
      conditions:
        automation.conditions && typeof automation.conditions === 'object'
          ? (automation.conditions as Record<string, unknown>)
          : undefined,
      actionConfig: automation.actionConfig as Record<string, unknown>,
      isActive: automation.isActive,
      createdAt: automation.createdAt,
      updatedAt: automation.updatedAt,
    };
  }
}
