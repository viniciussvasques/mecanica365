import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  CreateElevatorDto,
  UpdateElevatorDto,
  ElevatorResponseDto,
  ElevatorFiltersDto,
  ElevatorType,
  ElevatorStatus,
  StartUsageDto,
  EndUsageDto,
  ReserveElevatorDto,
  UsageResponseDto,
} from './dto';
import { Prisma } from '@prisma/client';
import { getErrorMessage } from '@common/utils/error.utils';

@Injectable()
export class ElevatorsService {
  private readonly logger = new Logger(ElevatorsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo elevador
   */
  async create(
    tenantId: string,
    createElevatorDto: CreateElevatorDto,
  ): Promise<ElevatorResponseDto> {
    try {
      // Verificar se já existe elevador com mesmo número no tenant
      const existingElevator = await this.prisma.elevator.findFirst({
        where: {
          tenantId,
          number: createElevatorDto.number,
        },
      });

      if (existingElevator) {
        throw new ConflictException(
          'Já existe um elevador cadastrado com este número',
        );
      }

      // Criar elevador
      const elevator = await this.prisma.elevator.create({
        data: {
          tenantId,
          name: createElevatorDto.name.trim(),
          number: createElevatorDto.number.trim(),
          type: createElevatorDto.type || 'hydraulic',
          capacity: createElevatorDto.capacity,
          status: createElevatorDto.status || 'free',
          location: createElevatorDto.location?.trim() || null,
          notes: createElevatorDto.notes?.trim() || null,
        },
      });

      this.logger.log(`Elevador criado: ${elevator.id}`);

      return this.toResponseDto(elevator);
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Erro ao criar elevador: ${getErrorMessage(error)}`);
      throw new BadRequestException('Erro ao criar elevador');
    }
  }

  /**
   * Lista elevadores com filtros e paginação
   */
  async findAll(
    tenantId: string,
    filters: ElevatorFiltersDto,
  ): Promise<{
    data: ElevatorResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      const where: Prisma.ElevatorWhereInput = {
        tenantId,
        ...(filters.name && {
          name: {
            contains: filters.name,
            mode: 'insensitive',
          },
        }),
        ...(filters.number && {
          number: {
            contains: filters.number,
            mode: 'insensitive',
          },
        }),
        ...(filters.type && {
          type: filters.type,
        }),
        ...(filters.status && {
          status: filters.status,
        }),
      };

      const [elevators, total] = await Promise.all([
        this.prisma.elevator.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.elevator.count({ where }),
      ]);

      return {
        data: elevators.map((elevator) => this.toResponseDto(elevator)),
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Erro ao listar elevadores: ${getErrorMessage(error)}`);
      throw new BadRequestException('Erro ao listar elevadores');
    }
  }

