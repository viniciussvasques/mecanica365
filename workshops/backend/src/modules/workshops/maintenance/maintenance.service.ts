import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma, Prisma as PrismaTypes } from '@prisma/client';
import {
  CreateMaintenanceTemplateDto,
  CreateVehicleScheduleDto,
  CreateMaintenanceHistoryDto,
  MaintenanceTemplateResponseDto,
  VehicleScheduleResponseDto,
  MaintenanceHistoryResponseDto,
  MaintenanceAlertDto,
  MaintenanceStatus,
  MaintenanceCategory,
  MaintenancePriority,
} from './dto';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // TEMPLATES
  // ============================================================

  async createTemplate(
    tenantId: string,
    dto: CreateMaintenanceTemplateDto,
  ): Promise<MaintenanceTemplateResponseDto> {
    try {
      const template = await this.prisma.maintenanceTemplate.create({
        data: {
          tenantId,
          name: dto.name,
          description: dto.description,
          category: dto.category,
          intervalKm: dto.intervalKm,
          intervalMonths: dto.intervalMonths,
          items: (dto.items || []) as unknown as PrismaTypes.InputJsonValue,
          estimatedCost: dto.estimatedCost,
          estimatedHours: dto.estimatedHours,
          suggestedParts: (dto.suggestedParts ||
            []) as unknown as PrismaTypes.InputJsonValue,
          isActive: dto.isActive ?? true,
          isDefault: dto.isDefault ?? false,
        },
      });

      this.logger.log(`Template criado: ${template.id}`);
      return this.toTemplateResponse(template);
    } catch (error) {
      this.logger.error(
        `Erro ao criar template: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async findAllTemplates(
    tenantId: string,
    category?: MaintenanceCategory,
    includeInactive = false,
  ): Promise<MaintenanceTemplateResponseDto[]> {
    const where: Prisma.MaintenanceTemplateWhereInput = {
      tenantId,
      ...(category && { category }),
      ...(!includeInactive && { isActive: true }),
    };

    const templates = await this.prisma.maintenanceTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return templates.map((t) => this.toTemplateResponse(t));
  }

  async findTemplateById(
    tenantId: string,
    id: string,
  ): Promise<MaintenanceTemplateResponseDto> {
    const template = await this.prisma.maintenanceTemplate.findFirst({
      where: { id, tenantId },
    });

    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }

    return this.toTemplateResponse(template);
  }

  async updateTemplate(
    tenantId: string,
    id: string,
    dto: Partial<CreateMaintenanceTemplateDto>,
  ): Promise<MaintenanceTemplateResponseDto> {
    await this.findTemplateById(tenantId, id);

    const template = await this.prisma.maintenanceTemplate.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category && { category: dto.category }),
        ...(dto.intervalKm !== undefined && { intervalKm: dto.intervalKm }),
        ...(dto.intervalMonths !== undefined && {
          intervalMonths: dto.intervalMonths,
        }),
        ...(dto.items && {
          items: dto.items as unknown as PrismaTypes.InputJsonValue,
        }),
        ...(dto.estimatedCost !== undefined && {
          estimatedCost: dto.estimatedCost,
        }),
        ...(dto.estimatedHours !== undefined && {
          estimatedHours: dto.estimatedHours,
        }),
        ...(dto.suggestedParts && {
          suggestedParts:
            dto.suggestedParts as unknown as PrismaTypes.InputJsonValue,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
    });

    return this.toTemplateResponse(template);
  }

  async deleteTemplate(tenantId: string, id: string): Promise<void> {
    await this.findTemplateById(tenantId, id);
    await this.prisma.maintenanceTemplate.delete({ where: { id } });
    this.logger.log(`Template removido: ${id}`);
  }

  // ============================================================
  // VEHICLE SCHEDULES (Manutenções programadas)
  // ============================================================

  async createSchedule(
    tenantId: string,
    dto: CreateVehicleScheduleDto,
    _userId?: string,
  ): Promise<VehicleScheduleResponseDto> {
    try {
      // Verificar se veículo existe
      const vehicle = await this.prisma.customerVehicle.findUnique({
        where: { id: dto.vehicleId },
      });

      if (!vehicle) {
        throw new NotFoundException('Veículo não encontrado');
      }

      const schedule = await this.prisma.vehicleMaintenanceSchedule.create({
        data: {
          tenantId,
          vehicleId: dto.vehicleId,
          templateId: dto.templateId,
          name: dto.name,
          description: dto.description,
          category: dto.category,
          nextDueKm: dto.nextDueKm,
          nextDueDate: dto.nextDueDate ? new Date(dto.nextDueDate) : null,
          status: dto.status || MaintenanceStatus.PENDING,
          priority: dto.priority || 'normal',
          estimatedCost: dto.estimatedCost,
          notes: dto.notes,
        },
        include: {
          vehicle: true,
          template: true,
        },
      });

      this.logger.log(
        `Manutenção programada criada: ${schedule.id} para veículo ${dto.vehicleId}`,
      );
      return this.toScheduleResponse(schedule);
    } catch (error) {
      this.logger.error(
        `Erro ao criar manutenção programada: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async findAllSchedules(
    tenantId: string,
    vehicleId?: string,
    status?: MaintenanceStatus,
  ): Promise<VehicleScheduleResponseDto[]> {
    const where: Prisma.VehicleMaintenanceScheduleWhereInput = {
      tenantId,
      ...(vehicleId && { vehicleId }),
      ...(status && { status }),
    };

    const schedules = await this.prisma.vehicleMaintenanceSchedule.findMany({
      where,
      include: {
        vehicle: true,
        template: true,
      },
      orderBy: [{ nextDueDate: 'asc' }, { nextDueKm: 'asc' }],
    });

    return schedules.map((s) => this.toScheduleResponse(s));
  }

  async findScheduleById(
    tenantId: string,
    id: string,
  ): Promise<VehicleScheduleResponseDto> {
    const schedule = await this.prisma.vehicleMaintenanceSchedule.findFirst({
      where: { id, tenantId },
      include: {
        vehicle: true,
        template: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Manutenção programada não encontrada');
    }

    return this.toScheduleResponse(schedule);
  }

  async updateSchedule(
    tenantId: string,
    id: string,
    dto: Partial<CreateVehicleScheduleDto>,
  ): Promise<VehicleScheduleResponseDto> {
    await this.findScheduleById(tenantId, id);

    const schedule = await this.prisma.vehicleMaintenanceSchedule.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category && { category: dto.category }),
        ...(dto.nextDueKm !== undefined && { nextDueKm: dto.nextDueKm }),
        ...(dto.nextDueDate !== undefined && {
          nextDueDate: dto.nextDueDate ? new Date(dto.nextDueDate) : null,
        }),
        ...(dto.status && { status: dto.status }),
        ...(dto.priority && { priority: dto.priority }),
        ...(dto.estimatedCost !== undefined && {
          estimatedCost: dto.estimatedCost,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        vehicle: true,
        template: true,
      },
    });

    return this.toScheduleResponse(schedule);
  }

  async completeSchedule(
    tenantId: string,
    id: string,
    userId: string,
  ): Promise<VehicleScheduleResponseDto> {
    await this.findScheduleById(tenantId, id);

    const schedule = await this.prisma.vehicleMaintenanceSchedule.update({
      where: { id },
      data: {
        status: MaintenanceStatus.COMPLETED,
        completedAt: new Date(),
        completedById: userId,
      },
      include: {
        vehicle: true,
        template: true,
      },
    });

    this.logger.log(`Manutenção completada: ${id}`);
    return this.toScheduleResponse(schedule);
  }

  async deleteSchedule(tenantId: string, id: string): Promise<void> {
    await this.findScheduleById(tenantId, id);
    await this.prisma.vehicleMaintenanceSchedule.delete({ where: { id } });
    this.logger.log(`Manutenção programada removida: ${id}`);
  }

  // ============================================================
  // MAINTENANCE HISTORY (Histórico de manutenções)
  // ============================================================

  async createHistory(
    tenantId: string,
    dto: CreateMaintenanceHistoryDto,
    userId?: string,
  ): Promise<MaintenanceHistoryResponseDto> {
    try {
      const history = await this.prisma.maintenanceHistory.create({
        data: {
          tenantId,
          vehicleId: dto.vehicleId,
          scheduleId: dto.scheduleId,
          serviceOrderId: dto.serviceOrderId,
          name: dto.name,
          description: dto.description,
          category: dto.category,
          performedAt: new Date(dto.performedAt),
          mileageAtService: dto.mileageAtService,
          laborCost: dto.laborCost,
          partsCost: dto.partsCost,
          totalCost: dto.totalCost,
          partsUsed: (dto.partsUsed ||
            []) as unknown as PrismaTypes.InputJsonValue,
          servicesPerformed: (dto.servicesPerformed ||
            []) as unknown as PrismaTypes.InputJsonValue,
          nextDueKm: dto.nextDueKm,
          nextDueDate: dto.nextDueDate ? new Date(dto.nextDueDate) : null,
          performedById: userId,
          performedByName: dto.performedByName,
          notes: dto.notes,
        },
        include: {
          vehicle: true,
          serviceOrder: true,
        },
      });

      // Se tinha schedule, marcar como completa
      if (dto.scheduleId) {
        await this.prisma.vehicleMaintenanceSchedule.update({
          where: { id: dto.scheduleId },
          data: {
            status: MaintenanceStatus.COMPLETED,
            completedAt: new Date(),
            completedById: userId,
          },
        });
      }

      // Atualizar quilometragem do veículo se informada
      if (dto.mileageAtService) {
        await this.prisma.customerVehicle.update({
          where: { id: dto.vehicleId },
          data: { mileage: dto.mileageAtService },
        });
      }

      this.logger.log(`Histórico de manutenção criado: ${history.id}`);
      return this.toHistoryResponse(history);
    } catch (error) {
      this.logger.error(
        `Erro ao criar histórico: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async findAllHistory(
    tenantId: string,
    vehicleId?: string,
    category?: MaintenanceCategory,
    limit = 50,
  ): Promise<MaintenanceHistoryResponseDto[]> {
    const where: Prisma.MaintenanceHistoryWhereInput = {
      tenantId,
      ...(vehicleId && { vehicleId }),
      ...(category && { category }),
    };

    const history = await this.prisma.maintenanceHistory.findMany({
      where,
      include: {
        vehicle: true,
        serviceOrder: true,
      },
      orderBy: { performedAt: 'desc' },
      take: limit,
    });

    return history.map((h) => this.toHistoryResponse(h));
  }

  async findHistoryByVehicle(
    tenantId: string,
    vehicleId: string,
  ): Promise<MaintenanceHistoryResponseDto[]> {
    return this.findAllHistory(tenantId, vehicleId);
  }

  // ============================================================
  // ALERTAS E PREVISÕES
  // ============================================================

  async getMaintenanceAlerts(
    tenantId: string,
    daysAhead = 30,
  ): Promise<MaintenanceAlertDto[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    // Buscar manutenções que vencem em breve ou estão atrasadas
    const schedules = await this.prisma.vehicleMaintenanceSchedule.findMany({
      where: {
        tenantId,
        status: {
          in: [
            MaintenanceStatus.PENDING,
            MaintenanceStatus.DUE,
            MaintenanceStatus.OVERDUE,
          ],
        },
        OR: [
          {
            nextDueDate: {
              lte: futureDate,
            },
          },
          {
            nextDueDate: {
              lt: now,
            },
          },
        ],
      },
      include: {
        vehicle: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: [{ nextDueDate: 'asc' }],
    });

    return schedules.map((s): MaintenanceAlertDto => {
      const isOverdue: boolean =
        (s.nextDueDate && s.nextDueDate < now) ||
        (s.nextDueKm && s.vehicle.mileage && s.nextDueKm <= s.vehicle.mileage) ||
        false;

      const daysUntilDue = s.nextDueDate
        ? Math.ceil(
            (s.nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          )
        : 0;

      const kmUntilDue =
        s.nextDueKm && s.vehicle.mileage
          ? s.nextDueKm - s.vehicle.mileage
          : undefined;

      return {
        id: s.id,
        vehicleId: s.vehicleId,
        maintenanceName: s.name,
        category: s.category as MaintenanceCategory,
        priority: s.priority as MaintenancePriority,
        dueKm: s.nextDueKm ?? undefined,
        dueDate: s.nextDueDate ?? undefined,
        isOverdue,
        daysUntilDue,
        kmUntilDue,
        estimatedCost: s.estimatedCost?.toNumber(),
        vehicle: {
          id: s.vehicle.id,
          make: s.vehicle.make ?? undefined,
          model: s.vehicle.model ?? undefined,
          year: s.vehicle.year ?? undefined,
          placa: s.vehicle.placa ?? undefined,
          mileage: s.vehicle.mileage ?? undefined,
        },
        customer: s.vehicle.customer
          ? {
              id: s.vehicle.customer.id,
              name: s.vehicle.customer.name,
              phone: s.vehicle.customer.phone ?? undefined,
              email: s.vehicle.customer.email ?? undefined,
            }
          : undefined,
      };
    });
  }

  async getVehicleMaintenanceSummary(
    tenantId: string,
    vehicleId: string,
  ): Promise<{
    vehicle: {
      id: string;
      make?: string;
      model?: string;
      year?: number;
      placa?: string;
      mileage?: number;
    };
    pendingMaintenances: VehicleScheduleResponseDto[];
    recentHistory: MaintenanceHistoryResponseDto[];
    totalSpent: number;
    nextMaintenance?: VehicleScheduleResponseDto;
    overdueCount: number;
  }> {
    const vehicle = await this.prisma.customerVehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado');
    }

    const [pendingSchedules, history] = await Promise.all([
      this.prisma.vehicleMaintenanceSchedule.findMany({
        where: {
          tenantId,
          vehicleId,
          status: {
            in: [
              MaintenanceStatus.PENDING,
              MaintenanceStatus.DUE,
              MaintenanceStatus.OVERDUE,
            ],
          },
        },
        include: { vehicle: true, template: true },
        orderBy: { nextDueDate: 'asc' },
      }),
      this.prisma.maintenanceHistory.findMany({
        where: { tenantId, vehicleId },
        include: { vehicle: true, serviceOrder: true },
        orderBy: { performedAt: 'desc' },
        take: 10,
      }),
    ]);

    const totalSpent = history.reduce(
      (sum, h) => sum + (h.totalCost?.toNumber() || 0),
      0,
    );

    const overdueCount = pendingSchedules.filter((s) => {
      const now = new Date();
      return (
        (s.nextDueDate && s.nextDueDate < now) ||
        (s.nextDueKm && vehicle.mileage && s.nextDueKm <= vehicle.mileage)
      );
    }).length;

    return {
      vehicle: {
        id: vehicle.id,
        make: vehicle.make ?? undefined,
        model: vehicle.model ?? undefined,
        year: vehicle.year ?? undefined,
        placa: vehicle.placa ?? undefined,
        mileage: vehicle.mileage ?? undefined,
      },
      pendingMaintenances: pendingSchedules.map((s) =>
        this.toScheduleResponse(s),
      ),
      recentHistory: history.map((h) => this.toHistoryResponse(h)),
      totalSpent,
      nextMaintenance:
        pendingSchedules.length > 0
          ? this.toScheduleResponse(pendingSchedules[0])
          : undefined,
      overdueCount,
    };
  }

  // ============================================================
  // APLICAR TEMPLATE A VEÍCULO
  // ============================================================

  async applyTemplateToVehicle(
    tenantId: string,
    templateId: string,
    vehicleId: string,
    currentMileage?: number,
  ): Promise<VehicleScheduleResponseDto> {
    const template = await this.findTemplateById(tenantId, templateId);
    const vehicle = await this.prisma.customerVehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado');
    }

    const mileage = currentMileage || vehicle.mileage || 0;

    // Calcular próxima manutenção baseado no template
    let nextDueKm: number | undefined;
    let nextDueDate: Date | undefined;

    if (template.intervalKm) {
      nextDueKm = mileage + template.intervalKm;
    }

    if (template.intervalMonths) {
      nextDueDate = new Date();
      nextDueDate.setMonth(nextDueDate.getMonth() + template.intervalMonths);
    }

    return this.createSchedule(tenantId, {
      vehicleId,
      templateId,
      name: template.name,
      description: template.description,
      category: template.category,
      nextDueKm,
      nextDueDate: nextDueDate?.toISOString(),
      estimatedCost: template.estimatedCost,
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private toTemplateResponse(
    template: PrismaTypes.MaintenanceTemplateGetPayload<Record<string, never>>,
  ): MaintenanceTemplateResponseDto {
    return {
      id: template.id,
      tenantId: template.tenantId,
      name: template.name,
      description: template.description ?? undefined,
      category: template.category as MaintenanceCategory,
      intervalKm: template.intervalKm ?? undefined,
      intervalMonths: template.intervalMonths ?? undefined,
      items: Array.isArray(template.items) ? (template.items as unknown[]) : [],
      estimatedCost: template.estimatedCost?.toNumber(),
      estimatedHours: template.estimatedHours?.toNumber(),
      suggestedParts: Array.isArray(template.suggestedParts)
        ? (template.suggestedParts as unknown[])
        : [],
      isActive: template.isActive,
      isDefault: template.isDefault,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  private toScheduleResponse(
    schedule: PrismaTypes.VehicleMaintenanceScheduleGetPayload<{
      include: {
        vehicle: true;
        template: true;
      };
    }>,
  ): VehicleScheduleResponseDto {
    return {
      id: schedule.id,
      tenantId: schedule.tenantId,
      vehicleId: schedule.vehicleId,
      templateId: schedule.templateId ?? undefined,
      name: schedule.name,
      description: schedule.description ?? undefined,
      category: schedule.category as MaintenanceCategory,
      nextDueKm: schedule.nextDueKm ?? undefined,
      nextDueDate: schedule.nextDueDate ?? undefined,
      status: schedule.status as MaintenanceStatus,
      priority: schedule.priority as MaintenancePriority,
      alertSentAt: schedule.alertSentAt ?? undefined,
      alertDismissed: schedule.alertDismissed,
      estimatedCost: schedule.estimatedCost?.toNumber(),
      notes: schedule.notes ?? undefined,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
      completedAt: schedule.completedAt ?? undefined,
      completedById: schedule.completedById ?? undefined,
      vehicle: schedule.vehicle
        ? {
            id: schedule.vehicle.id,
            make: schedule.vehicle.make ?? undefined,
            model: schedule.vehicle.model ?? undefined,
            year: schedule.vehicle.year ?? undefined,
            placa: schedule.vehicle.placa ?? undefined,
          }
        : undefined,
      template: schedule.template
        ? {
            id: schedule.template.id,
            name: schedule.template.name,
          }
        : undefined,
    };
  }

  private toHistoryResponse(
    history: PrismaTypes.MaintenanceHistoryGetPayload<{
      include: {
        vehicle: true;
        serviceOrder: true;
      };
    }>,
  ): MaintenanceHistoryResponseDto {
    return {
      id: history.id,
      tenantId: history.tenantId,
      vehicleId: history.vehicleId,
      scheduleId: history.scheduleId ?? undefined,
      serviceOrderId: history.serviceOrderId ?? undefined,
      name: history.name,
      description: history.description ?? undefined,
      category: history.category as MaintenanceCategory,
      performedAt: history.performedAt,
      mileageAtService: history.mileageAtService ?? undefined,
      laborCost: history.laborCost?.toNumber(),
      partsCost: history.partsCost?.toNumber(),
      totalCost: history.totalCost?.toNumber(),
      partsUsed: Array.isArray(history.partsUsed)
        ? (history.partsUsed as unknown[])
        : [],
      servicesPerformed: Array.isArray(history.servicesPerformed)
        ? (history.servicesPerformed as unknown[])
        : [],
      nextDueKm: history.nextDueKm ?? undefined,
      nextDueDate: history.nextDueDate ?? undefined,
      performedById: history.performedById ?? undefined,
      performedByName: history.performedByName ?? undefined,
      notes: history.notes ?? undefined,
      createdAt: history.createdAt,
      vehicle: history.vehicle
        ? {
            id: history.vehicle.id,
            make: history.vehicle.make ?? undefined,
            model: history.vehicle.model ?? undefined,
            year: history.vehicle.year ?? undefined,
            placa: history.vehicle.placa ?? undefined,
          }
        : undefined,
      serviceOrder: history.serviceOrder
        ? {
            id: history.serviceOrder.id,
            number: history.serviceOrder.number,
          }
        : undefined,
    };
  }
}
