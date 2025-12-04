import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierResponseDto,
  SupplierFiltersDto,
  DocumentType,
} from './dto';
import { Prisma } from '@prisma/client';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo fornecedor
   */
  async create(
    tenantId: string,
    createSupplierDto: CreateSupplierDto,
  ): Promise<SupplierResponseDto> {
    try {
      // Validar documento se fornecido
      if (createSupplierDto.document) {
        await this.validateDocumentUniqueness(
          tenantId,
          createSupplierDto.document,
        );
      }

      const supplier = await this.prisma.supplier.create({
        data: {
          tenantId,
          name: createSupplierDto.name,
          documentType: createSupplierDto.documentType || 'cnpj',
          document: createSupplierDto.document,
          phone: createSupplierDto.phone,
          email: createSupplierDto.email,
          address: createSupplierDto.address,
          city: createSupplierDto.city,
          state: createSupplierDto.state,
          zipCode: createSupplierDto.zipCode,
          contactName: createSupplierDto.contactName,
          notes: createSupplierDto.notes,
          isActive: createSupplierDto.isActive ?? true,
        },
      });

      return this.toResponseDto(supplier);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao criar fornecedor: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Lista fornecedores com filtros
   */
  async findAll(
    tenantId: string,
    filters: SupplierFiltersDto,
  ): Promise<{
    data: SupplierResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 20, 100);
      const skip = (page - 1) * limit;

      const where: Prisma.SupplierWhereInput = {
        tenantId,
        ...(filters.search && {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { document: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
        ...(filters.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters.city && {
          city: { contains: filters.city, mode: 'insensitive' },
        }),
        ...(filters.state && { state: filters.state }),
        ...(filters.startDate &&
          filters.endDate && {
            createdAt: {
              gte: new Date(filters.startDate),
              lte: new Date(filters.endDate),
            },
          }),
      };

      const [data, total] = await Promise.all([
        this.prisma.supplier.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.supplier.count({ where }),
      ]);

      return {
        data: data.map((supplier) => this.toResponseDto(supplier)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao listar fornecedores: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Busca fornecedor por ID
   */
  async findOne(tenantId: string, id: string): Promise<SupplierResponseDto> {
    try {
      const supplier = await this.prisma.supplier.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!supplier) {
        throw new NotFoundException('Fornecedor não encontrado');
      }

      return this.toResponseDto(supplier);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao buscar fornecedor: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Atualiza fornecedor
   */
  async update(
    tenantId: string,
    id: string,
    updateSupplierDto: UpdateSupplierDto,
  ): Promise<SupplierResponseDto> {
    try {
      const existingSupplier = await this.findSupplierByIdAndTenant(
        id,
        tenantId,
      );

      // Validar documento se foi alterado
      if (
        updateSupplierDto.document &&
        updateSupplierDto.document !== existingSupplier.document
      ) {
        await this.validateDocumentUniqueness(
          tenantId,
          updateSupplierDto.document,
          id,
        );
      }

      const supplier = await this.prisma.supplier.update({
        where: { id },
        data: {
          name: updateSupplierDto.name,
          documentType: updateSupplierDto.documentType,
          document: updateSupplierDto.document,
          phone: updateSupplierDto.phone,
          email: updateSupplierDto.email,
          address: updateSupplierDto.address,
          city: updateSupplierDto.city,
          state: updateSupplierDto.state,
          zipCode: updateSupplierDto.zipCode,
          contactName: updateSupplierDto.contactName,
          notes: updateSupplierDto.notes,
          isActive: updateSupplierDto.isActive,
        },
      });

      return this.toResponseDto(supplier);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao atualizar fornecedor: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Remove fornecedor
   */
  async remove(tenantId: string, id: string): Promise<void> {
    try {
      await this.findSupplierByIdAndTenant(id, tenantId);

      // Verificar se há peças vinculadas
      const partsCount = await this.prisma.part.count({
        where: {
          supplierId: id,
          tenantId,
        },
      });

      if (partsCount > 0) {
        throw new BadRequestException(
          `Não é possível remover fornecedor com ${partsCount} peça(s) vinculada(s)`,
        );
      }

      await this.prisma.supplier.delete({
        where: { id },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao remover fornecedor: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Busca fornecedor por ID e tenant
   */
  private async findSupplierByIdAndTenant(
    id: string,
    tenantId: string,
  ): Promise<{ id: string; document: string | null }> {
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        id,
        tenantId,
      },
      select: {
        id: true,
        document: true,
      },
    });

    if (!supplier) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    return supplier;
  }

  /**
   * Valida unicidade do documento
   */
  private async validateDocumentUniqueness(
    tenantId: string,
    document: string,
    excludeId?: string,
  ): Promise<void> {
    const existingSupplier = await this.prisma.supplier.findFirst({
      where: {
        tenantId,
        document,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    if (existingSupplier) {
      throw new BadRequestException('Documento já cadastrado');
    }
  }

  /**
   * Converte para DTO de resposta
   */
  private toResponseDto(supplier: {
    id: string;
    name: string;
    documentType: string | null;
    document: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    contactName: string | null;
    notes: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): SupplierResponseDto {
    return {
      id: supplier.id,
      name: supplier.name,
      documentType: (supplier.documentType as DocumentType) || undefined,
      document: supplier.document || undefined,
      phone: supplier.phone || undefined,
      email: supplier.email || undefined,
      address: supplier.address || undefined,
      city: supplier.city || undefined,
      state: supplier.state || undefined,
      zipCode: supplier.zipCode || undefined,
      contactName: supplier.contactName || undefined,
      notes: supplier.notes || undefined,
      isActive: supplier.isActive,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
    };
  }
}
