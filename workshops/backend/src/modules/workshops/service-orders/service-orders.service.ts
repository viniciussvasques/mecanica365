import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  CreateServiceOrderDto,
  UpdateServiceOrderDto,
  ServiceOrderResponseDto,
  ServiceOrderFiltersDto,
  ServiceOrderStatus,
} from './dto';
import { Prisma } from '@prisma/client';
import { getErrorMessage } from '@common/utils/error.utils';
import { ElevatorsService } from '../elevators/elevators.service';

type PrismaServiceOrder = Prisma.ServiceOrderGetPayload<Record<string, never>>;

@Injectable()
export class ServiceOrdersService {
  private readonly logger = new Logger(ServiceOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly elevatorsService: ElevatorsService,
  ) {}

  /**
   * Gera número único de OS para o tenant
   */
  private async generateOrderNumber(tenantId: string): Promise<string> {
    const lastOrder = await this.prisma.serviceOrder.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastOrder) {
      return 'OS-001';
    }

    const lastNumber = parseInt(lastOrder.number.replace('OS-', ''), 10);
    const nextNumber = lastNumber + 1;
    return `OS-${nextNumber.toString().padStart(3, '0')}`;
  }

  /**
   * Cria uma nova ordem de serviço
   */
  async create(
    tenantId: string,
    createServiceOrderDto: CreateServiceOrderDto,
  ): Promise<ServiceOrderResponseDto> {
    try {
      // Validar cliente se fornecido
      if (createServiceOrderDto.customerId) {
        const customer = await this.prisma.customer.findFirst({
          where: {
            id: createServiceOrderDto.customerId,
            tenantId,
          },
        });

        if (!customer) {
          throw new NotFoundException('Cliente não encontrado');
        }
      }

      // Validar mecânico se fornecido
      if (createServiceOrderDto.technicianId) {
        const technician = await this.prisma.user.findFirst({
          where: {
            id: createServiceOrderDto.technicianId,
            tenantId,
            role: { in: ['mechanic', 'admin', 'manager'] },
          },
        });

        if (!technician) {
          throw new NotFoundException('Mecânico não encontrado');
        }
      }

      // Gerar número único
      const number = await this.generateOrderNumber(tenantId);

      // Calcular custo total se fornecido
      const totalCost =
        (createServiceOrderDto.laborCost || 0) +
        (createServiceOrderDto.partsCost || 0) -
        (createServiceOrderDto.discount || 0);

      // Criar OS
      const serviceOrder = await this.prisma.serviceOrder.create({
        data: {
          tenantId,
          number,
          customerId: createServiceOrderDto.customerId,
          vehicleVin: createServiceOrderDto.vehicleVin?.toUpperCase().trim(),
          vehiclePlaca: createServiceOrderDto.vehiclePlaca?.toUpperCase().trim(),
          vehicleMake: createServiceOrderDto.vehicleMake?.trim(),
          vehicleModel: createServiceOrderDto.vehicleModel?.trim(),
          vehicleYear: createServiceOrderDto.vehicleYear,
          vehicleMileage: createServiceOrderDto.vehicleMileage,
          technicianId: createServiceOrderDto.technicianId,
          status: createServiceOrderDto.status || ServiceOrderStatus.SCHEDULED,
          appointmentDate: createServiceOrderDto.appointmentDate
            ? new Date(createServiceOrderDto.appointmentDate)
            : null,
          estimatedHours: createServiceOrderDto.estimatedHours
            ? createServiceOrderDto.estimatedHours
            : null,
          laborCost: createServiceOrderDto.laborCost || null,
          partsCost: createServiceOrderDto.partsCost || null,
          totalCost: totalCost > 0 ? totalCost : null,
          discount: createServiceOrderDto.discount || 0,
          // Problema relatado pelo cliente
          reportedProblemCategory: createServiceOrderDto.reportedProblemCategory || null,
          reportedProblemDescription: createServiceOrderDto.reportedProblemDescription || null,
          reportedProblemSymptoms: createServiceOrderDto.reportedProblemSymptoms || [],
          // Problema identificado pelo mecânico
          identifiedProblemCategory: createServiceOrderDto.identifiedProblemCategory || null,
          identifiedProblemDescription: createServiceOrderDto.identifiedProblemDescription || null,
          identifiedProblemId: createServiceOrderDto.identifiedProblemId || null,
          // Observações e diagnóstico
          inspectionNotes: createServiceOrderDto.notes || null,
          diagnosticNotes: createServiceOrderDto.diagnosticNotes || null,
          // Recomendações
          recommendations: createServiceOrderDto.recommendations || null,
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
          technician: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Se elevador foi especificado, buscar veículo e reservar
      if (createServiceOrderDto.elevatorId) {
        try {
          // Buscar veículo pela placa ou VIN se fornecido
          let vehicleId: string | undefined;
          if (createServiceOrderDto.vehiclePlaca || createServiceOrderDto.vehicleVin) {
            const vehicle = await this.prisma.customerVehicle.findFirst({
              where: {
                customer: { tenantId },
                ...(createServiceOrderDto.vehiclePlaca && {
                  placa: createServiceOrderDto.vehiclePlaca.toUpperCase().trim(),
                }),
                ...(createServiceOrderDto.vehicleVin && {
                  vin: createServiceOrderDto.vehicleVin.toUpperCase().trim(),
                }),
              },
            });
            vehicleId = vehicle?.id;
          }

          await this.elevatorsService.reserve(tenantId, createServiceOrderDto.elevatorId, {
            serviceOrderId: serviceOrder.id,
            vehicleId,
            scheduledStartTime: createServiceOrderDto.appointmentDate,
            notes: `Reservado para ${number}`,
          });
        } catch (error) {
          this.logger.warn(
            `Não foi possível reservar elevador: ${getErrorMessage(error)}`,
          );
          // Não falha a criação da OS se a reserva falhar
        }
      }

      this.logger.log(`Ordem de serviço criada: ${number}`);

      return this.toResponseDto(serviceOrder);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Erro ao criar ordem de serviço: ${getErrorMessage(error)}`,
      );
      throw new BadRequestException('Erro ao criar ordem de serviço');
    }
  }

  /**
   * Lista ordens de serviço com filtros e paginação
   */
  async findAll(
    tenantId: string,
    filters: ServiceOrderFiltersDto,
  ): Promise<{
    data: ServiceOrderResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      number,
      status,
      customerId,
      technicianId,
      vehiclePlaca,
      vehicleVin,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.ServiceOrderWhereInput = {
      tenantId,
      ...(number && { number: { contains: number, mode: 'insensitive' } }),
      ...(status && { status }),
      ...(customerId && { customerId }),
      ...(technicianId && { technicianId }),
      ...(vehiclePlaca && {
        vehiclePlaca: { contains: vehiclePlaca.toUpperCase(), mode: 'insensitive' },
      }),
      ...(vehicleVin && {
        vehicleVin: { contains: vehicleVin.toUpperCase(), mode: 'insensitive' },
      }),
      ...(startDate &&
        endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      ...(startDate &&
        !endDate && {
          createdAt: { gte: new Date(startDate) },
        }),
      ...(!startDate &&
        endDate && {
          createdAt: { lte: new Date(endDate) },
        }),
    };

    const [serviceOrders, total] = await this.prisma.$transaction([
      this.prisma.serviceOrder.findMany({
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
              email: true,
            },
          },
          technician: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.serviceOrder.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: serviceOrders.map((so) => this.toResponseDto(so)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Busca uma ordem de serviço por ID
   */
  async findOne(
    tenantId: string,
    id: string,
  ): Promise<ServiceOrderResponseDto> {
    const serviceOrder = await this.prisma.serviceOrder.findFirst({
      where: {
        id,
        tenantId,
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
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!serviceOrder) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    return this.toResponseDto(serviceOrder);
  }

  /**
   * Atualiza uma ordem de serviço
   */
  async update(
    tenantId: string,
    id: string,
    updateServiceOrderDto: UpdateServiceOrderDto,
  ): Promise<ServiceOrderResponseDto> {
    try {
      const existingOrder = await this.prisma.serviceOrder.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!existingOrder) {
        throw new NotFoundException('Ordem de serviço não encontrada');
      }

      // Validar cliente se fornecido
      if (updateServiceOrderDto.customerId) {
        const customer = await this.prisma.customer.findFirst({
          where: {
            id: updateServiceOrderDto.customerId,
            tenantId,
          },
        });

        if (!customer) {
          throw new NotFoundException('Cliente não encontrado');
        }
      }

      // Validar mecânico se fornecido
      if (updateServiceOrderDto.technicianId) {
        const technician = await this.prisma.user.findFirst({
          where: {
            id: updateServiceOrderDto.technicianId,
            tenantId,
            role: { in: ['mechanic', 'admin', 'manager'] },
          },
        });

        if (!technician) {
          throw new NotFoundException('Mecânico não encontrado');
        }
      }

      // Calcular custo total se valores foram atualizados
      const laborCost =
        updateServiceOrderDto.laborCost !== undefined
          ? updateServiceOrderDto.laborCost
          : existingOrder.laborCost?.toNumber() || 0;
      const partsCost =
        updateServiceOrderDto.partsCost !== undefined
          ? updateServiceOrderDto.partsCost
          : existingOrder.partsCost?.toNumber() || 0;
      const discount =
        updateServiceOrderDto.discount !== undefined
          ? updateServiceOrderDto.discount
          : existingOrder.discount?.toNumber() || 0;

      const totalCost = laborCost + partsCost - discount;

      // Preparar dados de atualização
      const updateData: Prisma.ServiceOrderUpdateInput = {};

      if (updateServiceOrderDto.customerId !== undefined) {
        if (updateServiceOrderDto.customerId) {
          updateData.customer = { connect: { id: updateServiceOrderDto.customerId } };
        } else {
          updateData.customer = { disconnect: true };
        }
      }

      if (updateServiceOrderDto.vehicleVin !== undefined) {
        updateData.vehicleVin = updateServiceOrderDto.vehicleVin
          ? updateServiceOrderDto.vehicleVin.toUpperCase().trim()
          : null;
      }

      if (updateServiceOrderDto.vehiclePlaca !== undefined) {
        updateData.vehiclePlaca = updateServiceOrderDto.vehiclePlaca
          ? updateServiceOrderDto.vehiclePlaca.toUpperCase().trim()
          : null;
      }

      if (updateServiceOrderDto.vehicleMake !== undefined) {
        updateData.vehicleMake = updateServiceOrderDto.vehicleMake?.trim() || null;
      }

      if (updateServiceOrderDto.vehicleModel !== undefined) {
        updateData.vehicleModel = updateServiceOrderDto.vehicleModel?.trim() || null;
      }

      if (updateServiceOrderDto.vehicleYear !== undefined) {
        updateData.vehicleYear = updateServiceOrderDto.vehicleYear || null;
      }

      if (updateServiceOrderDto.vehicleMileage !== undefined) {
        updateData.vehicleMileage = updateServiceOrderDto.vehicleMileage || null;
      }

      if (updateServiceOrderDto.technicianId !== undefined) {
        if (updateServiceOrderDto.technicianId) {
          updateData.technician = { connect: { id: updateServiceOrderDto.technicianId } };
        } else {
          updateData.technician = { disconnect: true };
        }
      }

      if (updateServiceOrderDto.status !== undefined) {
        updateData.status = updateServiceOrderDto.status;
      }

      if (updateServiceOrderDto.appointmentDate !== undefined) {
        updateData.appointmentDate = updateServiceOrderDto.appointmentDate
          ? new Date(updateServiceOrderDto.appointmentDate)
          : null;
      }

      if (updateServiceOrderDto.estimatedHours !== undefined) {
        updateData.estimatedHours = updateServiceOrderDto.estimatedHours || null;
      }

      if (updateServiceOrderDto.laborCost !== undefined) {
        updateData.laborCost = updateServiceOrderDto.laborCost || null;
      }

      if (updateServiceOrderDto.partsCost !== undefined) {
        updateData.partsCost = updateServiceOrderDto.partsCost || null;
      }

      if (updateServiceOrderDto.discount !== undefined) {
        updateData.discount = updateServiceOrderDto.discount;
      }

      if (totalCost > 0) {
        updateData.totalCost = totalCost;
      }

      // Problema relatado pelo cliente
      if (updateServiceOrderDto.reportedProblemCategory !== undefined) {
        updateData.reportedProblemCategory = updateServiceOrderDto.reportedProblemCategory || null;
      }
      if (updateServiceOrderDto.reportedProblemDescription !== undefined) {
        updateData.reportedProblemDescription = updateServiceOrderDto.reportedProblemDescription?.trim() || null;
      }
      if (updateServiceOrderDto.reportedProblemSymptoms !== undefined) {
        updateData.reportedProblemSymptoms = updateServiceOrderDto.reportedProblemSymptoms || [];
      }

      // Problema identificado pelo mecânico
      if (updateServiceOrderDto.identifiedProblemCategory !== undefined) {
        updateData.identifiedProblemCategory = updateServiceOrderDto.identifiedProblemCategory || null;
      }
      if (updateServiceOrderDto.identifiedProblemDescription !== undefined) {
        updateData.identifiedProblemDescription = updateServiceOrderDto.identifiedProblemDescription?.trim() || null;
      }
      if (updateServiceOrderDto.identifiedProblemId !== undefined) {
        updateData.identifiedProblem = updateServiceOrderDto.identifiedProblemId
          ? { connect: { id: updateServiceOrderDto.identifiedProblemId } }
          : { disconnect: true };
      }

      // Observações e diagnóstico
      if (updateServiceOrderDto.notes !== undefined) {
        updateData.inspectionNotes = updateServiceOrderDto.notes?.trim() || null;
      }
      if (updateServiceOrderDto.diagnosticNotes !== undefined) {
        updateData.diagnosticNotes = updateServiceOrderDto.diagnosticNotes?.trim() || null;
      }

      // Recomendações
      if (updateServiceOrderDto.recommendations !== undefined) {
        updateData.recommendations = updateServiceOrderDto.recommendations?.trim() || null;
      }

      // Atualizar OS
      const updatedOrder = await this.prisma.serviceOrder.update({
        where: { id },
        data: updateData,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          technician: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(`Ordem de serviço atualizada: ${updatedOrder.number}`);

      return this.toResponseDto(updatedOrder);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Erro ao atualizar ordem de serviço: ${getErrorMessage(error)}`,
      );
      throw new BadRequestException('Erro ao atualizar ordem de serviço');
    }
  }

  /**
   * Inicia uma ordem de serviço
   */
  async start(tenantId: string, id: string): Promise<ServiceOrderResponseDto> {
    const serviceOrder = await this.prisma.serviceOrder.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!serviceOrder) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    if (serviceOrder.status === ServiceOrderStatus.COMPLETED) {
      throw new BadRequestException('Não é possível iniciar uma OS já finalizada');
    }

    if (serviceOrder.status === ServiceOrderStatus.CANCELLED) {
      throw new BadRequestException('Não é possível iniciar uma OS cancelada');
    }

    // Buscar reserva de elevador e iniciar uso
    const reservation = await this.prisma.elevatorUsage.findFirst({
      where: {
        serviceOrderId: id,
        endTime: null,
      },
    });

    if (reservation) {
      try {
        // Buscar veículo pela placa ou VIN da OS
        let vehicleId: string | undefined;
        if (serviceOrder.vehiclePlaca || serviceOrder.vehicleVin) {
          const vehicle = await this.prisma.customerVehicle.findFirst({
            where: {
              customer: { tenantId },
              ...(serviceOrder.vehiclePlaca && {
                placa: serviceOrder.vehiclePlaca.toUpperCase().trim(),
              }),
              ...(serviceOrder.vehicleVin && {
                vin: serviceOrder.vehicleVin.toUpperCase().trim(),
              }),
            },
          });
          vehicleId = vehicle?.id;
        }

        await this.elevatorsService.startUsage(tenantId, reservation.elevatorId, {
          serviceOrderId: id,
          vehicleId,
          notes: `OS ${serviceOrder.number} iniciada`,
        });
      } catch (error) {
        this.logger.warn(
          `Não foi possível iniciar uso do elevador: ${getErrorMessage(error)}`,
        );
        // Não falha o início da OS se o elevador falhar
      }
    }

    // Atualizar status e data de início
    const updatedOrder = await this.prisma.serviceOrder.update({
      where: { id },
      data: {
        status: ServiceOrderStatus.IN_PROGRESS,
        startedAt: new Date(),
        checkInDate: serviceOrder.checkInDate || new Date(),
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
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Ordem de serviço iniciada: ${updatedOrder.number}`);

    return this.toResponseDto(updatedOrder);
  }

  /**
   * Finaliza uma ordem de serviço
   */
  async complete(
    tenantId: string,
    id: string,
  ): Promise<ServiceOrderResponseDto> {
    const serviceOrder = await this.prisma.serviceOrder.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!serviceOrder) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    if (serviceOrder.status === ServiceOrderStatus.COMPLETED) {
      throw new BadRequestException('OS já está finalizada');
    }

    if (serviceOrder.status === ServiceOrderStatus.CANCELLED) {
      throw new BadRequestException('Não é possível finalizar uma OS cancelada');
    }

    // Finalizar uso do elevador se houver
    const activeUsage = await this.prisma.elevatorUsage.findFirst({
      where: {
        serviceOrderId: id,
        endTime: null,
      },
    });

    if (activeUsage) {
      try {
        await this.elevatorsService.endUsage(tenantId, activeUsage.elevatorId, {
          usageId: activeUsage.id,
          notes: `OS ${serviceOrder.number} finalizada`,
        });
      } catch (error) {
        this.logger.warn(
          `Não foi possível finalizar uso do elevador: ${getErrorMessage(error)}`,
        );
        // Não falha a finalização da OS se o elevador falhar
      }
    }

    // Atualizar status e data de conclusão
    const updatedOrder = await this.prisma.serviceOrder.update({
      where: { id },
      data: {
        status: ServiceOrderStatus.COMPLETED,
        completedAt: new Date(),
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
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Ordem de serviço finalizada: ${updatedOrder.number}`);

    return this.toResponseDto(updatedOrder);
  }

  /**
   * Cancela uma ordem de serviço
   */
  async cancel(tenantId: string, id: string): Promise<ServiceOrderResponseDto> {
    const serviceOrder = await this.prisma.serviceOrder.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!serviceOrder) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    if (serviceOrder.status === ServiceOrderStatus.COMPLETED) {
      throw new BadRequestException('Não é possível cancelar uma OS já finalizada');
    }

    if (serviceOrder.status === ServiceOrderStatus.CANCELLED) {
      throw new BadRequestException('OS já está cancelada');
    }

    // Finalizar uso do elevador se houver
    const activeUsage = await this.prisma.elevatorUsage.findFirst({
      where: {
        serviceOrderId: id,
        endTime: null,
      },
    });

    if (activeUsage) {
      try {
        await this.elevatorsService.endUsage(tenantId, activeUsage.elevatorId, {
          usageId: activeUsage.id,
          notes: `OS ${serviceOrder.number} cancelada`,
        });
      } catch (error) {
        this.logger.warn(
          `Não foi possível finalizar uso do elevador: ${getErrorMessage(error)}`,
        );
      }
    }

    // Atualizar status
    const updatedOrder = await this.prisma.serviceOrder.update({
      where: { id },
      data: {
        status: ServiceOrderStatus.CANCELLED,
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
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Ordem de serviço cancelada: ${updatedOrder.number}`);

    return this.toResponseDto(updatedOrder);
  }

  /**
   * Remove uma ordem de serviço
   */
  async remove(tenantId: string, id: string): Promise<void> {
    const serviceOrder = await this.prisma.serviceOrder.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!serviceOrder) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    // Não permitir remover OS com fatura associada
    if (serviceOrder.invoiceId) {
      throw new BadRequestException(
        'Não é possível remover uma OS com fatura associada',
      );
    }

    await this.prisma.serviceOrder.delete({
      where: { id },
    });

    this.logger.log(`Ordem de serviço removida: ${serviceOrder.number}`);
  }

  /**
   * Converte Prisma ServiceOrder para ServiceOrderResponseDto
   */
  private toResponseDto(
    serviceOrder: Prisma.ServiceOrderGetPayload<{
      include: {
        customer: {
          select: {
            id: true;
            name: true;
            phone: true;
            email: true;
          };
        };
        technician: {
          select: {
            id: true;
            name: true;
            email: true;
          };
        };
      };
    }>,
  ): ServiceOrderResponseDto {
    return {
      id: serviceOrder.id,
      tenantId: serviceOrder.tenantId,
      number: serviceOrder.number,
      customerId: serviceOrder.customerId || undefined,
      customer: serviceOrder.customer
        ? {
            id: serviceOrder.customer.id,
            name: serviceOrder.customer.name,
            phone: serviceOrder.customer.phone,
            email: serviceOrder.customer.email || undefined,
          }
        : undefined,
      vehicleVin: serviceOrder.vehicleVin || undefined,
      vehiclePlaca: serviceOrder.vehiclePlaca || undefined,
      vehicleMake: serviceOrder.vehicleMake || undefined,
      vehicleModel: serviceOrder.vehicleModel || undefined,
      vehicleYear: serviceOrder.vehicleYear || undefined,
      vehicleMileage: serviceOrder.vehicleMileage || undefined,
      technicianId: serviceOrder.technicianId || undefined,
      technician: serviceOrder.technician
        ? {
            id: serviceOrder.technician.id,
            name: serviceOrder.technician.name,
            email: serviceOrder.technician.email,
          }
        : undefined,
      status: serviceOrder.status as ServiceOrderStatus,
      appointmentDate: serviceOrder.appointmentDate || undefined,
      checkInDate: serviceOrder.checkInDate || undefined,
      checkInKm: serviceOrder.checkInKm || undefined,
      checkInFuelLevel: serviceOrder.checkInFuelLevel || undefined,
      // Problema relatado pelo cliente
      reportedProblemCategory: serviceOrder.reportedProblemCategory || undefined,
      reportedProblemDescription: serviceOrder.reportedProblemDescription || undefined,
      reportedProblemSymptoms: serviceOrder.reportedProblemSymptoms || [],
      // Problema identificado pelo mecânico
      identifiedProblemCategory: serviceOrder.identifiedProblemCategory || undefined,
      identifiedProblemDescription: serviceOrder.identifiedProblemDescription || undefined,
      identifiedProblemId: serviceOrder.identifiedProblemId || undefined,
      // Observações e diagnóstico
      inspectionNotes: serviceOrder.inspectionNotes || undefined,
      inspectionPhotos: serviceOrder.inspectionPhotos || [],
      diagnosticNotes: serviceOrder.diagnosticNotes || undefined,
      // Recomendações
      recommendations: serviceOrder.recommendations || undefined,
      estimatedHours: serviceOrder.estimatedHours?.toNumber() || undefined,
      laborCost: serviceOrder.laborCost?.toNumber() || undefined,
      partsCost: serviceOrder.partsCost?.toNumber() || undefined,
      totalCost: serviceOrder.totalCost?.toNumber() || undefined,
      discount: serviceOrder.discount?.toNumber() || undefined,
      actualHours: serviceOrder.actualHours?.toNumber() || undefined,
      startedAt: serviceOrder.startedAt || undefined,
      completedAt: serviceOrder.completedAt || undefined,
      invoiceId: serviceOrder.invoiceId || undefined,
      createdAt: serviceOrder.createdAt,
      updatedAt: serviceOrder.updatedAt,
    };
  }
}

