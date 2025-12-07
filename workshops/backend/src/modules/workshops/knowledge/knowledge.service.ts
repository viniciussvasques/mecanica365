import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateKnowledgeDto,
  UpdateKnowledgeDto,
  KnowledgeResponseDto,
  KnowledgeSummaryDto,
  KnowledgeFiltersDto,
  RateKnowledgeDto,
} from './dto';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Criar nova entrada na base de conhecimento
   */
  async create(
    tenantId: string,
    userId: string,
    userName: string,
    dto: CreateKnowledgeDto,
  ): Promise<KnowledgeResponseDto> {
    try {
      const data: Prisma.KnowledgeBaseCreateInput = {
        tenant: { connect: { id: tenantId } },
        problemTitle: dto.problemTitle,
        problemDescription: dto.problemDescription,
        symptoms: dto.symptoms
          ? dto.symptoms.map((s) => ({ symptom: s.symptom }))
          : [],
        category: dto.category,
        vehicleMakes: dto.vehicleMakes
          ? dto.vehicleMakes.map((m) => ({ make: m.make }))
          : [],
        vehicleModels: dto.vehicleModels
          ? dto.vehicleModels.map((m) => ({ model: m.model }))
          : [],
        solutionTitle: dto.solutionTitle,
        solutionDescription: dto.solutionDescription,
        solutionSteps: dto.solutionSteps
          ? dto.solutionSteps.map((s) => ({
              step: s.step,
              description: s.description,
            }))
          : [],
        partsNeeded: dto.partsNeeded
          ? dto.partsNeeded.map((p) => ({
              name: p.name,
              partNumber: p.partNumber || null,
              avgCost: p.avgCost || null,
            }))
          : [],
        estimatedCost: dto.estimatedCost || null,
        estimatedTime: dto.estimatedTime || null,
        createdById: userId,
        createdByName: userName,
        isVerified: dto.isVerified || false,
      };

      const knowledge = await this.prisma.knowledgeBase.create({
        data,
      });

      return this.toResponseDto(knowledge);
    } catch (error) {
      this.logger.error(
        `Erro ao criar entrada na base de conhecimento: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Listar entradas da base de conhecimento com filtros
   */
  async findMany(
    tenantId: string,
    filters: KnowledgeFiltersDto,
  ): Promise<KnowledgeSummaryDto[]> {
    try {
      const where: Prisma.KnowledgeBaseWhereInput = {
        tenantId,
        isActive: filters.isActive !== undefined ? filters.isActive : true,
      };

      // Filtro por categoria
      if (filters.category) {
        where.category = filters.category;
      }

      // Filtro por soluções verificadas
      if (filters.isVerified !== undefined) {
        where.isVerified = filters.isVerified;
      }

      // Filtro por marca de veículo - usando abordagem diferente para campos JSON
      // Como o Prisma não suporta filtros complexos em JSON, vamos buscar tudo e filtrar depois

      // Busca por texto
      if (filters.search) {
        where.OR = [
          {
            problemTitle: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
          {
            problemDescription: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
          {
            solutionTitle: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
          {
            solutionDescription: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        ];
      }

      // Ordenação
      const orderBy: Prisma.KnowledgeBaseOrderByWithRelationInput = {};
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'desc';

      if (sortBy === 'rating') {
        orderBy.rating = sortOrder === 'desc' ? 'desc' : 'asc';
      } else if (sortBy === 'successCount') {
        orderBy.successCount = sortOrder === 'desc' ? 'desc' : 'asc';
      } else if (sortBy === 'viewCount') {
        orderBy.viewCount = sortOrder === 'desc' ? 'desc' : 'asc';
      } else {
        orderBy.createdAt = sortOrder === 'desc' ? 'desc' : 'asc';
      }

      // Buscar todos os registros que atendem aos filtros básicos
      let knowledge = await this.prisma.knowledgeBase.findMany({
        where,
        orderBy,
        select: {
          id: true,
          problemTitle: true,
          category: true,
          solutionTitle: true,
          successCount: true,
          rating: true,
          isVerified: true,
          createdByName: true,
          createdAt: true,
          vehicleMakes: true,
          vehicleModels: true,
          symptoms: true,
        },
      });

      // Aplicar filtros nos campos JSON manualmente
      if (filters.vehicleMake) {
        knowledge = knowledge.filter((item) => {
          const makes = Array.isArray(item.vehicleMakes)
            ? item.vehicleMakes
            : [];
          return makes.some((make: unknown) =>
            make.make
              ?.toLowerCase()
              .includes(filters.vehicleMake!.toLowerCase()),
          );
        });
      }

      if (filters.vehicleModel) {
        knowledge = knowledge.filter((item) => {
          const models = Array.isArray(item.vehicleModels)
            ? item.vehicleModels
            : [];
          return models.some((model: unknown) =>
            model.model
              ?.toLowerCase()
              .includes(filters.vehicleModel!.toLowerCase()),
          );
        });
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        knowledge = knowledge.filter((item) => {
          const symptoms = Array.isArray(item.symptoms) ? item.symptoms : [];
          const symptomText = symptoms
            .map((s: unknown) => s.symptom || '')
            .join(' ')
            .toLowerCase();
          return (
            item.problemTitle.toLowerCase().includes(searchLower) ||
            item.solutionTitle.toLowerCase().includes(searchLower) ||
            symptomText.includes(searchLower)
          );
        });
      }

      // Remover campos JSON dos resultados finais
      return knowledge.map((item) => ({
        id: item.id,
        problemTitle: item.problemTitle,
        category: item.category,
        solutionTitle: item.solutionTitle,
        successCount: item.successCount,
        rating: item.rating ? Number(item.rating) : undefined,
        isVerified: item.isVerified,
        createdByName: item.createdByName,
        createdAt: item.createdAt,
      }));
    } catch (error) {
      this.logger.error(
        `Erro ao buscar entradas da base de conhecimento: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Buscar entrada específica por ID
   */
  async findOne(tenantId: string, id: string): Promise<KnowledgeResponseDto> {
    try {
      const knowledge = await this.prisma.knowledgeBase.findFirst({
        where: {
          id,
          tenantId,
          isActive: true,
        },
      });

      if (!knowledge) {
        throw new NotFoundException(
          'Entrada na base de conhecimento não encontrada',
        );
      }

      // Incrementar contador de visualizações
      await this.prisma.knowledgeBase.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });

      return this.toResponseDto(knowledge);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar entrada da base de conhecimento: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Atualizar entrada da base de conhecimento
   */
  async update(
    tenantId: string,
    id: string,
    dto: UpdateKnowledgeDto,
  ): Promise<KnowledgeResponseDto> {
    try {
      const existing = await this.prisma.knowledgeBase.findFirst({
        where: { id, tenantId },
      });

      if (!existing) {
        throw new NotFoundException(
          'Entrada na base de conhecimento não encontrada',
        );
      }

      const data: Prisma.KnowledgeBaseUpdateInput = {};

      if (dto.problemTitle !== undefined) data.problemTitle = dto.problemTitle;
      if (dto.problemDescription !== undefined)
        data.problemDescription = dto.problemDescription;
      if (dto.symptoms !== undefined) {
        data.symptoms = dto.symptoms.map((s) => ({ symptom: s.symptom }));
      }
      if (dto.category !== undefined) data.category = dto.category;
      if (dto.vehicleMakes !== undefined) {
        data.vehicleMakes = dto.vehicleMakes.map((m) => ({ make: m.make }));
      }
      if (dto.vehicleModels !== undefined) {
        data.vehicleModels = dto.vehicleModels.map((m) => ({ model: m.model }));
      }
      if (dto.solutionTitle !== undefined)
        data.solutionTitle = dto.solutionTitle;
      if (dto.solutionDescription !== undefined)
        data.solutionDescription = dto.solutionDescription;
      if (dto.solutionSteps !== undefined) {
        data.solutionSteps = dto.solutionSteps.map((s) => ({
          step: s.step,
          description: s.description,
        }));
      }
      if (dto.partsNeeded !== undefined) {
        data.partsNeeded = dto.partsNeeded.map((p) => ({
          name: p.name,
          partNumber: p.partNumber || null,
          avgCost: p.avgCost || null,
        }));
      }
      if (dto.estimatedCost !== undefined)
        data.estimatedCost = dto.estimatedCost;
      if (dto.estimatedTime !== undefined)
        data.estimatedTime = dto.estimatedTime;
      if (dto.isVerified !== undefined) data.isVerified = dto.isVerified;

      const knowledge = await this.prisma.knowledgeBase.update({
        where: { id },
        data,
      });

      return this.toResponseDto(knowledge);
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar entrada da base de conhecimento: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Avaliar entrada da base de conhecimento
   */
  async rate(
    tenantId: string,
    id: string,
    dto: RateKnowledgeDto,
  ): Promise<KnowledgeResponseDto> {
    try {
      const existing = await this.prisma.knowledgeBase.findFirst({
        where: { id, tenantId },
      });

      if (!existing) {
        throw new NotFoundException(
          'Entrada na base de conhecimento não encontrada',
        );
      }

      // Calcular nova avaliação
      const currentRating = existing.rating ? Number(existing.rating) : 0;
      const totalRatings = existing.successCount + existing.failureCount + 1; // +1 para esta avaliação

      // Se funcionou, incrementa success, senão failure
      const successIncrement = dto.worked ? 1 : 0;
      const failureIncrement = dto.worked ? 0 : 1;

      // Calcular novo rating médio (simples média das avaliações)
      const newRating =
        (currentRating * (totalRatings - 1) + dto.rating) / totalRatings;

      const knowledge = await this.prisma.knowledgeBase.update({
        where: { id },
        data: {
          successCount: { increment: successIncrement },
          failureCount: { increment: failureIncrement },
          rating: newRating,
        },
      });

      return this.toResponseDto(knowledge);
    } catch (error) {
      this.logger.error(
        `Erro ao avaliar entrada da base de conhecimento: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Remover entrada da base de conhecimento (soft delete)
   */
  async remove(tenantId: string, id: string): Promise<void> {
    try {
      const existing = await this.prisma.knowledgeBase.findFirst({
        where: { id, tenantId },
      });

      if (!existing) {
        throw new NotFoundException(
          'Entrada na base de conhecimento não encontrada',
        );
      }

      await this.prisma.knowledgeBase.update({
        where: { id },
        data: { isActive: false },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao remover entrada da base de conhecimento: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Buscar soluções similares baseada em sintomas
   */
  async findSimilarSolutions(
    tenantId: string,
    symptoms: string[],
  ): Promise<KnowledgeSummaryDto[]> {
    try {
      // Buscar todas as entradas ativas e filtrar por sintomas
      const knowledge = await this.prisma.knowledgeBase.findMany({
        where: {
          tenantId,
          isActive: true,
        },
        orderBy: [{ successCount: 'desc' }, { rating: 'desc' }],
        select: {
          id: true,
          problemTitle: true,
          category: true,
          solutionTitle: true,
          successCount: true,
          rating: true,
          isVerified: true,
          createdByName: true,
          createdAt: true,
          symptoms: true,
        },
      });

      // Filtrar manualmente por sintomas
      const filteredKnowledge = knowledge
        .filter((item) => {
          const itemSymptoms = Array.isArray(item.symptoms)
            ? item.symptoms
            : [];
          return symptoms.some((searchSymptom) =>
            itemSymptoms.some((itemSymptom: unknown) =>
              itemSymptom.symptom
                ?.toLowerCase()
                .includes(searchSymptom.toLowerCase()),
            ),
          );
        })
        .slice(0, 5);

      return filteredKnowledge.map((item) => ({
        id: item.id,
        problemTitle: item.problemTitle,
        category: item.category,
        solutionTitle: item.solutionTitle,
        successCount: item.successCount,
        rating: item.rating ? Number(item.rating) : undefined,
        isVerified: item.isVerified,
        createdByName: item.createdByName,
        createdAt: item.createdAt,
      }));
    } catch (error) {
      this.logger.error(
        `Erro ao buscar soluções similares: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Converter entidade do banco para DTO de resposta
   */
  private toResponseDto(knowledge: unknown): KnowledgeResponseDto {
    return {
      id: knowledge.id,
      tenantId: knowledge.tenantId,
      problemTitle: knowledge.problemTitle,
      problemDescription: knowledge.problemDescription,
      symptoms: Array.isArray(knowledge.symptoms) ? knowledge.symptoms : [],
      category: knowledge.category,
      vehicleMakes: Array.isArray(knowledge.vehicleMakes)
        ? knowledge.vehicleMakes
        : [],
      vehicleModels: Array.isArray(knowledge.vehicleModels)
        ? knowledge.vehicleModels
        : [],
      solutionTitle: knowledge.solutionTitle,
      solutionDescription: knowledge.solutionDescription,
      solutionSteps: Array.isArray(knowledge.solutionSteps)
        ? knowledge.solutionSteps
        : [],
      partsNeeded: Array.isArray(knowledge.partsNeeded)
        ? knowledge.partsNeeded
        : [],
      estimatedCost: knowledge.estimatedCost
        ? Number(knowledge.estimatedCost)
        : undefined,
      estimatedTime: knowledge.estimatedTime
        ? Number(knowledge.estimatedTime)
        : undefined,
      successCount: knowledge.successCount,
      failureCount: knowledge.failureCount,
      rating: knowledge.rating ? Number(knowledge.rating) : undefined,
      viewCount: knowledge.viewCount,
      createdById: knowledge.createdById,
      createdByName: knowledge.createdByName,
      isVerified: knowledge.isVerified,
      isActive: knowledge.isActive,
      createdAt: knowledge.createdAt,
      updatedAt: knowledge.updatedAt,
    };
  }
}
