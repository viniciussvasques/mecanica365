import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentResponseDto,
  AppointmentFiltersDto,
  AppointmentStatus,
  CheckAvailabilityDto,
  GetAvailableSlotsDto,
} from './dto';
import { Prisma } from '@prisma/client';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';
import { ElevatorsService } from '../elevators/elevators.service';
import { ServiceOrderStatus } from '../service-orders/dto/service-order-status.enum';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly elevatorsService: ElevatorsService,
  ) {}

  /**
   * Cria um novo agendamento
   */
  async create(
    tenantId: string,
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    try {
      const appointmentDate = new Date(createAppointmentDto.date);
      this.validateAppointmentDate(appointmentDate);

      if (createAppointmentDto.assignedToId) {
        await this.validateMechanicAvailability(
          tenantId,
          createAppointmentDto.assignedToId,
          appointmentDate,
          createAppointmentDto.duration || 60,
        );
      }

      await this.validateCustomerIfProvided(
        tenantId,
        createAppointmentDto.customerId,
      );
      await this.validateMechanicIfProvided(
        tenantId,
        createAppointmentDto.assignedToId,
      );

      // Criar agendamento
      const appointment = await this.prisma.appointment.create({
        data: {
          tenant: { connect: { id: tenantId } },
          customer: createAppointmentDto.customerId
            ? { connect: { id: createAppointmentDto.customerId } }
            : undefined,
          serviceOrder: createAppointmentDto.serviceOrderId
            ? { connect: { id: createAppointmentDto.serviceOrderId } }
            : undefined,
          assignedTo: createAppointmentDto.assignedToId
            ? { connect: { id: createAppointmentDto.assignedToId } }
            : undefined,
          date: appointmentDate,
          duration: createAppointmentDto.duration || 60,
          serviceType: createAppointmentDto.serviceType,
          notes: createAppointmentDto.notes,
          status: createAppointmentDto.status || AppointmentStatus.SCHEDULED,
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
          serviceOrder: {
            select: {
              id: true,
              number: true,
              status: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(`Agendamento criado: ${appointment.id}`);

      return this.toResponseDto(appointment);
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `Erro ao criar agendamento: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao criar agendamento');
    }
  }

  /**
   * Lista agendamentos com filtros
   */
  async findMany(
    tenantId: string,
    filters: AppointmentFiltersDto,
  ): Promise<{
    data: AppointmentResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const where: Prisma.AppointmentWhereInput = {
        tenantId,
      };

      if (filters.customerId) {
        where.customerId = filters.customerId;
      }

      if (filters.serviceOrderId) {
        where.serviceOrderId = filters.serviceOrderId;
      }

      if (filters.assignedToId) {
        where.assignedToId = filters.assignedToId;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.startDate || filters.endDate) {
        where.date = {};
        if (filters.startDate) {
          where.date.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.date.lte = new Date(filters.endDate);
        }
      }

      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      const [appointments, total] = await Promise.all([
        this.prisma.appointment.findMany({
          where,
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
              },
            },
            serviceOrder: {
              select: {
                id: true,
                number: true,
                status: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { date: 'asc' },
          skip,
          take: limit,
        }),
        this.prisma.appointment.count({ where }),
      ]);

      return {
        data: appointments.map((appointment) =>
          this.toResponseDto(appointment),
        ),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao listar agendamentos: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao listar agendamentos');
    }
  }

  /**
   * Busca um agendamento por ID
   */
  async findOne(tenantId: string, id: string): Promise<AppointmentResponseDto> {
    try {
      const appointment = await this.prisma.appointment.findFirst({
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
          serviceOrder: {
            select: {
              id: true,
              number: true,
              status: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!appointment) {
        throw new NotFoundException('Agendamento não encontrado');
      }

      return this.toResponseDto(appointment);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao buscar agendamento: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao buscar agendamento');
    }
  }

  /**
   * Atualiza um agendamento
   */
  async update(
    tenantId: string,
    id: string,
    updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    try {
      const appointment = await this.findAppointmentByIdAndTenant(id, tenantId);

      if (updateAppointmentDto.date) {
        const appointmentDate = new Date(updateAppointmentDto.date);
        this.validateAppointmentDate(appointmentDate);

        const assignedToId =
          updateAppointmentDto.assignedToId || appointment.assignedToId;
        if (assignedToId) {
          await this.validateMechanicAvailabilityForUpdate(
            tenantId,
            assignedToId,
            appointmentDate,
            updateAppointmentDto.duration || appointment.duration,
            id,
          );
        }
      }

      await this.validateCustomerIfProvided(
        tenantId,
        updateAppointmentDto.customerId,
      );
      await this.validateMechanicIfProvided(
        tenantId,
        updateAppointmentDto.assignedToId,
      );

      const updateData =
        this.prepareAppointmentUpdateData(updateAppointmentDto);
      const updatedAppointment = await this.prisma.appointment.update({
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
          serviceOrder: {
            select: {
              id: true,
              number: true,
              status: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(`Agendamento atualizado: ${id}`);
      return this.toResponseDto(updatedAppointment);
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `Erro ao atualizar agendamento: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao atualizar agendamento');
    }
  }

  /**
   * Remove um agendamento
   */
  async remove(tenantId: string, id: string): Promise<void> {
    try {
      const appointment = await this.prisma.appointment.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!appointment) {
        throw new NotFoundException('Agendamento não encontrado');
      }

      // Não permitir remover agendamentos em progresso ou completos
      const appointmentStatus = appointment.status as AppointmentStatus;
      if (
        appointmentStatus === AppointmentStatus.IN_PROGRESS ||
        appointmentStatus === AppointmentStatus.COMPLETED
      ) {
        throw new BadRequestException(
          'Não é possível remover agendamentos em progresso ou completos',
        );
      }

      await this.prisma.appointment.delete({
        where: { id },
      });

      this.logger.log(`Agendamento removido: ${id}`);
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Erro ao remover agendamento: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao remover agendamento');
    }
  }

  /**
   * Cancela um agendamento
   */
  async cancel(tenantId: string, id: string): Promise<AppointmentResponseDto> {
    try {
      const appointment = await this.prisma.appointment.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!appointment) {
        throw new NotFoundException('Agendamento não encontrado');
      }

      // Não permitir cancelar agendamentos já completos
      const appointmentStatus = appointment.status as AppointmentStatus;
      if (appointmentStatus === AppointmentStatus.COMPLETED) {
        throw new BadRequestException(
          'Não é possível cancelar agendamentos já completos',
        );
      }

      const updatedAppointment = await this.prisma.appointment.update({
        where: { id },
        data: {
          status: AppointmentStatus.CANCELLED,
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
          serviceOrder: {
            select: {
              id: true,
              number: true,
              status: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(`Agendamento cancelado: ${id}`);

      return this.toResponseDto(updatedAppointment);
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Erro ao cancelar agendamento: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao cancelar agendamento');
    }
  }

  /**
   * Mecânico pega um agendamento disponível (sem assignedToId)
   */
  async claim(
    tenantId: string,
    id: string,
    mechanicId: string,
  ): Promise<AppointmentResponseDto> {
    try {
      const appointment = await this.prisma.appointment.findFirst({
        where: {
          id,
          tenantId,
        },
        include: {
          customer: {
            select: { id: true, name: true, phone: true, email: true },
          },
          serviceOrder: {
            select: { id: true, number: true, status: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!appointment) {
        throw new NotFoundException('Agendamento não encontrado');
      }

      // Validar que o status permite atribuição
      const appointmentStatus = appointment.status as AppointmentStatus;
      if (appointmentStatus !== AppointmentStatus.SCHEDULED) {
        throw new BadRequestException(
          'Apenas agendamentos com status "scheduled" podem ser pegos',
        );
      }

      // Validar que não tem mecânico atribuído
      if (appointment.assignedToId) {
        throw new BadRequestException(
          'Este agendamento já foi atribuído a outro mecânico',
        );
      }

      // Verificar se o mecânico existe e é do tenant
      const mechanic = await this.prisma.user.findFirst({
        where: {
          id: mechanicId,
          tenantId,
          role: 'mechanic',
          isActive: true,
        },
      });

      if (!mechanic) {
        throw new NotFoundException('Mecânico não encontrado ou inativo');
      }

      // Verificar conflito de horário para o mecânico
      const conflict = await this.prisma.appointment.findFirst({
        where: {
          tenantId,
          assignedToId: mechanicId,
          id: { not: id }, // Excluir o agendamento atual
          status: {
            in: [AppointmentStatus.SCHEDULED, AppointmentStatus.IN_PROGRESS],
          },
          date: {
            lt: new Date(
              appointment.date.getTime() + appointment.duration * 60 * 1000,
            ), // Fim do agendamento
            gt: new Date(
              appointment.date.getTime() - appointment.duration * 60 * 1000,
            ), // Início do agendamento
          },
        },
      });

      if (conflict) {
        throw new ConflictException(
          'Você já possui um agendamento neste horário',
        );
      }

      // Atribuir o agendamento ao mecânico
      const updatedAppointment = await this.prisma.appointment.update({
        where: { id },
        data: {
          assignedTo: { connect: { id: mechanicId } },
        },
        include: {
          customer: {
            select: { id: true, name: true, phone: true, email: true },
          },
          serviceOrder: {
            select: { id: true, number: true, status: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      this.logger.log(`Agendamento ${id} atribuído ao mecânico ${mechanicId}`);
      return this.toResponseDto(updatedAppointment);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao atribuir agendamento ${id} ao mecânico ${mechanicId}: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Erro ao atribuir agendamento: ${getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Verifica disponibilidade para agendamento
   */
  async checkAvailability(
    tenantId: string,
    checkAvailabilityDto: CheckAvailabilityDto,
  ): Promise<{
    available: boolean;
    conflicts: Array<{
      type: 'mechanic' | 'elevator';
      id: string;
      name: string;
      startTime: Date;
      endTime: Date;
    }>;
  }> {
    try {
      const appointmentDate = new Date(checkAvailabilityDto.date);
      const duration = checkAvailabilityDto.duration || 60;
      const endDate = new Date(
        appointmentDate.getTime() + duration * 60 * 1000,
      );

      const conflicts: Array<{
        type: 'mechanic' | 'elevator';
        id: string;
        name: string;
        startTime: Date;
        endTime: Date;
      }> = [];

      // Verificar conflitos com elevador (se fornecido)
      if (checkAvailabilityDto.elevatorId) {
        const isElevatorAvailable = await this.checkElevatorAvailability(
          tenantId,
          checkAvailabilityDto.elevatorId,
          appointmentDate,
          duration,
        );

        if (!isElevatorAvailable) {
          const elevator = await this.prisma.elevator.findFirst({
            where: {
              id: checkAvailabilityDto.elevatorId,
              tenantId,
            },
          });

          if (elevator) {
            // Buscar uso ativo ou agendado do elevador
            const elevatorUsage = await this.prisma.elevatorUsage.findFirst({
              where: {
                elevatorId: checkAvailabilityDto.elevatorId,
                OR: [
                  {
                    startTime: {
                      lte: endDate,
                    },
                    endTime: {
                      gte: appointmentDate,
                    },
                  },
                  {
                    startTime: {
                      lte: endDate,
                    },
                    endTime: null,
                  },
                ],
              },
              orderBy: { startTime: 'desc' },
            });

            if (elevatorUsage) {
              conflicts.push({
                type: 'elevator',
                id: elevator.id,
                name: elevator.name,
                startTime: elevatorUsage.startTime,
                endTime: elevatorUsage.endTime || new Date(),
              });
            }
          }
        }
      }

      return {
        available: conflicts.length === 0,
        conflicts,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao verificar disponibilidade: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao verificar disponibilidade');
    }
  }

  /**
   * Verifica conflito de horário para um mecânico
   */
  private async checkMechanicConflict(
    tenantId: string,
    mechanicId: string,
    date: Date,
    duration: number,
    excludeAppointmentId?: string,
  ): Promise<boolean> {
    const endDate = new Date(date.getTime() + duration * 60 * 1000);

    // Buscar agendamentos ativos do mecânico
    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        assignedToId: mechanicId,
        status: {
          notIn: [
            AppointmentStatus.CANCELLED,
            AppointmentStatus.COMPLETED,
            AppointmentStatus.NO_SHOW,
          ],
        },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      },
      select: {
        id: true,
        date: true,
        duration: true,
      },
    });

    // Verificar se há sobreposição de horários
    for (const appointment of appointments) {
      const appointmentEnd = new Date(
        appointment.date.getTime() + appointment.duration * 60 * 1000,
      );

      // Verifica se há sobreposição
      if (date < appointmentEnd && endDate > appointment.date) {
        return true;
      }
    }

    return false;
  }

  /**
   * Verifica disponibilidade de elevador
   */
  private async checkElevatorAvailability(
    tenantId: string,
    elevatorId: string,
    date: Date,
    duration: number,
  ): Promise<boolean> {
    try {
      const elevator = await this.prisma.elevator.findFirst({
        where: {
          id: elevatorId,
          tenantId,
        },
      });

      if (!elevator) {
        return false;
      }

      // Elevador em manutenção não está disponível
      if (elevator.status === 'maintenance') {
        return false;
      }

      const endDate = new Date(date.getTime() + duration * 60 * 1000);

      // Verificar se há uso ativo ou agendado no período
      const usage = await this.prisma.elevatorUsage.findFirst({
        where: {
          elevatorId,
          OR: [
            {
              startTime: {
                lte: endDate,
              },
              endTime: {
                gte: date,
              },
            },
            {
              startTime: {
                lte: endDate,
              },
              endTime: null,
            },
          ],
        },
      });

      return usage === null;
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao verificar disponibilidade de elevador: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      return false;
    }
  }

  /**
   * Lista horários disponíveis de um dia
   */
  async getAvailableSlots(
    tenantId: string,
    getAvailableSlotsDto: GetAvailableSlotsDto,
  ): Promise<{
    date: string;
    availableSlots: Array<{
      startTime: string;
      endTime: string;
      available: boolean;
      reason?: string;
    }>;
    hasAvailability: boolean;
  }> {
    try {
      const targetDate = new Date(getAvailableSlotsDto.date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const duration = getAvailableSlotsDto.duration || 60;

      // Horário de funcionamento padrão (8h às 18h)
      const workStartHour = 8;
      const workEndHour = 18;
      const slotInterval = 30; // Intervalo de 30 minutos entre slots

      // Buscar agendamentos do dia
      const appointments = await this.prisma.appointment.findMany({
        where: {
          tenantId,
          date: {
            gte: targetDate,
            lt: nextDay,
          },
          status: {
            notIn: [
              AppointmentStatus.CANCELLED,
              AppointmentStatus.COMPLETED,
              AppointmentStatus.NO_SHOW,
            ],
          },
        },
        select: {
          id: true,
          date: true,
          duration: true,
          assignedToId: true,
        },
        orderBy: {
          date: 'asc',
        },
      });

      // Buscar OS em andamento que podem ocupar tempo
      const serviceOrdersInProgress = await this.prisma.serviceOrder.findMany({
        where: {
          tenantId,
          status: ServiceOrderStatus.IN_PROGRESS,
          appointmentDate: {
            gte: targetDate,
            lt: nextDay,
          },
        },
        select: {
          id: true,
          appointmentDate: true,
          estimatedHours: true,
          technicianId: true,
        },
      });

      const slots = await this.generateAvailableSlots({
        targetDate,
        workStartHour,
        workEndHour,
        slotInterval,
        duration,
        appointments,
        serviceOrdersInProgress,
        tenantId,
        elevatorId: getAvailableSlotsDto.elevatorId,
      });

      const hasAvailability = slots.some((slot) => slot.available);

      return {
        date: targetDate.toISOString().split('T')[0],
        availableSlots: slots,
        hasAvailability,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao buscar horários disponíveis: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao buscar horários disponíveis');
    }
  }

  private validateAppointmentDate(appointmentDate: Date): void {
    const now = new Date();
    if (appointmentDate < now) {
      throw new BadRequestException(
        'Não é possível agendar para uma data no passado',
      );
    }
  }

  private async validateMechanicAvailability(
    tenantId: string,
    mechanicId: string,
    appointmentDate: Date,
    duration: number,
  ): Promise<void> {
    const hasConflict = await this.checkMechanicConflict(
      tenantId,
      mechanicId,
      appointmentDate,
      duration,
    );

    if (hasConflict) {
      throw new ConflictException(
        'Mecânico já possui agendamento neste horário',
      );
    }
  }

  private async validateMechanicAvailabilityForUpdate(
    tenantId: string,
    mechanicId: string,
    appointmentDate: Date,
    duration: number,
    excludeAppointmentId: string,
  ): Promise<void> {
    const hasConflict = await this.checkMechanicConflict(
      tenantId,
      mechanicId,
      appointmentDate,
      duration,
      excludeAppointmentId,
    );

    if (hasConflict) {
      throw new ConflictException(
        'Mecânico já possui agendamento neste horário',
      );
    }
  }

  private async validateCustomerIfProvided(
    tenantId: string,
    customerId: string | undefined,
  ): Promise<void> {
    if (!customerId) {
      return;
    }

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

  private async validateMechanicIfProvided(
    tenantId: string,
    mechanicId: string | undefined,
  ): Promise<void> {
    if (!mechanicId) {
      return;
    }

    const mechanic = await this.prisma.user.findFirst({
      where: {
        id: mechanicId,
        tenantId,
        role: 'mechanic',
      },
    });

    if (!mechanic) {
      throw new NotFoundException('Mecânico não encontrado');
    }
  }

  private async findAppointmentByIdAndTenant(
    id: string,
    tenantId: string,
  ): Promise<
    Prisma.AppointmentGetPayload<{
      include: {
        customer: {
          select: {
            id: true;
            name: true;
            phone: true;
            email: true;
          };
        };
        serviceOrder: {
          select: {
            id: true;
            number: true;
            status: true;
          };
        };
        assignedTo: {
          select: {
            id: true;
            name: true;
            email: true;
          };
        };
      };
    }>
  > {
    const appointment = await this.prisma.appointment.findFirst({
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
        serviceOrder: {
          select: {
            id: true,
            number: true,
            status: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    return appointment;
  }

  private async generateAvailableSlots(params: {
    targetDate: Date;
    workStartHour: number;
    workEndHour: number;
    slotInterval: number;
    duration: number;
    appointments: Array<{
      id: string;
      date: Date;
      duration: number;
      assignedToId: string | null;
    }>;
    serviceOrdersInProgress: Array<{
      id: string;
      appointmentDate: Date | null;
      estimatedHours: unknown;
      technicianId: string | null;
    }>;
    tenantId: string;
    elevatorId: string | undefined;
  }): Promise<
    Array<{
      startTime: string;
      endTime: string;
      available: boolean;
      reason?: string;
    }>
  > {
    const slots: Array<{
      startTime: string;
      endTime: string;
      available: boolean;
      reason?: string;
    }> = [];

    for (let hour = params.workStartHour; hour < params.workEndHour; hour++) {
      for (let minute = 0; minute < 60; minute += params.slotInterval) {
        const slotStart = new Date(params.targetDate);
        slotStart.setHours(hour, minute, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setTime(slotStart.getTime() + params.duration * 60 * 1000);

        if (!this.isSlotWithinWorkingHours(slotEnd, params.workEndHour)) {
          continue;
        }

        const conflict = await this.checkSlotConflicts(
          slotStart,
          slotEnd,
          params.appointments,
          params.serviceOrdersInProgress,
          params.tenantId,
          params.elevatorId,
          params.duration,
        );

        slots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          available: !conflict.hasConflict,
          reason: conflict.reason,
        });
      }
    }

    return slots;
  }

  private isSlotWithinWorkingHours(
    slotEnd: Date,
    workEndHour: number,
  ): boolean {
    return !(
      slotEnd.getHours() > workEndHour ||
      (slotEnd.getHours() === workEndHour && slotEnd.getMinutes() > 0)
    );
  }

  private async checkSlotConflicts(
    slotStart: Date,
    slotEnd: Date,
    appointments: Array<{
      id: string;
      date: Date;
      duration: number;
      assignedToId: string | null;
    }>,
    serviceOrdersInProgress: Array<{
      id: string;
      appointmentDate: Date | null;
      estimatedHours: unknown;
      technicianId: string | null;
    }>,
    tenantId: string,
    elevatorId: string | undefined,
    duration: number,
  ): Promise<{ hasConflict: boolean; reason?: string }> {
    const appointmentConflict = this.checkAppointmentConflict(
      slotStart,
      slotEnd,
      appointments,
    );
    if (appointmentConflict.hasConflict) {
      return appointmentConflict;
    }

    const serviceOrderConflict = this.checkServiceOrderConflict(
      slotStart,
      slotEnd,
      serviceOrdersInProgress,
    );
    if (serviceOrderConflict.hasConflict) {
      return serviceOrderConflict;
    }

    if (elevatorId) {
      const elevatorConflict = await this.checkElevatorConflict(
        tenantId,
        elevatorId,
        slotStart,
        duration,
      );
      if (elevatorConflict.hasConflict) {
        return elevatorConflict;
      }
    }

    return { hasConflict: false };
  }

  private checkAppointmentConflict(
    slotStart: Date,
    slotEnd: Date,
    appointments: Array<{
      id: string;
      date: Date;
      duration: number;
      assignedToId: string | null;
    }>,
  ): { hasConflict: boolean; reason?: string } {
    for (const appointment of appointments) {
      const appointmentEnd = new Date(
        appointment.date.getTime() + appointment.duration * 60 * 1000,
      );

      if (slotStart < appointmentEnd && slotEnd > appointment.date) {
        return { hasConflict: true, reason: 'Agendamento existente' };
      }
    }

    return { hasConflict: false };
  }

  private checkServiceOrderConflict(
    slotStart: Date,
    slotEnd: Date,
    serviceOrdersInProgress: Array<{
      id: string;
      appointmentDate: Date | null;
      estimatedHours: unknown;
      technicianId: string | null;
    }>,
  ): { hasConflict: boolean; reason?: string } {
    for (const serviceOrder of serviceOrdersInProgress) {
      if (!serviceOrder.appointmentDate || !serviceOrder.estimatedHours) {
        continue;
      }

      const soStart = new Date(serviceOrder.appointmentDate);
      const estimatedHours = serviceOrder.estimatedHours as {
        toNumber: () => number;
      };
      const soEnd = new Date(
        soStart.getTime() + estimatedHours.toNumber() * 60 * 60 * 1000,
      );

      if (slotStart < soEnd && slotEnd > soStart) {
        return { hasConflict: true, reason: 'OS em andamento' };
      }
    }

    return { hasConflict: false };
  }

  private async checkElevatorConflict(
    tenantId: string,
    elevatorId: string,
    slotStart: Date,
    duration: number,
  ): Promise<{ hasConflict: boolean; reason?: string }> {
    const isElevatorAvailable = await this.checkElevatorAvailability(
      tenantId,
      elevatorId,
      slotStart,
      duration,
    );

    if (!isElevatorAvailable) {
      return { hasConflict: true, reason: 'Elevador ocupado' };
    }

    return { hasConflict: false };
  }

  private prepareAppointmentUpdateData(
    updateAppointmentDto: UpdateAppointmentDto,
  ): Prisma.AppointmentUpdateInput {
    return {
      customer: this.prepareRelationUpdate(updateAppointmentDto.customerId),
      serviceOrder: this.prepareRelationUpdate(
        updateAppointmentDto.serviceOrderId,
      ),
      assignedTo: this.prepareRelationUpdate(updateAppointmentDto.assignedToId),
      date: updateAppointmentDto.date
        ? new Date(updateAppointmentDto.date)
        : undefined,
      duration: updateAppointmentDto.duration,
      serviceType: updateAppointmentDto.serviceType,
      notes: updateAppointmentDto.notes,
      status: updateAppointmentDto.status,
    };
  }

  private prepareRelationUpdate(
    id: string | null | undefined,
  ): { connect: { id: string } } | { disconnect: true } | undefined {
    if (id === undefined) {
      return undefined;
    }
    if (id === null) {
      return { disconnect: true };
    }
    return { connect: { id } };
  }

  /**
   * Converte Prisma Appointment para AppointmentResponseDto
   */
  private toResponseDto(appointment: {
    id: string;
    tenantId: string;
    customerId: string | null;
    serviceOrderId: string | null;
    assignedToId: string | null;
    date: Date;
    duration: number;
    serviceType: string | null;
    notes: string | null;
    status: string;
    reminderSent: boolean;
    createdAt: Date;
    updatedAt: Date;
    customer?: {
      id: string;
      name: string;
      phone: string;
      email: string | null;
    } | null;
    serviceOrder?: {
      id: string;
      number: string;
      status: string;
    } | null;
    assignedTo?: {
      id: string;
      name: string;
      email: string;
    } | null;
  }): AppointmentResponseDto {
    return {
      id: appointment.id,
      tenantId: appointment.tenantId,
      customerId: appointment.customerId || undefined,
      serviceOrderId: appointment.serviceOrderId || undefined,
      assignedToId: appointment.assignedToId || undefined,
      date: appointment.date,
      duration: appointment.duration,
      serviceType: appointment.serviceType || undefined,
      notes: appointment.notes || undefined,
      status: appointment.status as AppointmentStatus,
      reminderSent: appointment.reminderSent,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      customer: appointment.customer
        ? {
            id: appointment.customer.id,
            name: appointment.customer.name,
            phone: appointment.customer.phone,
            email: appointment.customer.email || undefined,
          }
        : undefined,
      serviceOrder: appointment.serviceOrder
        ? {
            id: appointment.serviceOrder.id,
            number: appointment.serviceOrder.number,
            status: appointment.serviceOrder.status,
          }
        : undefined,
      assignedTo: appointment.assignedTo
        ? {
            id: appointment.assignedTo.id,
            name: appointment.assignedTo.name,
            email: appointment.assignedTo.email,
          }
        : undefined,
    };
  }
}
