import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CreatePlanDto, UpdatePlanDto, PlanResponseDto } from './dto';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createPlanDto: CreatePlanDto): Promise<PlanResponseDto> {
    try {
      // Verificar se já existe um plano com o mesmo código
      const existingPlan = await this.prisma.plan.findUnique({
        where: { code: createPlanDto.code },
      });

      if (existingPlan) {
        throw new ConflictException(
          `Plano com código '${createPlanDto.code}' já existe`,
        );
      }

      // Se este plano for marcado como default, remover default dos outros
      if (createPlanDto.isDefault) {
        await this.prisma.plan.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      const plan = await this.prisma.plan.create({
        data: {
          code: createPlanDto.code,
          name: createPlanDto.name,
          description: createPlanDto.description,
          monthlyPrice: new Prisma.Decimal(createPlanDto.monthlyPrice),
          annualPrice: new Prisma.Decimal(createPlanDto.annualPrice),
          serviceOrdersLimit: createPlanDto.serviceOrdersLimit,
          partsLimit: createPlanDto.partsLimit,
          usersLimit: createPlanDto.usersLimit,
          features: createPlanDto.features,
          isActive: createPlanDto.isActive ?? true,
          isDefault: createPlanDto.isDefault ?? false,
          sortOrder: createPlanDto.sortOrder ?? 0,
          highlightText: createPlanDto.highlightText,
          stripePriceIdMonthly: createPlanDto.stripePriceIdMonthly,
          stripePriceIdAnnual: createPlanDto.stripePriceIdAnnual,
          stripeProductId: createPlanDto.stripeProductId,
        },
      });

      this.logger.log(`Plano criado: ${plan.id} (${plan.code})`);
      return this.toResponseDto(plan);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(
        `Erro ao criar plano: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async findAll(includeInactive = false): Promise<PlanResponseDto[]> {
    try {
      const plans = await this.prisma.plan.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });

      return plans.map((plan) => this.toResponseDto(plan));
    } catch (error) {
      this.logger.error(
        `Erro ao listar planos: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async findOne(id: string): Promise<PlanResponseDto> {
    try {
      const plan = await this.prisma.plan.findUnique({
        where: { id },
      });

      if (!plan) {
        throw new NotFoundException(`Plano não encontrado: ${id}`);
      }

      return this.toResponseDto(plan);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao buscar plano: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async findByCode(code: string): Promise<PlanResponseDto> {
    try {
      const plan = await this.prisma.plan.findUnique({
        where: { code },
      });

      if (!plan) {
        throw new NotFoundException(`Plano não encontrado: ${code}`);
      }

      return this.toResponseDto(plan);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erro ao buscar plano por código: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async update(
    id: string,
    updatePlanDto: UpdatePlanDto,
  ): Promise<PlanResponseDto> {
    try {
      const existingPlan = await this.validatePlanExists(id);
      await this.validateCodeChange(id, updatePlanDto, existingPlan);
      await this.handleDefaultPlanChange(id, updatePlanDto, existingPlan);

      const updateData = this.buildUpdateData(updatePlanDto);
      const plan = await this.prisma.plan.update({
        where: { id },
        data: updateData,
      });

      this.logger.log(`Plano atualizado: ${plan.id} (${plan.code})`);
      return this.toResponseDto(plan);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `Erro ao atualizar plano: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  private async validatePlanExists(id: string) {
    const existingPlan = await this.prisma.plan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      throw new NotFoundException(`Plano não encontrado: ${id}`);
    }

    return existingPlan;
  }

  private async validateCodeChange(
    id: string,
    updatePlanDto: UpdatePlanDto,
    existingPlan: { code: string },
  ): Promise<void> {
    if (!updatePlanDto.code || updatePlanDto.code === existingPlan.code) {
      return;
    }

    const planWithCode = await this.prisma.plan.findUnique({
      where: { code: updatePlanDto.code },
    });

    if (planWithCode) {
      throw new ConflictException(
        `Plano com código '${updatePlanDto.code}' já existe`,
      );
    }
  }

  private async handleDefaultPlanChange(
    id: string,
    updatePlanDto: UpdatePlanDto,
    existingPlan: { isDefault: boolean },
  ): Promise<void> {
    if (updatePlanDto.isDefault && !existingPlan.isDefault) {
      await this.prisma.plan.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }
  }

  private buildUpdateData(
    updatePlanDto: UpdatePlanDto,
  ): Prisma.PlanUpdateInput {
    const updateData: Prisma.PlanUpdateInput = {};

    this.applyBasicFields(updatePlanDto, updateData);
    this.applyPriceFields(updatePlanDto, updateData);
    this.applyLimitFields(updatePlanDto, updateData);
    this.applyStripeFields(updatePlanDto, updateData);

    return updateData;
  }

  private applyBasicFields(
    updatePlanDto: UpdatePlanDto,
    updateData: Prisma.PlanUpdateInput,
  ): void {
    if (updatePlanDto.code !== undefined) updateData.code = updatePlanDto.code;
    if (updatePlanDto.name !== undefined) updateData.name = updatePlanDto.name;
    if (updatePlanDto.description !== undefined)
      updateData.description = updatePlanDto.description;
    if (updatePlanDto.features !== undefined)
      updateData.features = updatePlanDto.features;
    if (updatePlanDto.isActive !== undefined)
      updateData.isActive = updatePlanDto.isActive;
    if (updatePlanDto.isDefault !== undefined)
      updateData.isDefault = updatePlanDto.isDefault;
    if (updatePlanDto.sortOrder !== undefined)
      updateData.sortOrder = updatePlanDto.sortOrder;
    if (updatePlanDto.highlightText !== undefined)
      updateData.highlightText = updatePlanDto.highlightText;
  }

  private applyPriceFields(
    updatePlanDto: UpdatePlanDto,
    updateData: Prisma.PlanUpdateInput,
  ): void {
    if (updatePlanDto.monthlyPrice !== undefined)
      updateData.monthlyPrice = new Prisma.Decimal(updatePlanDto.monthlyPrice);
    if (updatePlanDto.annualPrice !== undefined)
      updateData.annualPrice = new Prisma.Decimal(updatePlanDto.annualPrice);
  }

  private applyLimitFields(
    updatePlanDto: UpdatePlanDto,
    updateData: Prisma.PlanUpdateInput,
  ): void {
    if (updatePlanDto.serviceOrdersLimit !== undefined)
      updateData.serviceOrdersLimit = updatePlanDto.serviceOrdersLimit;
    if (updatePlanDto.partsLimit !== undefined)
      updateData.partsLimit = updatePlanDto.partsLimit;
    if (updatePlanDto.usersLimit !== undefined)
      updateData.usersLimit = updatePlanDto.usersLimit;
  }

  private applyStripeFields(
    updatePlanDto: UpdatePlanDto,
    updateData: Prisma.PlanUpdateInput,
  ): void {
    if (updatePlanDto.stripePriceIdMonthly !== undefined)
      updateData.stripePriceIdMonthly = updatePlanDto.stripePriceIdMonthly;
    if (updatePlanDto.stripePriceIdAnnual !== undefined)
      updateData.stripePriceIdAnnual = updatePlanDto.stripePriceIdAnnual;
    if (updatePlanDto.stripeProductId !== undefined)
      updateData.stripeProductId = updatePlanDto.stripeProductId;
  }

  async remove(id: string): Promise<void> {
    try {
      const plan = await this.prisma.plan.findUnique({
        where: { id },
        include: { subscriptions: { take: 1 } },
      });

      if (!plan) {
        throw new NotFoundException(`Plano não encontrado: ${id}`);
      }

      // Verificar se há assinaturas usando este plano
      if (plan.subscriptions.length > 0) {
        throw new BadRequestException(
          'Não é possível excluir um plano que possui assinaturas ativas. Desative o plano ou migre as assinaturas primeiro.',
        );
      }

      await this.prisma.plan.delete({
        where: { id },
      });

      this.logger.log(`Plano excluído: ${id}`);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Erro ao excluir plano: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async getStats(): Promise<{
    totalPlans: number;
    activePlans: number;
    totalSubscriptions: number;
    subscriptionsByPlan: Array<{
      planId: string;
      planName: string;
      count: number;
    }>;
  }> {
    try {
      const [totalPlans, activePlans, subscriptionsByPlan] = await Promise.all([
        this.prisma.plan.count(),
        this.prisma.plan.count({ where: { isActive: true } }),
        this.prisma.plan.findMany({
          include: {
            _count: {
              select: { subscriptions: true },
            },
          },
          orderBy: { sortOrder: 'asc' },
        }),
      ]);

      const totalSubscriptions = subscriptionsByPlan.reduce(
        (acc, plan) => acc + plan._count.subscriptions,
        0,
      );

      return {
        totalPlans,
        activePlans,
        totalSubscriptions,
        subscriptionsByPlan: subscriptionsByPlan.map((plan) => ({
          planId: plan.id,
          planName: plan.name,
          count: plan._count.subscriptions,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao obter estatísticas de planos: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  private toResponseDto(plan: Prisma.PlanGetPayload<object>): PlanResponseDto {
    return {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description ?? undefined,
      monthlyPrice: Number(plan.monthlyPrice),
      annualPrice: Number(plan.annualPrice),
      serviceOrdersLimit: plan.serviceOrdersLimit,
      partsLimit: plan.partsLimit,
      usersLimit: plan.usersLimit,
      features: plan.features,
      isActive: plan.isActive,
      isDefault: plan.isDefault,
      sortOrder: plan.sortOrder,
      highlightText: plan.highlightText,
      stripePriceIdMonthly: plan.stripePriceIdMonthly,
      stripePriceIdAnnual: plan.stripePriceIdAnnual,
      stripeProductId: plan.stripeProductId,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      // Campos computados para compatibilidade com frontend
      price: {
        monthly: Number(plan.monthlyPrice),
        annual: Number(plan.annualPrice),
      },
      limits: {
        serviceOrdersLimit: plan.serviceOrdersLimit,
        partsLimit: plan.partsLimit,
        usersLimit: plan.usersLimit,
        features: plan.features,
      },
    };
  }
}
