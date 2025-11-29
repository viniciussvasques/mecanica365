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
type PrismaVehicle = Prisma.CustomerVehicleGetPayload<Record<string, never>>;

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo veículo
   */
  async create(
    tenantId: string,
    createVehicleDto: CreateVehicleDto,
  ): Promise<VehicleResponseDto> {
    try {
      // Verificar se o cliente existe e pertence ao tenant
      const customer = await this.prisma.customer.findFirst({
        where: {
          id: createVehicleDto.customerId,
          tenantId,
        },
      });

      if (!customer) {
        throw new NotFoundException('Cliente não encontrado');
      }

      // Validar que pelo menos um identificador seja fornecido (VIN, RENAVAN ou Placa)
      if (
        !createVehicleDto.vin &&
        !createVehicleDto.renavan &&
        !createVehicleDto.placa
      ) {
        throw new BadRequestException(
          'É necessário informar pelo menos um identificador: VIN, RENAVAN ou Placa',
        );
      }

      // Validar RENAVAN se fornecido
      if (createVehicleDto.renavan) {
        const normalizedRenavan = createVehicleDto.renavan.trim();

        // Verificar se já existe veículo com mesmo RENAVAN no tenant
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

      // Validar VIN se fornecido
      if (createVehicleDto.vin) {
        const normalizedVin = createVehicleDto.vin.toUpperCase().trim();

        // Verificar se já existe veículo com mesmo VIN no tenant
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

      // Validar placa se fornecida
      if (createVehicleDto.placa) {
        const normalizedPlaca = createVehicleDto.placa.toUpperCase().trim();

        // Verificar se já existe veículo com mesma placa no tenant
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

      // Se isDefault for true, desmarcar outros veículos padrão do cliente
      if (createVehicleDto.isDefault) {
        await this.prisma.customerVehicle.updateMany({
          where: {
            customerId: createVehicleDto.customerId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      // Criar veículo - não enviar campos null, apenas undefined ou omitir
      const vehicleData: any = {
        customerId: createVehicleDto.customerId,
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

      const vehicle = await this.prisma.customerVehicle.create({
        data: vehicleData,
      });

      this.logger.log(
        `Veículo criado: ${vehicle.id} (cliente: ${createVehicleDto.customerId})`,
      );

      return this.toResponseDto(vehicle);
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
      // Verificar se o veículo existe e pertence ao tenant
      const existingVehicle = await this.prisma.customerVehicle.findFirst({
        where: {
          id,
          customer: {
            tenantId,
          },
        },
      });

      if (!existingVehicle) {
        throw new NotFoundException('Veículo não encontrado');
      }

      // Se customerId foi fornecido, validar transferência de veículo
      if (
        updateVehicleDto.customerId &&
        updateVehicleDto.customerId !== existingVehicle.customerId
      ) {
        // Verificar se o novo cliente existe e pertence ao tenant
        const newCustomer = await this.prisma.customer.findFirst({
          where: {
            id: updateVehicleDto.customerId,
            tenantId,
          },
        });

        if (!newCustomer) {
          throw new NotFoundException(
            'Cliente não encontrado para transferência',
          );
        }
      }

      // Validar VIN se fornecido e diferente do atual
      if (
        updateVehicleDto.vin &&
        updateVehicleDto.vin !== existingVehicle.vin
      ) {
        const normalizedVin = updateVehicleDto.vin.toUpperCase().trim();

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

      // Declarar tipo com renavan uma única vez
      const existingVehicleWithRenavan =
        existingVehicle as typeof existingVehicle & { renavan?: string | null };

      // Validar RENAVAN se fornecido e diferente do atual
      if (
        updateVehicleDto.renavan &&
        updateVehicleDto.renavan !== existingVehicleWithRenavan.renavan
      ) {
        const normalizedRenavan = updateVehicleDto.renavan.trim();

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

      // Validar placa se fornecida e diferente da atual
      if (
        updateVehicleDto.placa &&
        updateVehicleDto.placa !== existingVehicle.placa
      ) {
        const normalizedPlaca = updateVehicleDto.placa.toUpperCase().trim();

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

      // Validar que pelo menos um identificador seja mantido (VIN, RENAVAN ou Placa)
      // Usar existingVehicleWithRenavan já declarado acima
      const finalVin =
        updateVehicleDto.vin !== undefined
          ? updateVehicleDto.vin?.toUpperCase().trim() || null
          : existingVehicle.vin;
      const finalRenavan =
        updateVehicleDto.renavan !== undefined
          ? updateVehicleDto.renavan?.trim() || null
          : existingVehicleWithRenavan.renavan || null;
      const finalPlaca =
        updateVehicleDto.placa !== undefined
          ? updateVehicleDto.placa?.toUpperCase().trim() || null
          : existingVehicle.placa;

      if (!finalVin && !finalRenavan && !finalPlaca) {
        throw new BadRequestException(
          'É necessário manter pelo menos um identificador: VIN, RENAVAN ou Placa',
        );
      }

      // Se isDefault for true, desmarcar outros veículos padrão do cliente
      if (updateVehicleDto.isDefault === true) {
        await this.prisma.customerVehicle.updateMany({
          where: {
            customerId: existingVehicle.customerId,
            id: { not: id },
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      // Preparar dados para atualização - não enviar null, apenas undefined ou omitir
      const updateData: Prisma.CustomerVehicleUpdateInput = {};

      if (updateVehicleDto.vin !== undefined) {
        if (updateVehicleDto.vin) {
          updateData.vin = updateVehicleDto.vin.toUpperCase().trim();
        } else {
          updateData.vin = null; // Permitir limpar o campo
        }
      }

      if (updateVehicleDto.renavan !== undefined) {
        if (updateVehicleDto.renavan) {
          (updateData as { renavan?: string }).renavan =
            updateVehicleDto.renavan.trim();
        } else {
          (updateData as { renavan?: string | null }).renavan = null; // Permitir limpar o campo
        }
      }

      if (updateVehicleDto.placa !== undefined) {
        if (updateVehicleDto.placa) {
          updateData.placa = updateVehicleDto.placa.toUpperCase().trim();
        } else {
          updateData.placa = null; // Permitir limpar o campo
        }
      }

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

      // Se customerId foi fornecido, transferir veículo para novo cliente
      if (
        updateVehicleDto.customerId &&
        updateVehicleDto.customerId !== existingVehicle.customerId
      ) {
        updateData.customer = { connect: { id: updateVehicleDto.customerId } };

        // Se isDefault não foi explicitamente false, marcar como padrão no novo cliente
        if (updateVehicleDto.isDefault !== false) {
          // Desmarcar outros veículos padrão do novo cliente
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

      // Atualizar veículo
      const updatedVehicle = await this.prisma.customerVehicle.update({
        where: { id },
        data: updateData,
      });

      this.logger.log(`Veículo atualizado: ${id}`);

      return this.toResponseDto(updatedVehicle);
    } catch (error) {
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
    } catch (error) {
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
