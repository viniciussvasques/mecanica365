import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  CreateChecklistDto,
  UpdateChecklistDto,
  ChecklistResponseDto,
  ChecklistFiltersDto,
  CompleteChecklistDto,
  ChecklistType,
  ChecklistEntityType,
  ChecklistItemResponseDto,
} from './dto';

import { ChecklistStatus } from './dto/checklist-type.enum';
import { Prisma } from '@prisma/client';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';

@Injectable()
export class ChecklistsService {
  private readonly logger = new Logger(ChecklistsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo checklist
   */
  async create(
    tenantId: string,
    createChecklistDto: CreateChecklistDto,
  ): Promise<ChecklistResponseDto> {
    try {
      // Validar se a entidade relacionada existe
      await this.validateRelatedEntity(
        tenantId,
        createChecklistDto.entityType,
        createChecklistDto.entityId,
      );

      // Validar tipo de checklist vs tipo de entidade
      this.validateChecklistTypeForEntity(
        createChecklistDto.checklistType,
        createChecklistDto.entityType,
      );

      const checklist = await this.prisma.checklist.create({
        data: {
          tenant: { connect: { id: tenantId } },
          entityType: createChecklistDto.entityType,
          entityId: createChecklistDto.entityId,
          checklistType: createChecklistDto.checklistType,
          name: createChecklistDto.name,
          description: createChecklistDto.description,
          status: ChecklistStatus.PENDING,
          items: {
            create: createChecklistDto.items.map((item, index) => ({
              title: item.title,
              description: item.description,
              isRequired: item.isRequired ?? false,
              order: item.order ?? index,
            })),
          },
        },
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
        },
      });

      this.logger.log(
        `Checklist criado: ${checklist.id} (${checklist.checklistType}) para ${createChecklistDto.entityType} ${createChecklistDto.entityId}`,
      );

      return this.toResponseDto(checklist);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao criar checklist: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Lista checklists com filtros e paginação
   */
  async findAll(
    tenantId: string,
    filters: ChecklistFiltersDto,
  ): Promise<{
    data: ChecklistResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      entityType,
      entityId,
      checklistType,
      status,
      startDate,
      endDate,
    } = filters;

    const where: Prisma.ChecklistWhereInput = {
      tenantId,
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
      ...(checklistType && { checklistType }),
      ...(status && { status }),
      ...(startDate &&
        endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
    };

    const [checklists, total] = await this.prisma.$transaction([
      this.prisma.checklist.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.checklist.count({ where }),
    ]);

    return {
      data: checklists.map((checklist) => this.toResponseDto(checklist)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Busca um checklist por ID
   */
  async findOne(tenantId: string, id: string): Promise<ChecklistResponseDto> {
    try {
      const checklist = await this.prisma.checklist.findFirst({
        where: {
          id,
          tenantId,
        },
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!checklist) {
        throw new NotFoundException('Checklist não encontrado');
      }

      return this.toResponseDto(checklist);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao buscar checklist: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Atualiza um checklist
   */
  async update(
    tenantId: string,
    id: string,
    updateChecklistDto: UpdateChecklistDto,
  ): Promise<ChecklistResponseDto> {
    try {
      const existingChecklist = await this.prisma.checklist.findFirst({
        where: { id, tenantId },
      });

      if (!existingChecklist) {
        throw new NotFoundException('Checklist não encontrado');
      }

      // Não permitir atualizar checklist completo
      const checklistStatus = existingChecklist.status as ChecklistStatus;
      if (checklistStatus === ChecklistStatus.COMPLETED) {
        throw new BadRequestException(
          'Não é possível atualizar um checklist já completo',
        );
      }

      // Validar se a entidade relacionada existe (se for atualizada)
      if (updateChecklistDto.entityType && updateChecklistDto.entityId) {
        await this.validateRelatedEntity(
          tenantId,
          updateChecklistDto.entityType,
          updateChecklistDto.entityId,
        );
        const checklistTypeToValidate = updateChecklistDto.checklistType
          ? updateChecklistDto.checklistType
          : (existingChecklist.checklistType as ChecklistType);
        const entityTypeToValidate = updateChecklistDto.entityType
          ? updateChecklistDto.entityType
          : (existingChecklist.entityType as ChecklistEntityType);
        this.validateChecklistTypeForEntity(
          checklistTypeToValidate,
          entityTypeToValidate,
        );
      }

      const updateData: Prisma.ChecklistUpdateInput = {
        ...(updateChecklistDto.name && { name: updateChecklistDto.name }),
        ...(updateChecklistDto.description !== undefined && {
          description: updateChecklistDto.description,
        }),
        ...(updateChecklistDto.entityType && {
          entityType: updateChecklistDto.entityType,
        }),
        ...(updateChecklistDto.entityId && {
          entityId: updateChecklistDto.entityId,
        }),
        ...(updateChecklistDto.checklistType && {
          checklistType: updateChecklistDto.checklistType,
        }),
      };

      // Atualizar itens se fornecidos
      if (updateChecklistDto.items) {
        // Remover itens antigos e criar novos
        await this.prisma.checklistItem.deleteMany({
          where: { checklistId: id },
        });

        updateData.items = {
          create: updateChecklistDto.items.map((item, index) => ({
            title: item.title,
            description: item.description,
            isRequired: item.isRequired ?? false,
            order: item.order ?? index,
          })),
        };
      }

      const updatedChecklist = await this.prisma.checklist.update({
        where: { id },
        data: updateData,
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
        },
      });

      this.logger.log(`Checklist atualizado: ${id}`);

      return this.toResponseDto(updatedChecklist);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao atualizar checklist: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Completa um checklist (marca itens como completos)
   */
  async complete(
    tenantId: string,
    id: string,
    completeChecklistDto: CompleteChecklistDto,
    completedById: string,
  ): Promise<ChecklistResponseDto> {
    try {
      const checklist = await this.prisma.checklist.findFirst({
        where: { id, tenantId },
        include: {
          items: true,
        },
      });

      if (!checklist) {
        throw new NotFoundException('Checklist não encontrado');
      }

      const checklistStatus = checklist.status as ChecklistStatus;
      if (checklistStatus === ChecklistStatus.COMPLETED) {
        throw new BadRequestException('Checklist já está completo');
      }

      // Atualizar itens
      for (const itemUpdate of completeChecklistDto.items) {
        await this.prisma.checklistItem.update({
          where: { id: itemUpdate.itemId },
          data: {
            isCompleted: itemUpdate.isCompleted,
            notes: itemUpdate.notes,
            ...(itemUpdate.isCompleted && {
              completedAt: new Date(),
            }),
          },
        });
      }

      // Verificar se todos os itens obrigatórios estão completos
      const updatedChecklist = await this.prisma.checklist.findFirst({
        where: { id },
        include: {
          items: true,
        },
      });

      const allRequiredItemsCompleted =
        updatedChecklist?.items
          .filter((item) => item.isRequired)
          .every((item) => item.isCompleted) ?? false;

      const allItemsCompleted =
        updatedChecklist?.items.every((item) => item.isCompleted) ?? false;

      // Atualizar status do checklist
      let newStatus = ChecklistStatus.IN_PROGRESS;
      if (allItemsCompleted) {
        newStatus = ChecklistStatus.COMPLETED;
      } else if (allRequiredItemsCompleted) {
        newStatus = ChecklistStatus.IN_PROGRESS;
      }

      const finalChecklist = await this.prisma.checklist.update({
        where: { id },
        data: {
          status: newStatus,
          ...(newStatus === ChecklistStatus.COMPLETED && {
            completedAt: new Date(),
            completedBy: { connect: { id: completedById } },
          }),
        },
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
        },
      });

      this.logger.log(`Checklist ${id} atualizado para status: ${newStatus}`);

      return this.toResponseDto(finalChecklist);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao completar checklist: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Valida se um checklist está completo (todos os itens obrigatórios)
   */
  async validate(tenantId: string, id: string): Promise<boolean> {
    try {
      const checklist = await this.prisma.checklist.findFirst({
        where: { id, tenantId },
        include: {
          items: true,
        },
      });

      if (!checklist) {
        throw new NotFoundException('Checklist não encontrado');
      }

      const allRequiredItemsCompleted = checklist.items
        .filter((item) => item.isRequired)
        .every((item) => item.isCompleted);

      return allRequiredItemsCompleted;
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao validar checklist: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Remove um checklist
   */
  async remove(tenantId: string, id: string): Promise<void> {
    try {
      const checklist = await this.prisma.checklist.findFirst({
        where: { id, tenantId },
      });

      if (!checklist) {
        throw new NotFoundException('Checklist não encontrado');
      }

      await this.prisma.checklist.delete({
        where: { id },
      });

      this.logger.log(`Checklist removido: ${id}`);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao remover checklist: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Valida se a entidade relacionada existe
   */
  private async validateRelatedEntity(
    tenantId: string,
    entityType: ChecklistEntityType,
    entityId: string,
  ): Promise<void> {
    if (entityType === ChecklistEntityType.QUOTE) {
      const quote = await this.prisma.quote.findFirst({
        where: { id: entityId, tenantId },
      });
      if (!quote) {
        throw new BadRequestException(
          `Orçamento com ID ${entityId} não encontrado`,
        );
      }
    } else if (entityType === ChecklistEntityType.SERVICE_ORDER) {
      const serviceOrder = await this.prisma.serviceOrder.findFirst({
        where: { id: entityId, tenantId },
      });
      if (!serviceOrder) {
        throw new BadRequestException(
          `Ordem de Serviço com ID ${entityId} não encontrada`,
        );
      }
    }
  }

  /**
   * Valida se o tipo de checklist é compatível com o tipo de entidade
   */
  private validateChecklistTypeForEntity(
    checklistType: ChecklistType,
    entityType: ChecklistEntityType,
  ): void {
    if (
      checklistType === ChecklistType.PRE_DIAGNOSIS &&
      entityType !== ChecklistEntityType.QUOTE
    ) {
      throw new BadRequestException(
        'Checklist pré-diagnóstico só pode ser usado com Quote',
      );
    }

    if (
      entityType === ChecklistEntityType.QUOTE &&
      checklistType !== ChecklistType.PRE_DIAGNOSIS
    ) {
      throw new BadRequestException(
        'Quote só pode ter checklist do tipo pré-diagnóstico',
      );
    }

    if (
      entityType === ChecklistEntityType.SERVICE_ORDER &&
      checklistType === ChecklistType.PRE_DIAGNOSIS
    ) {
      throw new BadRequestException(
        'Service Order não pode ter checklist pré-diagnóstico',
      );
    }
  }

  /**
   * Converte Prisma Checklist para DTO de resposta
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toResponseDto(checklist: any): ChecklistResponseDto {
    // Garantir que items sempre seja um array
    const items = Array.isArray(checklist.items)
      ? (
          checklist.items as Array<{
            id: string;
            checklistId: string;
            title: string;
            description: string | null;
            isRequired: boolean;
            isCompleted: boolean;
            completedAt: Date | null;
            notes: string | null;
            order: number;
            createdAt: Date;
            updatedAt: Date;
          }>
        ).map((item) => ({
          id: item.id,
          checklistId: item.checklistId,
          title: item.title,
          description: item.description,
          isRequired: item.isRequired,
          isCompleted: item.isCompleted,
          completedAt: item.completedAt,
          notes: item.notes,
          order: item.order,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }))
      : [];

    return {
      id: checklist.id,
      entityType: checklist.entityType as ChecklistEntityType,
      entityId: checklist.entityId,
      checklistType: checklist.checklistType as ChecklistType,
      name: checklist.name,
      description: checklist.description,
      status: checklist.status as ChecklistStatus,
      completedAt: checklist.completedAt,
      completedById: checklist.completedById,
      items: items as ChecklistItemResponseDto[],
      createdAt: checklist.createdAt,
      updatedAt: checklist.updatedAt,
    };
  }
}
