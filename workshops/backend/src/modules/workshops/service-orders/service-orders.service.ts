import {
  Injectable,
  NotFoundException,
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
import { ChecklistsService } from '../checklists/checklists.service';
import {
  ChecklistType,
  ChecklistEntityType,
  ChecklistStatus,
} from '../checklists/dto';
import { AttachmentsService } from '../attachments/attachments.service';
import {
  NotificationsService,
  NotificationType,
} from '@core/notifications/notifications.service';

@Injectable()
export class ServiceOrdersService {
  private readonly logger = new Logger(ServiceOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly elevatorsService: ElevatorsService,
    private readonly checklistsService: ChecklistsService,
    private readonly attachmentsService: AttachmentsService,
    private readonly notificationsService: NotificationsService,
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
          vehiclePlaca: createServiceOrderDto.vehiclePlaca
            ?.toUpperCase()
            .trim(),
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
          reportedProblemCategory:
            createServiceOrderDto.reportedProblemCategory || null,
          reportedProblemDescription:
            createServiceOrderDto.reportedProblemDescription || null,
          reportedProblemSymptoms:
            createServiceOrderDto.reportedProblemSymptoms || [],
          // Problema identificado pelo mecânico
          identifiedProblemCategory:
            createServiceOrderDto.identifiedProblemCategory || null,
          identifiedProblemDescription:
            createServiceOrderDto.identifiedProblemDescription || null,
          identifiedProblemId:
            createServiceOrderDto.identifiedProblemId || null,
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
          services: true,
          partsConsumed: { include: { part: true } },
          elevatorUsages: {
            where: {
              endTime: null,
            },
            include: {
              elevator: {
                select: {
                  id: true,
                  name: true,
                  number: true,
                  status: true,
                },
              },
            },
            take: 1,
          },
          quotes: {
            select: {
              id: true,
              number: true,
              totalCost: true,
            },
            take: 1,
          },
        },
      });

      // Se elevador foi especificado, buscar veículo e reservar
      if (createServiceOrderDto.elevatorId) {
        try {
          // Buscar veículo pela placa ou VIN se fornecido
          let vehicleId: string | undefined;
          if (
            createServiceOrderDto.vehiclePlaca ||
            createServiceOrderDto.vehicleVin
          ) {
            const vehicle = await this.prisma.customerVehicle.findFirst({
              where: {
                customer: { tenantId },
                ...(createServiceOrderDto.vehiclePlaca && {
                  placa: createServiceOrderDto.vehiclePlaca
                    .toUpperCase()
                    .trim(),
                }),
                ...(createServiceOrderDto.vehicleVin && {
                  vin: createServiceOrderDto.vehicleVin.toUpperCase().trim(),
                }),
              },
            });
            vehicleId = vehicle?.id;
          }

          await this.elevatorsService.reserve(
            tenantId,
            createServiceOrderDto.elevatorId,
            {
              serviceOrderId: serviceOrder.id,
              vehicleId,
              scheduledStartTime: createServiceOrderDto.appointmentDate,
              notes: `Reservado para ${number}`,
            },
          );
        } catch (error) {
          this.logger.warn(
            `Não foi possível reservar elevador: ${getErrorMessage(error)}`,
          );
          // Não falha a criação da OS se a reserva falhar
        }
      }

      this.logger.log(`Ordem de serviço criada: ${number}`);

      // Criar checklists de serviço automaticamente
      try {
        // Checklist pré-serviço (obrigatório)
        await this.checklistsService.create(tenantId, {
          entityType: ChecklistEntityType.SERVICE_ORDER,
          entityId: serviceOrder.id,
          checklistType: ChecklistType.PRE_SERVICE,
          name: `Checklist Pré-Serviço - ${number}`,
          description: 'Checklist para verificação antes de iniciar o serviço',
          items: [
            {
              title: 'Verificar ferramentas necessárias',
              description:
                'Confirmar que todas as ferramentas estão disponíveis',
              isRequired: true,
              order: 0,
            },
            {
              title: 'Verificar peças e materiais',
              description: 'Confirmar disponibilidade de peças e materiais',
              isRequired: true,
              order: 1,
            },
            {
              title: 'Verificar segurança do veículo',
              description:
                'Verificar se o veículo está seguro no elevador/equipamento',
              isRequired: true,
              order: 2,
            },
            {
              title: 'Verificar área de trabalho',
              description: 'Confirmar que a área está limpa e organizada',
              isRequired: false,
              order: 3,
            },
            {
              title: 'Verificar documentação',
              description: 'Confirmar que a OS e documentos estão em ordem',
              isRequired: true,
              order: 4,
            },
          ],
        });
        this.logger.log(
          `✅ Checklist pré-serviço criado automaticamente para ${number}`,
        );

        // Checklist pós-serviço (obrigatório)
        await this.checklistsService.create(tenantId, {
          entityType: ChecklistEntityType.SERVICE_ORDER,
          entityId: serviceOrder.id,
          checklistType: ChecklistType.POST_SERVICE,
          name: `Checklist Pós-Serviço - ${number}`,
          description: 'Checklist para verificação após conclusão do serviço',
          items: [
            {
              title: 'Verificar limpeza do veículo',
              description: 'Confirmar que o veículo foi limpo adequadamente',
              isRequired: true,
              order: 0,
            },
            {
              title: 'Verificar funcionamento',
              description: 'Testar se o problema foi resolvido',
              isRequired: true,
              order: 1,
            },
            {
              title: 'Verificar níveis de fluidos',
              description: 'Confirmar que os níveis estão corretos',
              isRequired: true,
              order: 2,
            },
            {
              title: 'Verificar peças substituídas',
              description:
                'Confirmar que todas as peças antigas foram removidas',
              isRequired: true,
              order: 3,
            },
            {
              title: 'Verificar documentação final',
              description: 'Confirmar que toda documentação foi preenchida',
              isRequired: true,
              order: 4,
            },
          ],
        });
        this.logger.log(
          `✅ Checklist pós-serviço criado automaticamente para ${number}`,
        );
      } catch (error) {
        this.logger.warn(
          `⚠️ Não foi possível criar checklists de serviço para ${number}: ${getErrorMessage(error)}`,
        );
        // Não falha a criação da OS se os checklists não puderem ser criados
      }

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
        vehiclePlaca: {
          contains: vehiclePlaca.toUpperCase(),
          mode: 'insensitive',
        },
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
    try {
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
          services: true,
          partsConsumed: { include: { part: true } },
          elevatorUsages: {
            where: {
              endTime: null, // Apenas uso ativo
            },
            include: {
              elevator: {
                select: {
                  id: true,
                  name: true,
                  number: true,
                  status: true,
                },
              },
            },
            take: 1,
          },
          quotes: {
            select: {
              id: true,
              number: true,
              totalCost: true,
            },
            take: 1, // Pegar o primeiro quote relacionado
          },
        },
      });

      if (!serviceOrder) {
        throw new NotFoundException('Ordem de serviço não encontrada');
      }

      const responseDto = this.toResponseDto(serviceOrder);

      // Enriquecer com attachments e checklists
      const relations = await this.enrichServiceOrderWithRelations(
        tenantId,
        serviceOrder.id,
      );
      responseDto.attachments = relations.attachments;
      responseDto.checklists = relations.checklists;

      return responseDto;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao buscar ordem de serviço: ${getErrorMessage(error)}`,
      );
      throw new BadRequestException('Erro ao buscar ordem de serviço');
    }
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
          updateData.customer = {
            connect: { id: updateServiceOrderDto.customerId },
          };
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
        updateData.vehicleMake =
          updateServiceOrderDto.vehicleMake?.trim() || null;
      }

      if (updateServiceOrderDto.vehicleModel !== undefined) {
        updateData.vehicleModel =
          updateServiceOrderDto.vehicleModel?.trim() || null;
      }

      if (updateServiceOrderDto.vehicleYear !== undefined) {
        updateData.vehicleYear = updateServiceOrderDto.vehicleYear || null;
      }

      if (updateServiceOrderDto.vehicleMileage !== undefined) {
        updateData.vehicleMileage =
          updateServiceOrderDto.vehicleMileage || null;
      }

      if (updateServiceOrderDto.technicianId !== undefined) {
        if (updateServiceOrderDto.technicianId) {
          updateData.technician = {
            connect: { id: updateServiceOrderDto.technicianId },
          };
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
        updateData.estimatedHours =
          updateServiceOrderDto.estimatedHours || null;
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
        updateData.reportedProblemCategory =
          updateServiceOrderDto.reportedProblemCategory || null;
      }
      if (updateServiceOrderDto.reportedProblemDescription !== undefined) {
        updateData.reportedProblemDescription =
          updateServiceOrderDto.reportedProblemDescription?.trim() || null;
      }
      if (updateServiceOrderDto.reportedProblemSymptoms !== undefined) {
        updateData.reportedProblemSymptoms =
          updateServiceOrderDto.reportedProblemSymptoms || [];
      }

      // Problema identificado pelo mecânico
      if (updateServiceOrderDto.identifiedProblemCategory !== undefined) {
        updateData.identifiedProblemCategory =
          updateServiceOrderDto.identifiedProblemCategory || null;
      }
      if (updateServiceOrderDto.identifiedProblemDescription !== undefined) {
        updateData.identifiedProblemDescription =
          updateServiceOrderDto.identifiedProblemDescription?.trim() || null;
      }
      if (updateServiceOrderDto.identifiedProblemId !== undefined) {
        updateData.identifiedProblem = updateServiceOrderDto.identifiedProblemId
          ? { connect: { id: updateServiceOrderDto.identifiedProblemId } }
          : { disconnect: true };
      }

      // Observações e diagnóstico
      if (updateServiceOrderDto.notes !== undefined) {
        updateData.inspectionNotes =
          updateServiceOrderDto.notes?.trim() || null;
      }
      if (updateServiceOrderDto.diagnosticNotes !== undefined) {
        updateData.diagnosticNotes =
          updateServiceOrderDto.diagnosticNotes?.trim() || null;
      }

      // Recomendações
      if (updateServiceOrderDto.recommendations !== undefined) {
        updateData.recommendations =
          updateServiceOrderDto.recommendations?.trim() || null;
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
          services: true,
          partsConsumed: { include: { part: true } },
          elevatorUsages: {
            where: {
              endTime: null,
            },
            include: {
              elevator: {
                select: {
                  id: true,
                  name: true,
                  number: true,
                  status: true,
                },
              },
            },
            take: 1,
          },
          quotes: {
            select: {
              id: true,
              number: true,
              totalCost: true,
            },
            take: 1,
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

    if (serviceOrder.status === (ServiceOrderStatus.COMPLETED as string)) {
      throw new BadRequestException(
        'Não é possível iniciar uma OS já finalizada',
      );
    }

    if (serviceOrder.status === (ServiceOrderStatus.CANCELLED as string)) {
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

        await this.elevatorsService.startUsage(
          tenantId,
          reservation.elevatorId,
          {
            serviceOrderId: id,
            vehicleId,
            notes: `OS ${serviceOrder.number} iniciada`,
          },
        );
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
        services: true,
        partsConsumed: true,
        elevatorUsages: {
          where: {
            endTime: null,
          },
          include: {
            elevator: {
              select: {
                id: true,
                name: true,
                number: true,
                status: true,
              },
            },
          },
          take: 1,
        },
        quotes: {
          select: {
            id: true,
            number: true,
            totalCost: true,
          },
          take: 1,
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
    finalNotes?: string,
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

    if (serviceOrder.status === (ServiceOrderStatus.COMPLETED as string)) {
      throw new BadRequestException('OS já está finalizada');
    }

    if (serviceOrder.status === (ServiceOrderStatus.CANCELLED as string)) {
      throw new BadRequestException(
        'Não é possível finalizar uma OS cancelada',
      );
    }

    // Validar checklists obrigatórios antes de finalizar
    try {
      const checklists = await this.checklistsService.findAll(tenantId, {
        entityType: ChecklistEntityType.SERVICE_ORDER,
        entityId: id,
        page: 1,
        limit: 100,
      });

      // Verificar checklists pré-serviço e pós-serviço
      const preServiceChecklist = checklists.data.find(
        (c) => c.checklistType === ChecklistType.PRE_SERVICE,
      );
      const postServiceChecklist = checklists.data.find(
        (c) => c.checklistType === ChecklistType.POST_SERVICE,
      );

      if (preServiceChecklist) {
        const isValid = await this.checklistsService.validate(
          tenantId,
          preServiceChecklist.id,
        );
        if (!isValid) {
          throw new BadRequestException(
            'Não é possível finalizar a ordem de serviço. O checklist pré-serviço não está completo. Todos os itens obrigatórios devem ser concluídos.',
          );
        }
      }

      if (postServiceChecklist) {
        const isValid = await this.checklistsService.validate(
          tenantId,
          postServiceChecklist.id,
        );
        if (!isValid) {
          throw new BadRequestException(
            'Não é possível finalizar a ordem de serviço. O checklist pós-serviço não está completo. Todos os itens obrigatórios devem ser concluídos.',
          );
        }
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.warn(`Erro ao validar checklists: ${getErrorMessage(error)}`);
      // Não falha a finalização se houver erro na validação de checklists
      // (pode não haver checklists configurados)
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

    // Atualizar status, data de conclusão e notas finais
    const updateData: Prisma.ServiceOrderUpdateInput = {
      status: ServiceOrderStatus.COMPLETED,
      completedAt: new Date(),
    };

    // Adicionar notas finais se fornecidas (usando diagnosticNotes como campo para notas finais)
    if (finalNotes) {
      updateData.diagnosticNotes = finalNotes;
    }

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
        services: true,
        partsConsumed: { include: { part: true } },
        elevatorUsages: {
          where: {
            endTime: null,
          },
          include: {
            elevator: {
              select: {
                id: true,
                name: true,
                number: true,
                status: true,
              },
            },
          },
          take: 1,
        },
        quotes: {
          select: {
            id: true,
            number: true,
            totalCost: true,
          },
          take: 1,
        },
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
    });

    this.logger.log(`Ordem de serviço finalizada: ${updatedOrder.number}`);

    // Notificar recepcionistas sobre OS finalizada
    try {
      const receptionists = await this.prisma.user.findMany({
        where: {
          tenantId,
          role: 'receptionist',
          isActive: true,
        },
        select: { id: true },
      });

      // Notificar cada recepcionista individualmente
      for (const receptionist of receptionists) {
        await this.notificationsService.create({
          tenantId,
          userId: receptionist.id,
          type: NotificationType.SERVICE_ORDER_COMPLETED,
          title: '✅ Ordem de Serviço Finalizada',
          message: `OS ${updatedOrder.number} foi finalizada e está pronta para retirada`,
          data: {
            serviceOrderId: id,
            serviceOrderNumber: updatedOrder.number,
            customerId: updatedOrder.customerId,
            customerName: updatedOrder.customer?.name,
            vehiclePlaca: updatedOrder.vehiclePlaca,
            vehicleMake: updatedOrder.vehicleMake,
            vehicleModel: updatedOrder.vehicleModel,
            technicianId: updatedOrder.technicianId,
            technicianName: updatedOrder.technician?.name,
            completedAt: updatedOrder.completedAt,
          },
        });
      }

      // Se não houver recepcionistas, criar notificação geral (fallback)
      if (receptionists.length === 0) {
        await this.notificationsService.create({
          tenantId,
          type: NotificationType.SERVICE_ORDER_COMPLETED,
          title: '✅ Ordem de Serviço Finalizada',
          message: `OS ${updatedOrder.number} foi finalizada e está pronta para retirada`,
          data: {
            serviceOrderId: id,
            serviceOrderNumber: updatedOrder.number,
            customerId: updatedOrder.customerId,
            customerName: updatedOrder.customer?.name,
          },
        });
      }

      this.logger.log(
        `Notificações enviadas para ${receptionists.length} recepcionista(s) sobre OS ${updatedOrder.number}`,
      );
    } catch (notificationError) {
      this.logger.warn(
        `Erro ao criar notificações para recepcionistas: ${getErrorMessage(notificationError)}`,
      );
      // Não falha a finalização se houver erro nas notificações
    }

    // Buscar checklists e attachments separadamente (relação polimórfica)
    const relations = await this.enrichServiceOrderWithRelations(tenantId, id);
    const responseDto = this.toResponseDto(updatedOrder);
    responseDto.attachments = relations.attachments;
    responseDto.checklists = relations.checklists;

    return responseDto;
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

    if (serviceOrder.status === (ServiceOrderStatus.COMPLETED as string)) {
      throw new BadRequestException(
        'Não é possível cancelar uma OS já finalizada',
      );
    }

    if (serviceOrder.status === (ServiceOrderStatus.CANCELLED as string)) {
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
        services: true,
        partsConsumed: true,
        elevatorUsages: {
          where: {
            endTime: null,
          },
          include: {
            elevator: {
              select: {
                id: true,
                name: true,
                number: true,
                status: true,
              },
            },
          },
          take: 1,
        },
        quotes: {
          select: {
            id: true,
            number: true,
            totalCost: true,
          },
          take: 1,
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
  private toResponseDto(serviceOrder: {
    id: string;
    tenantId: string;
    number: string;
    customerId: string | null;
    customer?: {
      id: string;
      name: string;
      phone: string;
      email: string | null;
    } | null;
    vehicleVin: string | null;
    vehiclePlaca: string | null;
    vehicleMake: string | null;
    vehicleModel: string | null;
    vehicleYear: number | null;
    vehicleMileage: number | null;
    technicianId: string | null;
    technician?: { id: string; name: string; email: string } | null;
    elevatorUsages?: Array<{
      elevator?: {
        id: string;
        name: string;
        number: string;
        status: string;
      } | null;
    }> | null;
    quotes?: Array<{ id: string; number: string; totalCost: unknown }> | null;
    status: string;
    appointmentDate: Date | null;
    checkInDate: Date | null;
    checkInKm: number | null;
    checkInFuelLevel: string | null;
    reportedProblemCategory: string | null;
    reportedProblemDescription: string | null;
    reportedProblemSymptoms: string[];
    identifiedProblemCategory: string | null;
    identifiedProblemDescription: string | null;
    identifiedProblemId: string | null;
    inspectionNotes: string | null;
    inspectionPhotos: string[];
    diagnosticNotes: string | null;
    recommendations: string | null;
    estimatedHours: unknown;
    laborCost: unknown;
    partsCost: unknown;
    totalCost: unknown;
    discount: unknown;
    actualHours: unknown;
    startedAt: Date | null;
    completedAt: Date | null;
    invoiceId: string | null;
    services?: Array<{
      id: string;
      serviceId?: string | null;
      serviceName?: string | null;
      name?: string | null;
      serviceDescription?: string | null;
      description?: string | null;
      quantity?: number | null;
      cost: unknown;
      hours?: unknown;
    }> | null;
    partsConsumed?: Array<{
      id: string;
      partId: string | null;
      quantity: number;
      unitCost: unknown;
      part?: { name: string; description?: string | null } | null;
      partName?: string | null;
    }> | null;
    createdAt: Date;
    updatedAt: Date;
  }): ServiceOrderResponseDto {
    // Helper para converter Decimal ou number para number
    const toNumber = (value: unknown): number => {
      if (value == null) return 0;
      if (typeof value === 'number') return value;
      if (
        typeof value === 'object' &&
        'toNumber' in value &&
        typeof (value as { toNumber: () => number }).toNumber === 'function'
      ) {
        return (value as { toNumber: () => number }).toNumber();
      }
      return Number(value) || 0;
    };

    // Calcular total se não estiver definido
    const laborCost = toNumber(serviceOrder.laborCost);
    const partsCost = toNumber(serviceOrder.partsCost);
    const discount = toNumber(serviceOrder.discount);
    const calculatedTotal = laborCost + partsCost - discount;
    const totalCostValue = toNumber(serviceOrder.totalCost);
    const totalCost =
      totalCostValue > 0
        ? totalCostValue
        : calculatedTotal > 0
          ? calculatedTotal
          : undefined;

    // Converter items (services + parts) se existirem
    const services = Array.isArray(serviceOrder.services)
      ? serviceOrder.services.map(
          (item: {
            id: string;
            serviceId?: string | null;
            serviceName?: string | null;
            name?: string | null;
            serviceDescription?: string | null;
            description?: string | null;
            quantity?: number | null;
            cost: unknown;
            hours?: unknown;
          }) => ({
            id: item.id,
            serviceId: item.serviceId || undefined,
            partId: undefined,
            name: item.serviceName || item.name || 'Serviço',
            description:
              item.serviceDescription || item.description || undefined,
            quantity: item.quantity || 1,
            unitCost: toNumber(item.cost),
            totalCost: toNumber(item.cost) * (item.quantity || 1),
            hours: item.hours ? toNumber(item.hours) : undefined,
          }),
        )
      : [];

    const parts = Array.isArray(serviceOrder.partsConsumed)
      ? serviceOrder.partsConsumed.map(
          (item: {
            id: string;
            partId: string | null;
            quantity: number;
            unitCost: unknown;
            part?: { name: string; description?: string | null } | null;
            partName?: string | null;
          }) => ({
            id: item.id,
            serviceId: undefined,
            partId: item.partId || undefined,
            name: item.part?.name || item.partName || 'Peça',
            description: item.part?.description || undefined,
            quantity: item.quantity || 1,
            unitCost: toNumber(item.unitCost),
            totalCost: toNumber(item.unitCost) * (item.quantity || 1),
            hours: undefined,
          }),
        )
      : [];

    const items = [...services, ...parts];

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
      elevator: serviceOrder.elevatorUsages?.[0]?.elevator
        ? {
            id: serviceOrder.elevatorUsages[0].elevator.id,
            name: serviceOrder.elevatorUsages[0].elevator.name,
            number: serviceOrder.elevatorUsages[0].elevator.number,
            status: serviceOrder.elevatorUsages[0].elevator.status,
          }
        : undefined,
      quote: serviceOrder.quotes?.[0]
        ? {
            id: serviceOrder.quotes[0].id,
            number: serviceOrder.quotes[0].number,
            totalCost: toNumber(serviceOrder.quotes[0].totalCost),
          }
        : undefined,
      status: serviceOrder.status as ServiceOrderStatus,
      appointmentDate: serviceOrder.appointmentDate || undefined,
      checkInDate: serviceOrder.checkInDate || undefined,
      checkInKm: serviceOrder.checkInKm || undefined,
      checkInFuelLevel: serviceOrder.checkInFuelLevel || undefined,
      // Problema relatado pelo cliente
      reportedProblemCategory:
        serviceOrder.reportedProblemCategory || undefined,
      reportedProblemDescription:
        serviceOrder.reportedProblemDescription || undefined,
      reportedProblemSymptoms: serviceOrder.reportedProblemSymptoms || [],
      // Problema identificado pelo mecânico
      identifiedProblemCategory:
        serviceOrder.identifiedProblemCategory || undefined,
      identifiedProblemDescription:
        serviceOrder.identifiedProblemDescription || undefined,
      identifiedProblemId: serviceOrder.identifiedProblemId || undefined,
      // Observações e diagnóstico
      inspectionNotes: serviceOrder.inspectionNotes || undefined,
      inspectionPhotos: serviceOrder.inspectionPhotos || [],
      diagnosticNotes: serviceOrder.diagnosticNotes || undefined,
      // Recomendações
      recommendations: serviceOrder.recommendations || undefined,
      estimatedHours: serviceOrder.estimatedHours
        ? toNumber(serviceOrder.estimatedHours)
        : undefined,
      laborCost: laborCost > 0 ? laborCost : undefined,
      partsCost: partsCost > 0 ? partsCost : undefined,
      totalCost: totalCost,
      discount: discount > 0 ? discount : undefined,
      actualHours: serviceOrder.actualHours
        ? toNumber(serviceOrder.actualHours)
        : undefined,
      startedAt: serviceOrder.startedAt || undefined,
      completedAt: serviceOrder.completedAt || undefined,
      invoiceId: serviceOrder.invoiceId || undefined,
      items: items,
      // Integrações com novos módulos (serão populados assincronamente se necessário)
      attachments: undefined, // Será populado quando necessário
      checklists: undefined, // Será populado quando necessário
      createdAt: serviceOrder.createdAt,
      updatedAt: serviceOrder.updatedAt,
    };
  }

  /**
   * Busca attachments e checklists relacionados a uma Service Order
   */
  private async enrichServiceOrderWithRelations(
    tenantId: string,
    serviceOrderId: string,
  ): Promise<{
    attachments: Array<{
      id: string;
      type: string;
      url: string;
      originalName: string;
    }>;
    checklists: Array<{
      id: string;
      checklistType: string;
      name: string;
      status: string;
    }>;
  }> {
    try {
      const [attachmentsResult, checklistsResult] = await Promise.all([
        this.attachmentsService.findAll(tenantId, {
          serviceOrderId,
          page: 1,
          limit: 100,
        }),
        this.checklistsService.findAll(tenantId, {
          entityType: ChecklistEntityType.SERVICE_ORDER,
          entityId: serviceOrderId,
          page: 1,
          limit: 100,
        }),
      ]);

      return {
        attachments: attachmentsResult.data.map((att) => ({
          id: att.id,
          type: att.type,
          url: att.url,
          originalName: att.originalName,
        })),
        checklists: checklistsResult.data.map((checklist) => ({
          id: checklist.id,
          checklistType: checklist.checklistType,
          name: checklist.name,
          status: checklist.status,
        })),
      };
    } catch (error) {
      this.logger.warn(
        `Erro ao buscar attachments/checklists: ${getErrorMessage(error)}`,
      );
      return { attachments: [], checklists: [] };
    }
  }
}
