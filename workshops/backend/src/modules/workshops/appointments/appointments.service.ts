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
      // Validar data não pode ser no passado
      const appointmentDate = new Date(createAppointmentDto.date);
      const now = new Date();
      if (appointmentDate < now) {
        throw new BadRequestException(
          'Não é possível agendar para uma data no passado',
        );
      }

      // Verificar conflitos de horário se houver mecânico atribuído
      if (createAppointmentDto.assignedToId) {
        const hasConflict = await this.checkMechanicConflict(
          tenantId,
          createAppointmentDto.assignedToId,
          appointmentDate,
          createAppointmentDto.duration || 60,
        );

        if (hasConflict) {
          throw new ConflictException(
            'Mecânico já possui agendamento neste horário',
          );
        }
      }

      // Verificar disponibilidade de elevador se fornecido
      // Nota: ServiceOrder não tem relação direta com elevator no schema atual
      // A verificação de elevador será feita via ElevatorUsage quando necessário

      // Verificar se cliente existe (se fornecido)
      if (createAppointmentDto.customerId) {
        const customer = await this.prisma.customer.findFirst({
          where: {
            id: createAppointmentDto.customerId,
            tenantId,
          },
        });

        if (!customer) {
          throw new NotFoundException('Cliente não encontrado');
        }
      }

      // Verificar se mecânico existe (se fornecido)
      if (createAppointmentDto.assignedToId) {
        const mechanic = await this.prisma.user.findFirst({
          where: {
            id: createAppointmentDto.assignedToId,
            tenantId,
            role: 'mechanic',
          },
        });

        if (!mechanic) {
          throw new NotFoundException('Mecânico não encontrado');
        }
      }

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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
      const appointment = await this.prisma.appointment.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!appointment) {
        throw new NotFoundException('Agendamento não encontrado');
      }

      // Validar data não pode ser no passado (se fornecida)
      if (updateAppointmentDto.date) {
        const appointmentDate = new Date(updateAppointmentDto.date);
        const now = new Date();
        if (appointmentDate < now) {
          throw new BadRequestException(
            'Não é possível agendar para uma data no passado',
          );
        }

        // Verificar conflitos de horário se houver mecânico atribuído
        const assignedToId =
          updateAppointmentDto.assignedToId || appointment.assignedToId;
        if (assignedToId) {
          const hasConflict = await this.checkMechanicConflict(
            tenantId,
            assignedToId,
            appointmentDate,
            updateAppointmentDto.duration || appointment.duration,
            id, // Excluir o próprio agendamento da verificação
          );

          if (hasConflict) {
            throw new ConflictException(
              'Mecânico já possui agendamento neste horário',
            );
          }
        }
      }

      // Verificar se cliente existe (se fornecido)
      if (updateAppointmentDto.customerId) {
        const customer = await this.prisma.customer.findFirst({
          where: {
            id: updateAppointmentDto.customerId,
            tenantId,
          },
        });

        if (!customer) {
          throw new NotFoundException('Cliente não encontrado');
        }
      }

      // Verificar se mecânico existe (se fornecido)
      if (updateAppointmentDto.assignedToId) {
        const mechanic = await this.prisma.user.findFirst({
          where: {
            id: updateAppointmentDto.assignedToId,
            tenantId,
            role: 'mechanic',
          },
        });

        if (!mechanic) {
          throw new NotFoundException('Mecânico não encontrado');
        }
      }

      // Atualizar agendamento
      const updatedAppointment = await this.prisma.appointment.update({
        where: { id },
        data: {
          customer: updateAppointmentDto.customerId
            ? { connect: { id: updateAppointmentDto.customerId } }
            : updateAppointmentDto.customerId === null
              ? { disconnect: true }
              : undefined,
          serviceOrder: updateAppointmentDto.serviceOrderId
            ? { connect: { id: updateAppointmentDto.serviceOrderId } }
            : updateAppointmentDto.serviceOrderId === null
              ? { disconnect: true }
              : undefined,
          assignedTo: updateAppointmentDto.assignedToId
            ? { connect: { id: updateAppointmentDto.assignedToId } }
            : updateAppointmentDto.assignedToId === null
              ? { disconnect: true }
              : undefined,
          date: updateAppointmentDto.date
            ? new Date(updateAppointmentDto.date)
            : undefined,
          duration: updateAppointmentDto.duration,
          serviceType: updateAppointmentDto.serviceType,
          notes: updateAppointmentDto.notes,
          status: updateAppointmentDto.status,
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

      this.logger.log(`Agendamento atualizado: ${id}`);

      return this.toResponseDto(updatedAppointment);
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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

      // Gerar slots do dia (de 8h às 18h, a cada 30 minutos)
      const slots: Array<{
        startTime: string;
        endTime: string;
        available: boolean;
        reason?: string;
      }> = [];

      for (let hour = workStartHour; hour < workEndHour; hour++) {
        for (let minute = 0; minute < 60; minute += slotInterval) {
          const slotStart = new Date(targetDate);
          slotStart.setHours(hour, minute, 0, 0);
          const slotEnd = new Date(slotStart);
          slotEnd.setTime(slotStart.getTime() + duration * 60 * 1000);

          // Verificar se o slot termina antes do horário de fechamento
          if (
            slotEnd.getHours() > workEndHour ||
            (slotEnd.getHours() === workEndHour && slotEnd.getMinutes() > 0)
          ) {
            continue;
          }

          // Verificar conflitos com agendamentos
          let hasConflict = false;
          let conflictReason = '';

          for (const appointment of appointments) {
            const appointmentEnd = new Date(
              appointment.date.getTime() + appointment.duration * 60 * 1000,
            );

            // Verifica sobreposição
            if (slotStart < appointmentEnd && slotEnd > appointment.date) {
              hasConflict = true;
              conflictReason = `Agendamento existente`;
              break;
            }
          }

          // Verificar conflitos com OS em andamento
          if (!hasConflict) {
            for (const serviceOrder of serviceOrdersInProgress) {
              if (
                !serviceOrder.appointmentDate ||
                !serviceOrder.estimatedHours
              ) {
                continue;
              }

              const soStart = new Date(serviceOrder.appointmentDate);
              const soEnd = new Date(
                soStart.getTime() +
                  serviceOrder.estimatedHours.toNumber() * 60 * 60 * 1000,
              );

              // Verifica sobreposição
              if (slotStart < soEnd && slotEnd > soStart) {
                hasConflict = true;
                conflictReason = `OS em andamento`;
                break;
              }
            }
          }

          // Verificar disponibilidade de elevador (se fornecido)
          if (!hasConflict && getAvailableSlotsDto.elevatorId) {
            const isElevatorAvailable = await this.checkElevatorAvailability(
              tenantId,
              getAvailableSlotsDto.elevatorId,
              slotStart,
              duration,
            );

            if (!isElevatorAvailable) {
              hasConflict = true;
              conflictReason = `Elevador ocupado`;
            }
          }

          slots.push({
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            available: !hasConflict,
            reason: hasConflict ? conflictReason : undefined,
          });
        }
      }

      const hasAvailability = slots.some((slot) => slot.available);

      return {
        date: targetDate.toISOString().split('T')[0],
        availableSlots: slots,
        hasAvailability,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar horários disponíveis: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao buscar horários disponíveis');
    }
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