  /**
   * Busca um elevador por ID
   */
  async findOne(tenantId: string, id: string): Promise<ElevatorResponseDto> {
    try {
      const elevator = await this.prisma.elevator.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!elevator) {
        throw new NotFoundException('Elevador não encontrado');
      }

      return this.toResponseDto(elevator);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erro ao buscar elevador: ${getErrorMessage(error)}`);
      throw new BadRequestException('Erro ao buscar elevador');
    }
  }

  /**
   * Atualiza um elevador
   */
  async update(
    tenantId: string,
    id: string,
    updateElevatorDto: UpdateElevatorDto,
  ): Promise<ElevatorResponseDto> {
    try {
      // Verificar se o elevador existe e pertence ao tenant
      const existingElevator = await this.prisma.elevator.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!existingElevator) {
        throw new NotFoundException('Elevador não encontrado');
      }

      // Se número foi alterado, verificar se não existe outro com mesmo número
      if (
        updateElevatorDto.number &&
        updateElevatorDto.number !== existingElevator.number
      ) {
        const existingByNumber = await this.prisma.elevator.findFirst({
          where: {
            id: { not: id },
            tenantId,
            number: updateElevatorDto.number,
          },
        });

        if (existingByNumber) {
          throw new ConflictException(
            'Já existe outro elevador com este número',
          );
        }
      }

      // Preparar dados para atualização
      const updateData: Prisma.ElevatorUpdateInput = {};

      if (updateElevatorDto.name !== undefined) {
        updateData.name = updateElevatorDto.name.trim();
      }

      if (updateElevatorDto.number !== undefined) {
        updateData.number = updateElevatorDto.number.trim();
      }

      if (updateElevatorDto.type !== undefined) {
        updateData.type = updateElevatorDto.type;
      }

      if (updateElevatorDto.capacity !== undefined) {
        updateData.capacity = updateElevatorDto.capacity;
      }

      if (updateElevatorDto.status !== undefined) {
        updateData.status = updateElevatorDto.status;
      }

      if (updateElevatorDto.location !== undefined) {
        updateData.location = updateElevatorDto.location?.trim() || null;
      }

      if (updateElevatorDto.notes !== undefined) {
        updateData.notes = updateElevatorDto.notes?.trim() || null;
      }

      // Atualizar elevador
      const updatedElevator = await this.prisma.elevator.update({
        where: { id },
        data: updateData,
      });

      this.logger.log(`Elevador atualizado: ${id}`);

      return this.toResponseDto(updatedElevator);
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(
        `Erro ao atualizar elevador: ${getErrorMessage(error)}`,
      );
      throw new BadRequestException('Erro ao atualizar elevador');
    }
  }

  /**
   * Remove um elevador
   */
  async remove(tenantId: string, id: string): Promise<void> {
    try {
      // Verificar se o elevador existe e pertence ao tenant
      const existingElevator = await this.prisma.elevator.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!existingElevator) {
        throw new NotFoundException('Elevador não encontrado');
      }

      // Verificar se há usos ativos (endTime null)
      const activeUsage = await this.prisma.elevatorUsage.findFirst({
        where: {
          elevatorId: id,
          endTime: null,
        },
      });

      if (activeUsage) {
        throw new BadRequestException(
          'Não é possível remover elevador com uso ativo',
        );
      }

      // Remover elevador (cascata remove usos e manutenções)
      await this.prisma.elevator.delete({
        where: { id },
      });

      this.logger.log(`Elevador removido: ${id}`);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Erro ao remover elevador: ${getErrorMessage(error)}`);
      throw new BadRequestException('Erro ao remover elevador');
    }
  }

  /**
   * Inicia uso do elevador (quando OS é iniciada)
   */
  async startUsage(
    tenantId: string,
    elevatorId: string,
    startUsageDto: StartUsageDto,
  ): Promise<UsageResponseDto> {
    try {
      // Verificar se elevador existe e pertence ao tenant
      const elevator = await this.prisma.elevator.findFirst({
        where: {
          id: elevatorId,
          tenantId,
        },
      });

      if (!elevator) {
        throw new NotFoundException('Elevador não encontrado');
      }

      // Verificar se elevador está disponível (free ou scheduled)
      if (elevator.status !== 'free' && elevator.status !== 'scheduled') {
        throw new BadRequestException(
          `Elevador está ${elevator.status === 'occupied' ? 'ocupado' : 'em manutenção'}. Não é possível iniciar uso.`,
        );
      }

      // Verificar se já existe uso ativo
      const activeUsage = await this.prisma.elevatorUsage.findFirst({
        where: {
          elevatorId,
          endTime: null,
        },
      });

      if (activeUsage) {
        throw new ConflictException('Elevador já está em uso');
      }

      // Verificar se veículo existe (se fornecido)
      if (startUsageDto.vehicleId) {
        const vehicle = await this.prisma.customerVehicle.findFirst({
          where: {
            id: startUsageDto.vehicleId,
            customer: {
              tenantId,
            },
          },
        });

        if (!vehicle) {
          throw new NotFoundException('Veículo não encontrado');
        }
      }

      // Verificar se OS existe (se fornecida)
      if (startUsageDto.serviceOrderId) {
        const serviceOrder = await this.prisma.serviceOrder.findFirst({
          where: {
            id: startUsageDto.serviceOrderId,
            tenantId,
          },
        });

        if (!serviceOrder) {
          throw new NotFoundException('Ordem de Serviço não encontrada');
        }
      }

      // Criar registro de uso
      const usage = await this.prisma.elevatorUsage.create({
        data: {
          elevatorId,
          serviceOrderId: startUsageDto.serviceOrderId,
          vehicleId: startUsageDto.vehicleId,
          startTime: new Date(),
          notes: startUsageDto.notes,
        },
        include: {
          elevator: true,
          serviceOrder: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
              technician: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          vehicle: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Atualizar status do elevador para occupied
      await this.prisma.elevator.update({
        where: { id: elevatorId },
        data: { status: 'occupied' },
      });

      this.logger.log(`Uso do elevador iniciado: ${elevatorId}`);

      return this.toUsageResponseDto(usage);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `Erro ao iniciar uso do elevador: ${getErrorMessage(error)}`,
      );
      throw new BadRequestException('Erro ao iniciar uso do elevador');
    }
  }

  /**
   * Finaliza uso do elevador (quando OS é finalizada)
   */
  async endUsage(
    tenantId: string,
    elevatorId: string,
    endUsageDto: EndUsageDto,
  ): Promise<UsageResponseDto> {
    try {
      // Verificar se elevador existe
      const elevator = await this.prisma.elevator.findFirst({
        where: {
          id: elevatorId,
          tenantId,
        },
      });

      if (!elevator) {
        throw new NotFoundException('Elevador não encontrado');
      }

      // Buscar uso ativo
      let activeUsage;
      if (endUsageDto.usageId) {
        activeUsage = await this.prisma.elevatorUsage.findFirst({
          where: {
            id: endUsageDto.usageId,
            elevatorId,
            endTime: null,
          },
        });
      } else {
        activeUsage = await this.prisma.elevatorUsage.findFirst({
          where: {
            elevatorId,
            endTime: null,
          },
        });
      }

      if (!activeUsage) {
        throw new NotFoundException('Nenhum uso ativo encontrado para este elevador');
      }

      // Finalizar uso
      const endTime = new Date();
      const updatedUsage = await this.prisma.elevatorUsage.update({
        where: { id: activeUsage.id },
        data: {
          endTime,
          notes: endUsageDto.notes
            ? `${activeUsage.notes || ''}\n${endUsageDto.notes}`.trim()
            : activeUsage.notes,
        },
        include: {
          elevator: true,
          serviceOrder: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
              technician: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          vehicle: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Atualizar status do elevador para free
      await this.prisma.elevator.update({
        where: { id: elevatorId },
        data: { status: 'free' },
      });

      this.logger.log(`Uso do elevador finalizado: ${elevatorId}`);

      return this.toUsageResponseDto(updatedUsage);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Erro ao finalizar uso do elevador: ${getErrorMessage(error)}`,
      );
      throw new BadRequestException('Erro ao finalizar uso do elevador');
    }
  }

  /**
   * Reserva elevador (quando orçamento é aprovado)
   */
  async reserve(
    tenantId: string,
    elevatorId: string,
    reserveDto: ReserveElevatorDto,
  ): Promise<UsageResponseDto> {
    try {
      // Verificar se elevador existe
      const elevator = await this.prisma.elevator.findFirst({
        where: {
          id: elevatorId,
          tenantId,
        },
      });

      if (!elevator) {
        throw new NotFoundException('Elevador não encontrado');
      }

      // Verificar se elevador está disponível
      if (elevator.status === 'occupied') {
        throw new ConflictException('Elevador está ocupado');
      }

      if (elevator.status === 'maintenance') {
        throw new BadRequestException('Elevador está em manutenção');
      }

      // Verificar se veículo existe (se fornecido)
      if (reserveDto.vehicleId) {
        const vehicle = await this.prisma.customerVehicle.findFirst({
          where: {
            id: reserveDto.vehicleId,
            customer: {
              tenantId,
            },
          },
        });

        if (!vehicle) {
          throw new NotFoundException('Veículo não encontrado');
        }
      }

      // Verificar se OS existe (se fornecida)
      if (reserveDto.serviceOrderId) {
        const serviceOrder = await this.prisma.serviceOrder.findFirst({
          where: {
            id: reserveDto.serviceOrderId,
            tenantId,
          },
        });

        if (!serviceOrder) {
          throw new NotFoundException('Ordem de Serviço não encontrada');
        }
      }

      // Criar reserva (uso futuro)
      const scheduledStartTime = reserveDto.scheduledStartTime
        ? new Date(reserveDto.scheduledStartTime)
        : new Date();

      const usage = await this.prisma.elevatorUsage.create({
        data: {
          elevatorId,
          serviceOrderId: reserveDto.serviceOrderId,
          vehicleId: reserveDto.vehicleId,
          startTime: scheduledStartTime,
          notes: reserveDto.notes,
        },
        include: {
          elevator: true,
          serviceOrder: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
              technician: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          vehicle: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Atualizar status do elevador para scheduled
      await this.prisma.elevator.update({
        where: { id: elevatorId },
        data: { status: 'scheduled' },
      });

      this.logger.log(`Elevador reservado: ${elevatorId}`);

      return this.toUsageResponseDto(usage);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `Erro ao reservar elevador: ${getErrorMessage(error)}`,
      );
      throw new BadRequestException('Erro ao reservar elevador');
    }
  }

  /**
   * Busca uso atual do elevador
   */
  async getCurrentUsage(
    tenantId: string,
    elevatorId: string,
  ): Promise<UsageResponseDto | null> {
    const elevator = await this.prisma.elevator.findFirst({
      where: {
        id: elevatorId,
        tenantId,
      },
    });

    if (!elevator) {
      throw new NotFoundException('Elevador não encontrado');
    }

    const activeUsage = await this.prisma.elevatorUsage.findFirst({
      where: {
        elevatorId,
        endTime: null,
      },
      include: {
        elevator: true,
        serviceOrder: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
            technician: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        vehicle: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!activeUsage) {
      return null;
    }

    return this.toUsageResponseDto(activeUsage);
  }

  /**
   * Busca histórico de uso do elevador
   */
  async getUsageHistory(
    tenantId: string,
    elevatorId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    },
  ): Promise<{
    data: UsageResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const elevator = await this.prisma.elevator.findFirst({
      where: {
        id: elevatorId,
        tenantId,
      },
    });

    if (!elevator) {
      throw new NotFoundException('Elevador não encontrado');
    }

    const { startDate, endDate, page = 1, limit = 10 } = filters || {};
    const skip = (page - 1) * limit;

    const where: Prisma.ElevatorUsageWhereInput = {
      elevatorId,
      ...(startDate && { startTime: { gte: startDate } }),
      ...(endDate && { startTime: { lte: endDate } }),
    };

    const [usages, total] = await this.prisma.$transaction([
      this.prisma.elevatorUsage.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          startTime: 'desc',
        },
        include: {
          elevator: true,
          serviceOrder: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
              technician: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          vehicle: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.elevatorUsage.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: usages.map((usage) => this.toUsageResponseDto(usage)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Converte Prisma ElevatorUsage para UsageResponseDto
   */
  private toUsageResponseDto(
    usage: Prisma.ElevatorUsageGetPayload<{
      include: {
        elevator: true;
        serviceOrder: {
          include: {
            customer: { select: { id: true; name: true } };
            technician: { select: { id: true; name: true } };
          };
        };
        vehicle: {
          include: {
            customer: { select: { id: true; name: true } };
          };
        };
      };
    }>,
  ): UsageResponseDto {
    const durationMinutes = usage.endTime
      ? Math.floor(
          (usage.endTime.getTime() - usage.startTime.getTime()) / (1000 * 60),
        )
      : undefined;

    return {
      id: usage.id,
      elevatorId: usage.elevatorId,
      elevator: {
        id: usage.elevator.id,
        name: usage.elevator.name,
        number: usage.elevator.number,
        status: usage.elevator.status,
      },
      serviceOrderId: usage.serviceOrderId || undefined,
      serviceOrder: usage.serviceOrder
        ? {
            id: usage.serviceOrder.id,
            number: usage.serviceOrder.number,
            customer: usage.serviceOrder.customer
              ? {
                  id: usage.serviceOrder.customer.id,
                  name: usage.serviceOrder.customer.name,
                }
              : undefined,
            technician: usage.serviceOrder.technician
              ? {
                  id: usage.serviceOrder.technician.id,
                  name: usage.serviceOrder.technician.name,
                }
              : undefined,
          }
        : undefined,
      vehicleId: usage.vehicleId || undefined,
      vehicle: usage.vehicle
        ? {
            id: usage.vehicle.id,
            placa: usage.vehicle.placa || undefined,
            make: usage.vehicle.make || undefined,
            model: usage.vehicle.model || undefined,
            year: usage.vehicle.year || undefined,
            customer: usage.vehicle.customer
              ? {
                  id: usage.vehicle.customer.id,
                  name: usage.vehicle.customer.name,
                }
              : undefined,
          }
        : undefined,
      startTime: usage.startTime,
      endTime: usage.endTime || undefined,
      durationMinutes,
      notes: usage.notes || undefined,
      createdAt: usage.createdAt,
    };
  }

  /**
   * Converte Prisma Elevator para ElevatorResponseDto
   */
  private toResponseDto(
    elevator: Prisma.ElevatorGetPayload<Record<string, never>>,
  ): ElevatorResponseDto {
    return {
      id: elevator.id,
      tenantId: elevator.tenantId,
      name: elevator.name,
      number: elevator.number,
      type: elevator.type as ElevatorType,
      capacity: Number(elevator.capacity),
      status: elevator.status as ElevatorStatus,
      location: elevator.location,
      notes: elevator.notes,
      createdAt: elevator.createdAt,
      updatedAt: elevator.updatedAt,
    };
  }
}
