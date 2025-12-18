import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CreateAdminPlanDto } from './dto/create-admin-plan.dto';
import { UpdateAdminPlanDto } from './dto/update-admin-plan.dto';

@Injectable()
export class AdminPlansService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    const plans = await this.prisma.plan.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return plans;
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });

    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }

    return plan;
  }

  async findByCode(code: string) {
    const plan = await this.prisma.plan.findUnique({ where: { code } });

    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }

    return plan;
  }

  async create(dto: CreateAdminPlanDto) {
    await this.ensureCodeUnique(dto.code);

    if (dto.isDefault) {
      await this.resetDefaultPlan();
    }

    try {
      const created = await this.prisma.plan.create({
        data: this.mapDtoToCreateInput(dto),
      });
      return created;
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Código do plano já está em uso');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateAdminPlanDto) {
    const existing = await this.prisma.plan.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Plano não encontrado');
    }

    if (dto.code && dto.code !== existing.code) {
      await this.ensureCodeUnique(dto.code);
    }

    if (dto.isDefault) {
      await this.resetDefaultPlan(id);
    }

    const updateData = this.mapDtoToUpdateInput(dto);

    const updated = await this.prisma.plan.update({
      where: { id },
      data: updateData,
    });

    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.plan.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Plano não encontrado');
    }

    if (existing.isDefault) {
      throw new BadRequestException('Não é possível remover o plano padrão');
    }

    const activeSubscriptions = await this.prisma.subscription.count({
      where: {
        planId: id,
        status: 'active',
      },
    });

    if (activeSubscriptions > 0) {
      throw new BadRequestException(
        'Existem assinaturas ativas associadas a este plano',
      );
    }

    await this.prisma.plan.delete({ where: { id } });

    return { message: 'Plano removido com sucesso' };
  }

  async getStats() {
    const [totalPlans, activePlans, subscriptions, defaultPlan] =
      await Promise.all([
        this.prisma.plan.count(),
        this.prisma.plan.count({ where: { isActive: true } }),
        this.prisma.subscription.groupBy({
          by: ['planId'],
          _count: { planId: true },
          where: { planId: { not: null } },
        }),
        this.prisma.plan.findFirst({ where: { isDefault: true } }),
      ]);

    const planIds = subscriptions
      .map((item) => item.planId)
      .filter((id): id is string => Boolean(id));

    const planMap = planIds.length
      ? await this.getPlanNamesByIds(planIds)
      : new Map<string, string>();

    const subscriptionsByPlan = subscriptions
      .filter((item) => item.planId)
      .map((item) => ({
        planId: item.planId as string,
        planName: planMap.get(item.planId as string) ?? 'Plano desconhecido',
        count: item._count.planId,
      }));

    return {
      totalPlans,
      activePlans,
      defaultPlan,
      subscriptionsByPlan,
    };
  }

  private async ensureCodeUnique(code: string) {
    const existing = await this.prisma.plan.findUnique({ where: { code } });

    if (existing) {
      throw new BadRequestException('Código do plano já está em uso');
    }
  }

  private async resetDefaultPlan(excludeId?: string) {
    await this.prisma.plan.updateMany({
      where: excludeId ? { id: { not: excludeId } } : undefined,
      data: { isDefault: false },
    });
  }

  private mapDtoToCreateInput(dto: CreateAdminPlanDto): Prisma.PlanCreateInput {
    return {
      code: dto.code,
      name: dto.name,
      description: dto.description,
      monthlyPrice: new Prisma.Decimal(dto.monthlyPrice),
      annualPrice: new Prisma.Decimal(dto.annualPrice),
      serviceOrdersLimit:
        dto.serviceOrdersLimit === null ? null : dto.serviceOrdersLimit ?? null,
      partsLimit: dto.partsLimit === null ? null : dto.partsLimit ?? null,
      usersLimit: dto.usersLimit === null ? null : dto.usersLimit ?? null,
      features: dto.features,
      isActive: dto.isActive ?? true,
      isDefault: dto.isDefault ?? false,
      sortOrder: dto.sortOrder ?? 0,
      highlightText: dto.highlightText ?? null,
      stripePriceIdMonthly: dto.stripePriceIdMonthly ?? null,
      stripePriceIdAnnual: dto.stripePriceIdAnnual ?? null,
      stripeProductId: dto.stripeProductId ?? null,
    };
  }

  private mapDtoToUpdateInput(dto: UpdateAdminPlanDto): Prisma.PlanUpdateInput {
    const data: Prisma.PlanUpdateInput = {};

    if (dto.code !== undefined) data.code = dto.code;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.monthlyPrice !== undefined) {
      data.monthlyPrice = new Prisma.Decimal(dto.monthlyPrice);
    }
    if (dto.annualPrice !== undefined) {
      data.annualPrice = new Prisma.Decimal(dto.annualPrice);
    }
    if (dto.serviceOrdersLimit !== undefined) {
      data.serviceOrdersLimit =
        dto.serviceOrdersLimit === null ? null : dto.serviceOrdersLimit;
    }
    if (dto.partsLimit !== undefined) {
      data.partsLimit = dto.partsLimit === null ? null : dto.partsLimit;
    }
    if (dto.usersLimit !== undefined) {
      data.usersLimit = dto.usersLimit === null ? null : dto.usersLimit;
    }
    if (dto.features !== undefined) data.features = dto.features;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.isDefault !== undefined) data.isDefault = dto.isDefault;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.highlightText !== undefined) {
      data.highlightText = dto.highlightText ?? null;
    }
    if (dto.stripePriceIdMonthly !== undefined) {
      data.stripePriceIdMonthly = dto.stripePriceIdMonthly ?? null;
    }
    if (dto.stripePriceIdAnnual !== undefined) {
      data.stripePriceIdAnnual = dto.stripePriceIdAnnual ?? null;
    }
    if (dto.stripeProductId !== undefined) {
      data.stripeProductId = dto.stripeProductId ?? null;
    }

    return data;
  }

  private async getPlanNamesByIds(ids: string[]) {
    const plans = await this.prisma.plan.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });

    return plans.reduce((map, plan) => {
      map.set(plan.id, plan.name);
      return map;
    }, new Map<string, string>());
  }
}
