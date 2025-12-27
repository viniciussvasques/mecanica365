import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleResponseDto,
  VehicleFiltersDto,
} from './dto';
import { Prisma } from '@prisma/client';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';

// Tipo para CustomerVehicle do Prisma
export type PrismaVehicle = Prisma.CustomerVehicleGetPayload<Record<string, never>>;

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Cria um novo veículo
   */
  async create(
    tenantId: string,
    createVehicleDto: CreateVehicleDto,
  ): Promise<VehicleResponseDto> {
    try {
      await this.validateCustomerExists(tenantId, createVehicleDto.customerId);
      this.validateAtLeastOneIdentifierProvided(createVehicleDto);

      await this.validateIdentifiersForCreate(tenantId, createVehicleDto);
      await this.handleDefaultVehicleOnCreate(
        createVehicleDto.isDefault,
        createVehicleDto.customerId,
      );

      const vehicleData = this.prepareVehicleCreateData(createVehicleDto);
      const vehicle = await this.prisma.customerVehicle.create({
        data: vehicleData,
      });

      this.logger.log(
        `Veículo criado: ${vehicle.id} (cliente: ${createVehicleDto.customerId})`,
      );

      return this.toResponseDto(vehicle);
    } catch (error: unknown) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Erro ao criar veículo: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao criar veículo');
    }
  }

  /**
   * Lista veículos com filtros e paginação
   */
  async findAll(
    tenantId: string,
    filters: VehicleFiltersDto,
  ): Promise<{
    data: VehicleResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      // Construir filtros do Prisma
      const where: Prisma.CustomerVehicleWhereInput = {
        customer: {
          tenantId,
        },
      };

      if (filters.customerId) {
        where.customerId = filters.customerId;
      }

      if (filters.placa) {
        where.placa = {
          contains: filters.placa.toUpperCase(),
          mode: 'insensitive',
        };
      }

      if (filters.vin) {
        where.vin = {
          contains: filters.vin.toUpperCase(),
          mode: 'insensitive',
        };
      }

      if (filters.renavan) {
        (where as { renavan?: { contains: string } }).renavan = {
          contains: filters.renavan,
        };
      }

      if (filters.make) {
        where.make = {
          contains: filters.make,
          mode: 'insensitive',
        };
      }

      if (filters.model) {
        where.model = {
          contains: filters.model,
          mode: 'insensitive',
        };
      }

      // Buscar veículos
      const [vehicles, total] = await Promise.all([
        this.prisma.customerVehicle.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        }),
        this.prisma.customerVehicle.count({ where }),
      ]);

      return {
        data: vehicles.map((vehicle) => this.toResponseDto(vehicle)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao listar veículos: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao listar veículos');
    }
  }

  /**
   * Busca um veículo por ID
   */
  async findOne(tenantId: string, id: string): Promise<VehicleResponseDto> {
    try {
      const vehicle = await this.prisma.customerVehicle.findFirst({
        where: {
          id,
          customer: {
            tenantId,
          },
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
        },
      });

      if (!vehicle) {
        throw new NotFoundException('Veículo não encontrado');
      }

      return this.toResponseDto(vehicle);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Erro ao buscar veículo: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao buscar veículo');
    }
  }

  /**
   * Atualiza um veículo
   */
  async update(
    tenantId: string,
    id: string,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<VehicleResponseDto> {
    try {
      const existingVehicle = await this.findVehicleByIdAndTenant(id, tenantId);
      await this.validateCustomerTransfer(
        tenantId,
        updateVehicleDto.customerId,
        existingVehicle.customerId,
      );

      await this.validateIdentifiers(
        tenantId,
        id,
        updateVehicleDto,
        existingVehicle,
      );

      const finalIdentifiers = this.calculateFinalIdentifiers(
        updateVehicleDto,
        existingVehicle,
      );
      this.validateAtLeastOneIdentifier(finalIdentifiers);

      await this.handleDefaultVehicle(
        updateVehicleDto.isDefault,
        existingVehicle.customerId,
        id,
      );

      const updateData = await this.prepareVehicleUpdateData(
        updateVehicleDto,
        existingVehicle,
        id,
      );

      const updatedVehicle = await this.prisma.customerVehicle.update({
        where: { id },
        data: updateData,
      });

      this.logger.log(`Veículo atualizado: ${id}`);
      return this.toResponseDto(updatedVehicle);
    } catch (error: unknown) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Erro ao atualizar veículo: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao atualizar veículo');
    }
  }

  /**
   * Remove um veículo
   */
  async remove(tenantId: string, id: string): Promise<void> {
    try {
      // Verificar se o veículo existe e pertence ao tenant
      const vehicle = await this.prisma.customerVehicle.findFirst({
        where: {
          id,
          customer: {
            tenantId,
          },
        },
        include: {
          customer: {
            include: {
              serviceOrders: {
                where: {
                  OR: [
                    { vehicleVin: { not: null } },
                    { vehiclePlaca: { not: null } },
                  ],
                },
                take: 1,
              },
            },
          },
        },
      });

      if (!vehicle) {
        throw new NotFoundException('Veículo não encontrado');
      }

      // Verificar se há ordens de serviço associadas
      if (vehicle.customer.serviceOrders.length > 0) {
        throw new BadRequestException(
          'Não é possível excluir veículo com ordens de serviço associadas',
        );
      }

      // Remover veículo
      await this.prisma.customerVehicle.delete({
        where: { id },
      });

      this.logger.log(`Veículo removido: ${id}`);
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        `Erro ao remover veículo: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao remover veículo');
    }
  }

  private async validateCustomerExists(
    tenantId: string,
    customerId: string,
  ): Promise<void> {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }
  }

  private validateAtLeastOneIdentifierProvided(
    createVehicleDto: CreateVehicleDto,
  ): void {
    if (
      !createVehicleDto.vin &&
      !createVehicleDto.renavan &&
      !createVehicleDto.placa
    ) {
      throw new BadRequestException(
        'É necessário informar pelo menos um identificador: VIN, RENAVAN ou Placa',
      );
    }
  }

  private async validateIdentifiersForCreate(
    tenantId: string,
    createVehicleDto: CreateVehicleDto,
  ): Promise<void> {
    if (createVehicleDto.renavan) {
      await this.validateRenavanUniquenessForCreate(
        tenantId,
        createVehicleDto.renavan.trim(),
      );
    }

    if (createVehicleDto.vin) {
      await this.validateVinUniquenessForCreate(
        tenantId,
        createVehicleDto.vin.toUpperCase().trim(),
      );
    }

    if (createVehicleDto.placa) {
      await this.validatePlacaUniquenessForCreate(
        tenantId,
        createVehicleDto.placa.toUpperCase().trim(),
      );
    }
  }

  private async validateRenavanUniquenessForCreate(
    tenantId: string,
    normalizedRenavan: string,
  ): Promise<void> {
    const existingByRenavan = await this.prisma.customerVehicle.findFirst({
      where: {
        customer: {
          tenantId,
        },
        renavan: normalizedRenavan,
      } as Prisma.CustomerVehicleWhereInput,
    });

    if (existingByRenavan) {
      throw new ConflictException(
        'Já existe um veículo cadastrado com este RENAVAN',
      );
    }
  }

  private async validateVinUniquenessForCreate(
    tenantId: string,
    normalizedVin: string,
  ): Promise<void> {
    const existingByVin = await this.prisma.customerVehicle.findFirst({
      where: {
        customer: {
          tenantId,
        },
        vin: normalizedVin,
      },
    });

    if (existingByVin) {
      throw new ConflictException(
        'Já existe um veículo cadastrado com este VIN',
      );
    }
  }

  private async validatePlacaUniquenessForCreate(
    tenantId: string,
    normalizedPlaca: string,
  ): Promise<void> {
    const existingByPlaca = await this.prisma.customerVehicle.findFirst({
      where: {
        customer: {
          tenantId,
        },
        placa: normalizedPlaca,
      },
    });

    if (existingByPlaca) {
      throw new ConflictException(
        'Já existe um veículo cadastrado com esta placa',
      );
    }
  }

  private async handleDefaultVehicleOnCreate(
    isDefault: boolean | undefined,
    customerId: string,
  ): Promise<void> {
    if (isDefault) {
      await this.prisma.customerVehicle.updateMany({
        where: {
          customerId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }
  }

  private prepareVehicleCreateData(
    createVehicleDto: CreateVehicleDto,
  ): Prisma.CustomerVehicleCreateInput {
    const vehicleData: Prisma.CustomerVehicleCreateInput = {
      customer: {
        connect: { id: createVehicleDto.customerId },
      },
      isDefault: createVehicleDto.isDefault ?? false,
    };

    if (createVehicleDto.vin) {
      vehicleData.vin = createVehicleDto.vin.toUpperCase().trim();
    }
    if (createVehicleDto.renavan) {
      vehicleData.renavan = createVehicleDto.renavan.trim();
    }
    if (createVehicleDto.placa) {
      vehicleData.placa = createVehicleDto.placa.toUpperCase().trim();
    }
    if (createVehicleDto.make) {
      vehicleData.make = createVehicleDto.make.trim();
    }
    if (createVehicleDto.model) {
      vehicleData.model = createVehicleDto.model.trim();
    }
    if (createVehicleDto.year) {
      vehicleData.year = createVehicleDto.year;
    }
    if (createVehicleDto.color) {
      vehicleData.color = createVehicleDto.color.trim();
    }
    if (createVehicleDto.mileage !== undefined) {
      vehicleData.mileage = createVehicleDto.mileage;
    }

    return vehicleData;
  }

  private async findVehicleByIdAndTenant(
    id: string,
    tenantId: string,
  ): Promise<
    Prisma.CustomerVehicleGetPayload<{
      include: { customer: true };
    }>
  > {
    const existingVehicle = await this.prisma.customerVehicle.findFirst({
      where: {
        id,
        customer: {
          tenantId,
        },
      },
      include: {
        customer: true,
      },
    });

    if (!existingVehicle) {
      throw new NotFoundException('Veículo não encontrado');
    }

    return existingVehicle;
  }

  private async validateCustomerTransfer(
    tenantId: string,
    newCustomerId: string | undefined,
    currentCustomerId: string,
  ): Promise<void> {
    if (!newCustomerId || newCustomerId === currentCustomerId) {
      return;
    }

    const newCustomer = await this.prisma.customer.findFirst({
      where: {
        id: newCustomerId,
        tenantId,
      },
    });

    if (!newCustomer) {
      throw new NotFoundException('Cliente não encontrado para transferência');
    }
  }

  private async validateIdentifiers(
    tenantId: string,
    id: string,
    updateVehicleDto: UpdateVehicleDto,
    existingVehicle: Prisma.CustomerVehicleGetPayload<{
      include: { customer: true };
    }>,
  ): Promise<void> {
    if (updateVehicleDto.vin && updateVehicleDto.vin !== existingVehicle.vin) {
      await this.validateVinUniqueness(
        tenantId,
        id,
        updateVehicleDto.vin.toUpperCase().trim(),
      );
    }

    const existingVehicleWithRenavan =
      existingVehicle as typeof existingVehicle & { renavan?: string | null };

    if (
      updateVehicleDto.renavan &&
      updateVehicleDto.renavan !== existingVehicleWithRenavan.renavan
    ) {
      await this.validateRenavanUniqueness(
        tenantId,
        id,
        updateVehicleDto.renavan.trim(),
      );
    }

    if (
      updateVehicleDto.placa &&
      updateVehicleDto.placa !== existingVehicle.placa
    ) {
      await this.validatePlacaUniqueness(
        tenantId,
        id,
        updateVehicleDto.placa.toUpperCase().trim(),
      );
    }
  }

  private async validateVinUniqueness(
    tenantId: string,
    id: string,
    normalizedVin: string,
  ): Promise<void> {
    const existingByVin = await this.prisma.customerVehicle.findFirst({
      where: {
        id: { not: id },
        customer: {
          tenantId,
        },
        vin: normalizedVin,
      },
    });

    if (existingByVin) {
      throw new ConflictException(
        'Já existe um veículo cadastrado com este VIN',
      );
    }
  }

  private async validateRenavanUniqueness(
    tenantId: string,
    id: string,
    normalizedRenavan: string,
  ): Promise<void> {
    const existingByRenavan = await this.prisma.customerVehicle.findFirst({
      where: {
        id: { not: id },
        customer: {
          tenantId,
        },
        renavan: normalizedRenavan,
      } as Prisma.CustomerVehicleWhereInput,
    });

    if (existingByRenavan) {
      throw new ConflictException(
        'Já existe um veículo cadastrado com este RENAVAN',
      );
    }
  }

  private async validatePlacaUniqueness(
    tenantId: string,
    id: string,
    normalizedPlaca: string,
  ): Promise<void> {
    const existingByPlaca = await this.prisma.customerVehicle.findFirst({
      where: {
        id: { not: id },
        customer: {
          tenantId,
        },
        placa: normalizedPlaca,
      },
    });

    if (existingByPlaca) {
      throw new ConflictException(
        'Já existe um veículo cadastrado com esta placa',
      );
    }
  }

  private calculateFinalIdentifiers(
    updateVehicleDto: UpdateVehicleDto,
    existingVehicle: Prisma.CustomerVehicleGetPayload<{
      include: { customer: true };
    }>,
  ): { vin: string | null; renavan: string | null; placa: string | null } {
    const existingVehicleWithRenavan =
      existingVehicle as typeof existingVehicle & { renavan?: string | null };

    return {
      vin:
        updateVehicleDto.vin === undefined
          ? existingVehicle.vin
          : updateVehicleDto.vin?.toUpperCase().trim() || null,
      renavan:
        updateVehicleDto.renavan === undefined
          ? existingVehicleWithRenavan.renavan || null
          : updateVehicleDto.renavan?.trim() || null,
      placa:
        updateVehicleDto.placa === undefined
          ? existingVehicle.placa
          : updateVehicleDto.placa?.toUpperCase().trim() || null,
    };
  }

  private validateAtLeastOneIdentifier(identifiers: {
    vin: string | null;
    renavan: string | null;
    placa: string | null;
  }): void {
    if (!identifiers.vin && !identifiers.renavan && !identifiers.placa) {
      throw new BadRequestException(
        'É necessário manter pelo menos um identificador: VIN, RENAVAN ou Placa',
      );
    }
  }

  private async handleDefaultVehicle(
    isDefault: boolean | undefined,
    customerId: string,
    vehicleId: string,
  ): Promise<void> {
    if (isDefault === true) {
      await this.prisma.customerVehicle.updateMany({
        where: {
          customerId,
          id: { not: vehicleId },
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }
  }

  private async prepareVehicleUpdateData(
    updateVehicleDto: UpdateVehicleDto,
    existingVehicle: Prisma.CustomerVehicleGetPayload<{
      include: { customer: true };
    }>,
    id: string,
  ): Promise<Prisma.CustomerVehicleUpdateInput> {
    const updateData: Prisma.CustomerVehicleUpdateInput = {};

    this.applyVehicleIdentifierFields(updateData, updateVehicleDto);
    this.applyVehicleBasicFields(updateData, updateVehicleDto);
    await this.applyVehicleCustomerFields(
      updateData,
      updateVehicleDto,
      existingVehicle,
      id,
    );

    return updateData;
  }

  private applyVehicleIdentifierFields(
    updateData: Prisma.CustomerVehicleUpdateInput,
    updateVehicleDto: UpdateVehicleDto,
  ): void {
    if (updateVehicleDto.vin !== undefined) {
      updateData.vin = updateVehicleDto.vin
        ? updateVehicleDto.vin.toUpperCase().trim()
        : null;
    }

    if (updateVehicleDto.renavan !== undefined) {
      (updateData as { renavan?: string | null }).renavan =
        updateVehicleDto.renavan ? updateVehicleDto.renavan.trim() : null;
    }

    if (updateVehicleDto.placa !== undefined) {
      updateData.placa = updateVehicleDto.placa
        ? updateVehicleDto.placa.toUpperCase().trim()
        : null;
    }
  }

  private applyVehicleBasicFields(
    updateData: Prisma.CustomerVehicleUpdateInput,
    updateVehicleDto: UpdateVehicleDto,
  ): void {
    if (updateVehicleDto.make !== undefined) {
      updateData.make = updateVehicleDto.make?.trim() || null;
    }

    if (updateVehicleDto.model !== undefined) {
      updateData.model = updateVehicleDto.model?.trim() || null;
    }

    if (updateVehicleDto.year !== undefined) {
      updateData.year = updateVehicleDto.year || null;
    }

    if (updateVehicleDto.color !== undefined) {
      updateData.color = updateVehicleDto.color?.trim() || null;
    }

    if (updateVehicleDto.mileage !== undefined) {
      updateData.mileage = updateVehicleDto.mileage ?? null;
    }

    if (updateVehicleDto.isDefault !== undefined) {
      updateData.isDefault = updateVehicleDto.isDefault;
    }
  }

  private async applyVehicleCustomerFields(
    updateData: Prisma.CustomerVehicleUpdateInput,
    updateVehicleDto: UpdateVehicleDto,
    existingVehicle: Prisma.CustomerVehicleGetPayload<{
      include: { customer: true };
    }>,
    id: string,
  ): Promise<void> {
    if (
      updateVehicleDto.customerId &&
      updateVehicleDto.customerId !== existingVehicle.customerId
    ) {
      updateData.customer = { connect: { id: updateVehicleDto.customerId } };

      if (updateVehicleDto.isDefault !== false) {
        await this.prisma.customerVehicle.updateMany({
          where: {
            customerId: updateVehicleDto.customerId,
            id: { not: id },
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
        updateData.isDefault = true;
      }
    }
  }

  /**
   * Converte Prisma CustomerVehicle para VehicleResponseDto
   */
  private toResponseDto(
    vehicle:
      | PrismaVehicle
      | Prisma.CustomerVehicleGetPayload<{
        include: { customer: true };
      }>,
  ): VehicleResponseDto {
    const vehicleWithRenavan = vehicle as typeof vehicle & {
      renavan?: string | null;
    };
    return {
      id: vehicle.id,
      customerId: vehicle.customerId,
      vin: vehicle.vin,
      renavan: vehicleWithRenavan.renavan || null,
      placa: vehicle.placa,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      mileage: vehicle.mileage,
      isDefault: vehicle.isDefault,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    };
  }
}
