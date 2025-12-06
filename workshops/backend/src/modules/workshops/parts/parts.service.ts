import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  CreatePartDto,
  UpdatePartDto,
  PartResponseDto,
  PartFiltersDto,
  ImportPartsDto,
  ImportPartsResponseDto,
  ImportPartItemDto,
} from './dto';
import { Prisma } from '@prisma/client';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PartsService {
  private readonly logger = new Logger(PartsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova peça
   */
  async create(
    tenantId: string,
    createPartDto: CreatePartDto,
  ): Promise<PartResponseDto> {
    try {
      // Verificar se já existe peça com mesmo partNumber no tenant
      if (createPartDto.partNumber) {
        const existingPart = await this.prisma.part.findFirst({
          where: {
            tenantId,
            partNumber: createPartDto.partNumber,
          },
        });

        if (existingPart) {
          throw new BadRequestException(
            'Já existe uma peça cadastrada com este número',
          );
        }
      }

      // Criar peça
      const part = await this.prisma.part.create({
        data: {
          tenantId,
          partNumber: createPartDto.partNumber?.trim() || null,
          name: createPartDto.name.trim(),
          description: createPartDto.description?.trim() || null,
          category: createPartDto.category?.trim() || null,
          brand: createPartDto.brand?.trim() || null,
          supplierId: createPartDto.supplierId || null,
          quantity: createPartDto.quantity || 0,
          minQuantity: createPartDto.minQuantity || 0,
          costPrice: new Decimal(createPartDto.costPrice),
          sellPrice: new Decimal(createPartDto.sellPrice),
          location: createPartDto.location?.trim() || null,
          isActive: createPartDto.isActive ?? true,
        },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      this.logger.log(`Peça criada: ${part.id} (tenant: ${tenantId})`);

      return this.toResponseDto(part);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Erro ao criar peça: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao criar peça');
    }
  }

  /**
   * Lista todas as peças do tenant com filtros e paginação
   */
  async findAll(
    tenantId: string,
    filters: PartFiltersDto,
  ): Promise<{
    data: PartResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      // Construir condições de busca
      const where: Prisma.PartWhereInput = {
        tenantId,
      };

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search.trim(), mode: 'insensitive' } },
          {
            partNumber: {
              contains: filters.search.trim(),
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: filters.search.trim(),
              mode: 'insensitive',
            },
          },
        ];
      }

      if (filters.category) {
        where.category = {
          contains: filters.category.trim(),
          mode: 'insensitive',
        };
      }

      if (filters.brand) {
        where.brand = {
          contains: filters.brand.trim(),
          mode: 'insensitive',
        };
      }

      if (filters.supplierId) {
        where.supplierId = filters.supplierId;
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      // Buscar peças e total
      const [parts, total] = await Promise.all([
        this.prisma.part.findMany({
          where,
          skip,
          take: limit,
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.part.count({ where }),
      ]);

      // Filtrar por estoque baixo se solicitado
      let filteredParts = parts;
      if (filters.lowStock) {
        filteredParts = parts.filter(
          (part) => part.quantity <= part.minQuantity,
        );
      }

      return {
        data: filteredParts.map((part) =>
          this.toResponseDto(
            part as Prisma.PartGetPayload<{
              include: { supplier: { select: { id: true; name: true } } };
            }>,
          ),
        ),
        total: filters.lowStock ? filteredParts.length : total,
        page,
        limit,
        totalPages: Math.ceil(
          (filters.lowStock ? filteredParts.length : total) / limit,
        ),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao listar peças: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao listar peças');
    }
  }

  /**
   * Busca uma peça por ID
   */
  async findOne(tenantId: string, id: string): Promise<PartResponseDto> {
    try {
      const part = await this.prisma.part.findFirst({
        where: {
          id,
          tenantId,
        },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!part) {
        throw new NotFoundException('Peça não encontrada');
      }

      return this.toResponseDto(part);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Erro ao buscar peça: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao buscar peça');
    }
  }

  /**
   * Atualiza uma peça
   */
  async update(
    tenantId: string,
    id: string,
    updatePartDto: UpdatePartDto,
  ): Promise<PartResponseDto> {
    try {
      const existingPart = await this.findPartByIdAndTenant(id, tenantId);
      await this.validatePartNumberUniqueness(
        tenantId,
        id,
        updatePartDto.partNumber,
        existingPart.partNumber,
      );

      const updateData = this.preparePartUpdateData(updatePartDto);

      // Atualizar peça
      const updatedPart = await this.prisma.part.update({
        where: { id },
        data: updateData,
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      this.logger.log(`Peça atualizada: ${id} (tenant: ${tenantId})`);

      return this.toResponseDto(updatedPart);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        `Erro ao atualizar peça: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao atualizar peça');
    }
  }

  /**
   * Remove uma peça (soft delete - marca como inativa)
   */
  async remove(tenantId: string, id: string): Promise<void> {
    try {
      const part = await this.prisma.part.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!part) {
        throw new NotFoundException('Peça não encontrada');
      }

      // Verificar se a peça está sendo usada em alguma OS ou orçamento
      const usedInServiceOrder = await this.prisma.serviceOrderPart.findFirst({
        where: { partId: id },
      });

      const usedInQuote = await this.prisma.quoteItem.findFirst({
        where: {
          partId: id,
        },
      });

      if (usedInServiceOrder || usedInQuote) {
        // Marcar como inativa ao invés de deletar
        await this.prisma.part.update({
          where: { id },
          data: { isActive: false },
        });
        this.logger.log(
          `Peça marcada como inativa: ${id} (tenant: ${tenantId})`,
        );
      } else {
        // Deletar se não estiver sendo usada
        await this.prisma.part.delete({
          where: { id },
        });
        this.logger.log(`Peça removida: ${id} (tenant: ${tenantId})`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Erro ao remover peça: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao remover peça');
    }
  }

  private async findPartByIdAndTenant(
    id: string,
    tenantId: string,
  ): Promise<Prisma.PartGetPayload<Record<string, never>>> {
    const existingPart = await this.prisma.part.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingPart) {
      throw new NotFoundException('Peça não encontrada');
    }

    return existingPart;
  }

  private async validatePartNumberUniqueness(
    tenantId: string,
    id: string,
    newPartNumber: string | undefined,
    currentPartNumber: string | null,
  ): Promise<void> {
    if (!newPartNumber || newPartNumber === currentPartNumber) {
      return;
    }

    const duplicatePart = await this.prisma.part.findFirst({
      where: {
        tenantId,
        partNumber: newPartNumber,
        id: { not: id },
      },
    });

    if (duplicatePart) {
      throw new BadRequestException(
        'Já existe uma peça cadastrada com este número',
      );
    }
  }

  private preparePartUpdateData(
    updatePartDto: UpdatePartDto,
  ): Prisma.PartUpdateInput {
    const updateData: Prisma.PartUpdateInput = {};

    if (updatePartDto.partNumber !== undefined) {
      updateData.partNumber = updatePartDto.partNumber?.trim() || null;
    }
    if (updatePartDto.name !== undefined) {
      updateData.name = updatePartDto.name.trim();
    }
    if (updatePartDto.description !== undefined) {
      updateData.description = updatePartDto.description?.trim() || null;
    }
    if (updatePartDto.category !== undefined) {
      updateData.category = updatePartDto.category?.trim() || null;
    }
    if (updatePartDto.brand !== undefined) {
      updateData.brand = updatePartDto.brand?.trim() || null;
    }
    if (updatePartDto.supplierId !== undefined) {
      updateData.supplier = updatePartDto.supplierId
        ? { connect: { id: updatePartDto.supplierId } }
        : { disconnect: true };
    }
    if (updatePartDto.quantity !== undefined) {
      updateData.quantity = updatePartDto.quantity;
    }
    if (updatePartDto.minQuantity !== undefined) {
      updateData.minQuantity = updatePartDto.minQuantity;
    }
    if (updatePartDto.costPrice !== undefined) {
      updateData.costPrice = new Decimal(updatePartDto.costPrice);
    }
    if (updatePartDto.sellPrice !== undefined) {
      updateData.sellPrice = new Decimal(updatePartDto.sellPrice);
    }
    if (updatePartDto.location !== undefined) {
      updateData.location = updatePartDto.location?.trim() || null;
    }
    if (updatePartDto.isActive !== undefined) {
      updateData.isActive = updatePartDto.isActive;
    }

    return updateData;
  }

  /**
   * Importa múltiplas peças de uma vez
   */
  async importParts(
    tenantId: string,
    importPartsDto: ImportPartsDto,
  ): Promise<ImportPartsResponseDto> {
    const result: ImportPartsResponseDto = {
      total: importPartsDto.parts.length,
      created: 0,
      updated: 0,
      errors: 0,
      errorDetails: [],
    };

    for (let i = 0; i < importPartsDto.parts.length; i++) {
      const partData = importPartsDto.parts[i];
      const row = i + 2; // +2 porque linha 1 é cabeçalho e índice começa em 0

      try {
        // Validar dados obrigatórios
        if (!partData.name || partData.name.trim().length === 0) {
          result.errors++;
          result.errorDetails.push({
            row,
            name: partData.name,
            error: 'Nome é obrigatório',
          });
          continue;
        }

        // Verificar se já existe peça com mesmo partNumber
        if (partData.partNumber) {
          const existingPart = await this.prisma.part.findFirst({
            where: {
              tenantId,
              partNumber: partData.partNumber.trim(),
            },
          });

          if (existingPart) {
            // Atualizar peça existente
            const updateData = this.preparePartUpdateData({
              name: partData.name.trim(),
              description: partData.description?.trim(),
              category: partData.category?.trim(),
              brand: partData.brand?.trim(),
              supplierId: partData.supplierId,
              quantity: partData.quantity,
              minQuantity: partData.minQuantity,
              costPrice: partData.costPrice,
              sellPrice: partData.sellPrice,
              location: partData.location?.trim(),
              isActive: partData.isActive ?? true,
            });

            await this.prisma.part.update({
              where: { id: existingPart.id },
              data: updateData,
            });

            result.updated++;
            this.logger.log(
              `Peça atualizada via importação: ${existingPart.id} (partNumber: ${partData.partNumber})`,
            );
            continue;
          }
        }

        // Criar nova peça
        const part = await this.prisma.part.create({
          data: {
            tenantId,
            partNumber: partData.partNumber?.trim() || null,
            name: partData.name.trim(),
            description: partData.description?.trim() || null,
            category: partData.category?.trim() || null,
            brand: partData.brand?.trim() || null,
            supplierId: partData.supplierId || null,
            quantity: partData.quantity || 0,
            minQuantity: partData.minQuantity || 0,
            costPrice: new Decimal(partData.costPrice),
            sellPrice: new Decimal(partData.sellPrice),
            location: partData.location?.trim() || null,
            isActive: partData.isActive ?? true,
          },
        });

        result.created++;
        this.logger.log(
          `Peça criada via importação: ${part.id} (tenant: ${tenantId})`,
        );
      } catch (error) {
        result.errors++;
        const errorMessage = getErrorMessage(error);
        result.errorDetails.push({
          row,
          partNumber: partData.partNumber,
          name: partData.name,
          error: errorMessage,
        });
        this.logger.error(
          `Erro ao importar peça (linha ${row}): ${errorMessage}`,
          getErrorStack(error),
        );
      }
    }

    this.logger.log(
      `Importação concluída: ${result.created} criadas, ${result.updated} atualizadas, ${result.errors} erros`,
    );

    return result;
  }

  /**
   * Converte Part do Prisma para PartResponseDto
   */
  private toResponseDto(
    part: Prisma.PartGetPayload<{
      include: { supplier: { select: { id: true; name: true } } };
    }>,
  ): PartResponseDto {
    return {
      id: part.id,
      tenantId: part.tenantId,
      partNumber: part.partNumber || undefined,
      name: part.name,
      description: part.description || undefined,
      category: part.category || undefined,
      brand: part.brand || undefined,
      supplierId: part.supplierId || undefined,
      supplier: part.supplier
        ? {
            id: part.supplier.id,
            name: part.supplier.name,
          }
        : undefined,
      quantity: part.quantity,
      minQuantity: part.minQuantity,
      costPrice:
        typeof part.costPrice === 'object' && 'toNumber' in part.costPrice
          ? part.costPrice.toNumber()
          : Number(part.costPrice),
      sellPrice:
        typeof part.sellPrice === 'object' && 'toNumber' in part.sellPrice
          ? part.sellPrice.toNumber()
          : Number(part.sellPrice),
      location: part.location || undefined,
      isActive: part.isActive,
      createdAt: part.createdAt,
      updatedAt: part.updatedAt,
    };
  }
}
