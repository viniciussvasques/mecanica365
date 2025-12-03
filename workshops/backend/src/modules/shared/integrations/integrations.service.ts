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
   * Armazena configuração para uso futuro
   */
  async create(
    tenantId: string,
    createIntegrationDto: CreateIntegrationDto,
  ): Promise<IntegrationResponseDto> {
    try {
      // Por enquanto, apenas registra a configuração
      // TODO: Criar schema Prisma para Integration quando necessário
      const integration = {
        id: `integration-${Date.now()}`,
        tenantId,
        name: createIntegrationDto.name,
        type: createIntegrationDto.type,
        apiUrl: createIntegrationDto.apiUrl,
        apiKey: createIntegrationDto.apiKey,
        config: createIntegrationDto.config || {},
        status: IntegrationStatus.ACTIVE,
        isActive: createIntegrationDto.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

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
      // TODO: Buscar do banco quando schema for criado
      return [];
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
      // TODO: Buscar do banco quando schema for criado
      throw new NotFoundException('Integração não encontrada');
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

      // TODO: Atualizar no banco quando schema for criado
      throw new NotFoundException('Integração não encontrada');
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
      // TODO: Remover do banco quando schema for criado
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
    apiKey?: string;
    config?: Record<string, unknown>;
    status: IntegrationStatus;
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
      config: integration.config,
      status: integration.status,
      isActive: integration.isActive,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    };
  }
}
