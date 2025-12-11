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
    } catch (error: unknown) {
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
      const where = this.buildWhereClause(tenantId, filters);
      const orderBy = this.buildOrderByClause(filters);

      const knowledgeResult = await this.prisma.knowledgeBase.findMany({
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

      const knowledge = this.applyJsonFilters(knowledgeResult, filters);
      return this.mapToSummaryDto(knowledge);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao buscar entradas da base de conhecimento: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  private buildWhereClause(
    tenantId: string,
    filters: KnowledgeFiltersDto,
  ): Prisma.KnowledgeBaseWhereInput {
    const where: Prisma.KnowledgeBaseWhereInput = {
      tenantId,
      isActive: filters.isActive ?? true,
    };

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    if (filters.search) {
      where.OR = this.buildSearchOrClause(filters.search);
    }

    return where;
  }

  private buildSearchOrClause(
    search: string,
  ): Prisma.KnowledgeBaseWhereInput[] {
    return [
      {
        problemTitle: {
          contains: search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        problemDescription: {
          contains: search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        solutionTitle: {
          contains: search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        solutionDescription: {
          contains: search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
    ];
  }

  private buildOrderByClause(
    filters: KnowledgeFiltersDto,
  ): Prisma.KnowledgeBaseOrderByWithRelationInput {
    const orderBy: Prisma.KnowledgeBaseOrderByWithRelationInput = {};
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    const direction = sortOrder === 'desc' ? 'desc' : 'asc';

    if (sortBy === 'rating') {
      orderBy.rating = direction;
    } else if (sortBy === 'successCount') {
      orderBy.successCount = direction;
    } else if (sortBy === 'viewCount') {
      orderBy.viewCount = direction;
    } else {
      orderBy.createdAt = direction;
    }

    return orderBy;
  }

  private applyJsonFilters(
    knowledge: Array<{
      id: string;
      problemTitle: string;
      category: string;
      solutionTitle: string;
      successCount: number;
      rating: Prisma.Decimal | null;
      isVerified: boolean;
      createdByName: string;
      createdAt: Date;
      vehicleMakes: Prisma.JsonValue;
      vehicleModels: Prisma.JsonValue;
      symptoms: Prisma.JsonValue;
    }>,
    filters: KnowledgeFiltersDto,
  ): Array<{
    id: string;
    problemTitle: string;
    category: string;
    solutionTitle: string;
    successCount: number;
    rating: Prisma.Decimal | null;
    isVerified: boolean;
    createdByName: string;
    createdAt: Date;
    vehicleMakes: Prisma.JsonValue;
    vehicleModels: Prisma.JsonValue;
    symptoms: Prisma.JsonValue;
  }> {
    let filtered = knowledge;

    if (filters.vehicleMake) {
      filtered = this.filterByVehicleMake(filtered, filters.vehicleMake);
    }

    if (filters.vehicleModel) {
      filtered = this.filterByVehicleModel(filtered, filters.vehicleModel);
    }

    if (filters.search) {
      filtered = this.filterBySearchInSymptoms(filtered, filters.search);
    }

    return filtered;
  }

  private filterByVehicleMake<
    T extends {
      vehicleMakes: unknown;
    },
  >(knowledge: T[], vehicleMake: string): T[] {
    const makeLower = vehicleMake.toLowerCase();
    return knowledge.filter((item) => {
      const makes = Array.isArray(item.vehicleMakes) ? item.vehicleMakes : [];
      return makes.some((make: { make?: string }) =>
        make.make?.toLowerCase().includes(makeLower),
      );
    });
  }

  private filterByVehicleModel<
    T extends {
      vehicleModels: unknown;
    },
  >(knowledge: T[], vehicleModel: string): T[] {
    const modelLower = vehicleModel.toLowerCase();
    return knowledge.filter((item) => {
      const models = Array.isArray(item.vehicleModels)
        ? item.vehicleModels
        : [];
      return models.some((model: { model?: string }) =>
        model.model?.toLowerCase().includes(modelLower),
      );
    });
  }

  private filterBySearchInSymptoms<
    T extends {
      problemTitle: string;
      solutionTitle: string;
      symptoms: unknown;
    },
  >(knowledge: T[], search: string): T[] {
    const searchLower = search.toLowerCase();
    return knowledge.filter((item) => {
      const symptoms = Array.isArray(item.symptoms) ? item.symptoms : [];
      const symptomText = symptoms
        .map((s: { symptom?: string } | string) =>
          typeof s === 'string' ? s : s.symptom || '',
        )
        .join(' ')
        .toLowerCase();
      return (
        item.problemTitle.toLowerCase().includes(searchLower) ||
        item.solutionTitle.toLowerCase().includes(searchLower) ||
        symptomText.includes(searchLower)
      );
    });
  }

  private mapToSummaryDto(
    knowledge: Array<{
      id: string;
      problemTitle: string;
      category: string;
      solutionTitle: string;
      successCount: number;
      rating: unknown;
      isVerified: boolean;
      createdByName: string;
      createdAt: Date;
    }>,
  ): KnowledgeSummaryDto[] {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
            itemSymptoms.some((itemSymptom: { symptom?: string } | string) => {
              const symptom =
                typeof itemSymptom === 'string'
                  ? itemSymptom
                  : itemSymptom.symptom;
              return symptom
                ?.toLowerCase()
                .includes(searchSymptom.toLowerCase());
            }),
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
    } catch (error: unknown) {
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
  private toResponseDto(
    knowledge: Prisma.KnowledgeBaseGetPayload<Record<string, never>>,
  ): KnowledgeResponseDto {
    return {
      id: knowledge.id,
      tenantId: knowledge.tenantId,
      problemTitle: knowledge.problemTitle,
      problemDescription: knowledge.problemDescription,
      symptoms: Array.isArray(knowledge.symptoms)
        ? (knowledge.symptoms as Array<{ symptom: string }>)
        : [],
      category: knowledge.category,
      vehicleMakes: Array.isArray(knowledge.vehicleMakes)
        ? (knowledge.vehicleMakes as Array<{ make: string }>)
        : [],
      vehicleModels: Array.isArray(knowledge.vehicleModels)
        ? (knowledge.vehicleModels as Array<{ model: string }>)
        : [],
      solutionTitle: knowledge.solutionTitle,
      solutionDescription: knowledge.solutionDescription,
      solutionSteps: Array.isArray(knowledge.solutionSteps)
        ? (knowledge.solutionSteps as Array<{
            step: number;
            description: string;
          }>)
        : [],
      partsNeeded: Array.isArray(knowledge.partsNeeded)
        ? (knowledge.partsNeeded as Array<{
            name: string;
            partNumber?: string;
            avgCost?: number;
          }>)
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
