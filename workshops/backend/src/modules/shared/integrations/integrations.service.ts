import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  CreateIntegrationDto,
  UpdateIntegrationDto,
  IntegrationResponseDto,
  TestIntegrationDto,
  IntegrationStatus,
} from './dto';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';
import axios, { AxiosError } from 'axios';
import { Prisma } from '@prisma/client';

/**
 * IntegrationsService - Serviço para gerenciamento de integrações externas
 *
 * Permite configurar integrações via painel admin.
 * Por enquanto, armazena configurações. Processamento real será implementado quando necessário.
 */
@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova integração
   */
  async create(
    tenantId: string,
    createIntegrationDto: CreateIntegrationDto,
  ): Promise<IntegrationResponseDto> {
    try {
      const integration = await this.prisma.integration.create({
        data: {
          tenantId,
          name: createIntegrationDto.name,
          type: createIntegrationDto.type,
          apiUrl: createIntegrationDto.apiUrl,
          apiKey: createIntegrationDto.apiKey,
          config: (createIntegrationDto.config || {}) as Prisma.InputJsonValue,
          status: IntegrationStatus.ACTIVE,
          isActive: createIntegrationDto.isActive ?? true,
        },
      });

      this.logger.log(
        `Integração criada: ${integration.id} (${integration.type})`,
      );

      return this.toResponseDto(integration);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao criar integração: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Lista integrações do tenant
   */
  async findAll(tenantId: string): Promise<IntegrationResponseDto[]> {
    try {
      const integrations = await this.prisma.integration.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });

      return integrations.map((integration) => this.toResponseDto(integration));
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao listar integrações: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Busca integração por ID
   */
  async findOne(tenantId: string, id: string): Promise<IntegrationResponseDto> {
    try {
      const integration = await this.prisma.integration.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!integration) {
        throw new NotFoundException('Integração não encontrada');
      }

      return this.toResponseDto(integration);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao buscar integração: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Atualiza integração
   */
  async update(
    tenantId: string,
    id: string,
    updateIntegrationDto: UpdateIntegrationDto,
  ): Promise<IntegrationResponseDto> {
    try {
      await this.findOne(tenantId, id);

      const updateData: Prisma.IntegrationUpdateInput = {};

      if (updateIntegrationDto.name !== undefined) {
        updateData.name = updateIntegrationDto.name;
      }
      if (updateIntegrationDto.type !== undefined) {
        updateData.type = updateIntegrationDto.type;
      }
      if (updateIntegrationDto.apiUrl !== undefined) {
        updateData.apiUrl = updateIntegrationDto.apiUrl;
      }
      if (updateIntegrationDto.apiKey !== undefined) {
        updateData.apiKey = updateIntegrationDto.apiKey;
      }
      if (updateIntegrationDto.config !== undefined) {
        updateData.config =
          updateIntegrationDto.config as Prisma.InputJsonValue;
      }
      if (updateIntegrationDto.isActive !== undefined) {
        updateData.isActive = updateIntegrationDto.isActive;
      }

      const integration = await this.prisma.integration.update({
        where: { id },
        data: updateData,
      });

      return this.toResponseDto(integration);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao atualizar integração: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Remove integração
   */
  async remove(tenantId: string, id: string): Promise<void> {
    try {
      await this.findOne(tenantId, id);

      await this.prisma.integration.delete({
        where: { id },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao remover integração: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Testa integração
   */
  async test(
    tenantId: string,
    id: string,
    testData: TestIntegrationDto,
  ): Promise<{ success: boolean; message: string; data?: unknown }> {
    try {
      const integration = await this.findOne(tenantId, id);

      if (!integration.isActive) {
        throw new BadRequestException('Integração não está ativa');
      }

      // Testar conexão com a API
      try {
        const response = await axios.post<Record<string, unknown>>(
          integration.apiUrl,
          testData.testData,
          {
            headers: {
              ...(integration.apiKey && { 'X-API-Key': integration.apiKey }),
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          },
        );

        return {
          success: true,
          message: 'Integração testada com sucesso',
          data: response.data,
        };
      } catch (error: unknown) {
        const axiosError = error as AxiosError;
        return {
          success: false,
          message: `Erro ao testar integração: ${getErrorMessage(error)}`,
          data: axiosError.response?.data,
        };
      }
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao testar integração: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Converte para DTO de resposta
   */
  private toResponseDto(integration: {
    id: string;
    name: string;
    type: string;
    apiUrl: string;
    apiKey?: string | null;
    config?: unknown;
    status: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): IntegrationResponseDto {
    return {
      id: integration.id,
      name: integration.name,
      type: integration.type as never,
      apiUrl: integration.apiUrl,
      apiKey: integration.apiKey ? '***' : undefined, // Ocultar API key na resposta
      config: integration.config as Record<string, unknown> | undefined,
      status: integration.status as IntegrationStatus,
      isActive: integration.isActive,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    };
  }
}
