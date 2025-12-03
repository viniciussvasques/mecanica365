import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionResponseDto,
  SubscriptionPlan,
  SubscriptionStatus,
  BillingCycle,
} from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  // Configuração de planos e limites
  private readonly planLimits = {
    [SubscriptionPlan.WORKSHOPS_STARTER]: {
      serviceOrdersLimit: 50,
      partsLimit: 100,
      usersLimit: 3,
      features: ['basic_service_orders', 'basic_customers'],
    },
    [SubscriptionPlan.WORKSHOPS_PROFESSIONAL]: {
      serviceOrdersLimit: 500,
      partsLimit: 1000,
      usersLimit: 10,
      features: [
        'basic_service_orders',
        'basic_customers',
        'advanced_reports',
        'multiple_locations',
        'api_access',
      ],
    },
    [SubscriptionPlan.WORKSHOPS_ENTERPRISE]: {
      serviceOrdersLimit: null, // Ilimitado
      partsLimit: null, // Ilimitado
      usersLimit: null, // Ilimitado
      features: [
        'basic_service_orders',
        'basic_customers',
        'advanced_reports',
        'multiple_locations',
        'api_access',
        'white_label',
        'priority_support',
        'custom_integrations',
      ],
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly featureFlagsService: FeatureFlagsService,
  ) {}

  async create(
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    try {
      // Verificar se tenant existe
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: createSubscriptionDto.tenantId },
      });

      if (!tenant) {
        throw new NotFoundException('Tenant não encontrado');
      }

      // Verificar se já existe subscription para este tenant
      const existingSubscription = await this.prisma.subscription.findUnique({
        where: { tenantId: createSubscriptionDto.tenantId },
      });

      if (existingSubscription) {
        throw new BadRequestException('Tenant já possui uma subscription');
      }

      // Obter limites do plano
      const planConfig = this.planLimits[createSubscriptionDto.plan] as
        | {
            serviceOrdersLimit: number | null;
            partsLimit: number | null;
            usersLimit: number | null;
            features: string[];
          }
        | undefined;
      if (!planConfig) {
        throw new BadRequestException('Plano inválido');
      }

      // Calcular período (30 dias para monthly, 365 para annual)
      const billingCycle =
        createSubscriptionDto.billingCycle || BillingCycle.MONTHLY;
      const periodDays = billingCycle === BillingCycle.ANNUAL ? 365 : 30;
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + periodDays);

      // Criar subscription
      const subscription = await this.prisma.subscription.create({
        data: {
          tenantId: createSubscriptionDto.tenantId,
          plan: createSubscriptionDto.plan,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          activeFeatures: planConfig.features,
          serviceOrdersLimit: planConfig.serviceOrdersLimit,
          serviceOrdersUsed: 0,
          partsLimit: planConfig.partsLimit,
          billingCycle: billingCycle,
          stripeSubscriptionId: createSubscriptionDto.stripeSubscriptionId,
          stripeCustomerId: createSubscriptionDto.stripeCustomerId,
        },
      });

      // Atualizar plano do tenant
      await this.prisma.tenant.update({
        where: { id: createSubscriptionDto.tenantId },
        data: { plan: createSubscriptionDto.plan },
      });

      this.logger.log(
        `Subscription criada: ${subscription.id} para tenant ${createSubscriptionDto.tenantId}`,
      );
      return this.toResponseDto(subscription);
    } catch (error) {
      this.logger.error(
        `Erro ao criar subscription: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async findByTenantId(tenantId: string): Promise<SubscriptionResponseDto> {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { tenantId },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription não encontrada');
      }

      return this.toResponseDto(subscription);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar subscription do tenant ${tenantId}: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async update(
    tenantId: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { tenantId },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription não encontrada');
      }

      const updateData: Prisma.SubscriptionUpdateInput = {};

      if (updateSubscriptionDto.plan) {
        // Atualizar limites e features quando o plano muda
        const planConfig = this.planLimits[updateSubscriptionDto.plan] as
          | {
              serviceOrdersLimit: number | null;
              partsLimit: number | null;
              usersLimit: number | null;
              features: string[];
            }
          | undefined;
        if (!planConfig) {
          throw new BadRequestException('Plano inválido');
        }
        // Obter features habilitadas do FeatureFlagsService baseado no plano
        const enabledFeatures = this.getEnabledFeaturesForPlan(
          updateSubscriptionDto.plan,
        );
        updateData.plan = updateSubscriptionDto.plan;
        updateData.activeFeatures = enabledFeatures;
        updateData.serviceOrdersLimit = planConfig.serviceOrdersLimit;
        updateData.partsLimit = planConfig.partsLimit;

        // Atualizar plano do tenant também
        await this.prisma.tenant.update({
          where: { id: tenantId },
          data: { plan: updateSubscriptionDto.plan },
        });
      }

      if (updateSubscriptionDto.status) {
        updateData.status = updateSubscriptionDto.status;
      }

      if (updateSubscriptionDto.activeFeatures) {
        updateData.activeFeatures = updateSubscriptionDto.activeFeatures;
      }

      if (updateSubscriptionDto.serviceOrdersLimit !== undefined) {
        updateData.serviceOrdersLimit =
          updateSubscriptionDto.serviceOrdersLimit;
      }

      if (updateSubscriptionDto.partsLimit !== undefined) {
        updateData.partsLimit = updateSubscriptionDto.partsLimit;
      }

      if (updateSubscriptionDto.billingCycle) {
        updateData.billingCycle = updateSubscriptionDto.billingCycle;
      }

      const updatedSubscription = await this.prisma.subscription.update({
        where: { tenantId },
        data: updateData,
      });

      this.logger.log(`Subscription atualizada: ${tenantId}`);
      return this.toResponseDto(updatedSubscription);
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar subscription ${tenantId}: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async upgrade(
    tenantId: string,
    newPlan: SubscriptionPlan,
  ): Promise<SubscriptionResponseDto> {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { tenantId },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription não encontrada');
      }

      // Validar upgrade (só pode fazer upgrade, não downgrade)
      const currentPlanOrder = this.getPlanOrder(
        subscription.plan as SubscriptionPlan,
      );
      const newPlanOrder = this.getPlanOrder(newPlan);

      if (newPlanOrder <= currentPlanOrder) {
        throw new BadRequestException(
          'Use o endpoint de downgrade para reduzir o plano',
        );
      }

      // Obter configuração do novo plano
      const planConfig = this.planLimits[newPlan] as
        | {
            serviceOrdersLimit: number | null;
            partsLimit: number | null;
            usersLimit: number | null;
            features: string[];
          }
        | undefined;
      if (!planConfig) {
        throw new BadRequestException('Plano inválido');
      }

      // Obter features habilitadas do FeatureFlagsService baseado no plano
      const enabledFeatures = this.getEnabledFeaturesForPlan(newPlan);

      // Atualizar subscription
      const updatedSubscription = await this.prisma.subscription.update({
        where: { tenantId },
        data: {
          plan: newPlan,
          activeFeatures: enabledFeatures,
          serviceOrdersLimit: planConfig.serviceOrdersLimit,
          partsLimit: planConfig.partsLimit,
        },
      });

      // Atualizar plano do tenant
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { plan: newPlan },
      });

      this.logger.log(`Subscription upgrade: ${tenantId} -> ${newPlan}`);
      return this.toResponseDto(updatedSubscription);
    } catch (error) {
      this.logger.error(
        `Erro ao fazer upgrade da subscription ${tenantId}: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async downgrade(
    tenantId: string,
    newPlan: SubscriptionPlan,
  ): Promise<SubscriptionResponseDto> {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { tenantId },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription não encontrada');
      }

      // Validar downgrade
      const currentPlanOrder = this.getPlanOrder(
        subscription.plan as SubscriptionPlan,
      );
      const newPlanOrder = this.getPlanOrder(newPlan);

      if (newPlanOrder >= currentPlanOrder) {
        throw new BadRequestException(
          'Use o endpoint de upgrade para aumentar o plano',
        );
      }

      // Obter configuração do novo plano
      const planConfig = this.planLimits[newPlan] as
        | {
            serviceOrdersLimit: number | null;
            partsLimit: number | null;
            usersLimit: number | null;
            features: string[];
          }
        | undefined;
      if (!planConfig) {
        throw new BadRequestException('Plano inválido');
      }

      // Obter features habilitadas do FeatureFlagsService baseado no plano
      const enabledFeatures = this.getEnabledFeaturesForPlan(newPlan);

      // Atualizar subscription
      const updatedSubscription = await this.prisma.subscription.update({
        where: { tenantId },
        data: {
          plan: newPlan,
          activeFeatures: enabledFeatures,
          serviceOrdersLimit: planConfig.serviceOrdersLimit,
          partsLimit: planConfig.partsLimit,
        },
      });

      // Atualizar plano do tenant
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { plan: newPlan },
      });

      this.logger.log(`Subscription downgrade: ${tenantId} -> ${newPlan}`);
      return this.toResponseDto(updatedSubscription);
    } catch (error) {
      this.logger.error(
        `Erro ao fazer downgrade da subscription ${tenantId}: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async cancel(tenantId: string): Promise<SubscriptionResponseDto> {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { tenantId },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription não encontrada');
      }

      const updatedSubscription = await this.prisma.subscription.update({
        where: { tenantId },
        data: { status: SubscriptionStatus.CANCELLED },
      });

      this.logger.log(`Subscription cancelada: ${tenantId}`);
      return this.toResponseDto(updatedSubscription);
    } catch (error) {
      this.logger.error(
        `Erro ao cancelar subscription ${tenantId}: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async reactivate(tenantId: string): Promise<SubscriptionResponseDto> {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { tenantId },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription não encontrada');
      }

      const updatedSubscription = await this.prisma.subscription.update({
        where: { tenantId },
        data: { status: SubscriptionStatus.ACTIVE },
      });

      this.logger.log(`Subscription reativada: ${tenantId}`);
      return this.toResponseDto(updatedSubscription);
    } catch (error) {
      this.logger.error(
        `Erro ao reativar subscription ${tenantId}: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  getAvailablePlans(): Array<{
    id: SubscriptionPlan;
    name: string;
    price: { monthly: number; annual: number };
    limits: unknown;
  }> {
    return [
      {
        id: SubscriptionPlan.WORKSHOPS_STARTER,
        name: 'Starter',
        price: { monthly: 99, annual: 990 },
        limits: this.planLimits[SubscriptionPlan.WORKSHOPS_STARTER],
      },
      {
        id: SubscriptionPlan.WORKSHOPS_PROFESSIONAL,
        name: 'Professional',
        price: { monthly: 299, annual: 2990 },
        limits: this.planLimits[SubscriptionPlan.WORKSHOPS_PROFESSIONAL],
      },
      {
        id: SubscriptionPlan.WORKSHOPS_ENTERPRISE,
        name: 'Enterprise',
        price: { monthly: 999, annual: 9990 },
        limits: this.planLimits[SubscriptionPlan.WORKSHOPS_ENTERPRISE],
      },
    ];
  }

  // Helper methods
  private getPlanOrder(plan: SubscriptionPlan): number {
    const order = {
      [SubscriptionPlan.WORKSHOPS_STARTER]: 1,
      [SubscriptionPlan.WORKSHOPS_PROFESSIONAL]: 2,
      [SubscriptionPlan.WORKSHOPS_ENTERPRISE]: 3,
    };
    return order[plan] || 0;
  }

  /**
   * Obtém lista de features habilitadas para um plano
   * Usa o FeatureFlagsService para garantir consistência
   */
  private getEnabledFeaturesForPlan(plan: string): string[] {
    // Mapear nome do plano para o formato usado no FeatureFlagsService
    const planMapping: Record<string, string> = {
      [SubscriptionPlan.WORKSHOPS_STARTER]: 'workshops_starter',
      [SubscriptionPlan.WORKSHOPS_PROFESSIONAL]: 'workshops_professional',
      [SubscriptionPlan.WORKSHOPS_ENTERPRISE]: 'workshops_enterprise',
    };

    const featureFlagsPlan = planMapping[plan] || plan;

    // Lista de todas as features possíveis
    const allFeatures: string[] = [
      'elevators',
      'inventory',
      'service_orders',
      'quotes',
      'customers',
      'vehicles',
      'appointments',
      'bodywork',
      'diagnostics',
      'reports',
      'suppliers',
      'parts_catalog',
      'documents',
      'invoices',
      'payments',
      'vehicle_history',
      'automations',
    ];

    // Verificar cada feature usando o FeatureFlagsService
    const enabledFeatures: string[] = [];

    // Usar método público do FeatureFlagsService
    try {
      const planFeatures =
        this.featureFlagsService.getEnabledFeaturesForPlan(featureFlagsPlan);
      for (const featureName of allFeatures) {
        const config = planFeatures[featureName];
        if (config?.enabled) {
          enabledFeatures.push(featureName);
        }
      }
    } catch (error) {
      this.logger.warn(
        `Erro ao obter features do FeatureFlagsService: ${getErrorMessage(error)}`,
      );
      return this.planLimits[plan as SubscriptionPlan]?.features || [];
    }

    this.logger.log(
      `Features habilitadas para plano ${plan}: ${enabledFeatures.join(', ')}`,
    );

    return enabledFeatures;
  }

  private toResponseDto(subscription: {
    id: string;
    tenantId: string;
    plan: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    activeFeatures: string[];
    serviceOrdersLimit: number | null;
    serviceOrdersUsed: number;
    partsLimit: number | null;
    stripeSubscriptionId: string | null;
    stripeCustomerId: string | null;
    billingCycle: string;
    createdAt: Date;
    updatedAt: Date;
  }): SubscriptionResponseDto {
    return {
      id: subscription.id,
      tenantId: subscription.tenantId,
      plan: subscription.plan as SubscriptionPlan,
      status: subscription.status as SubscriptionStatus,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      activeFeatures: subscription.activeFeatures || [],
      serviceOrdersLimit: subscription.serviceOrdersLimit,
      serviceOrdersUsed: subscription.serviceOrdersUsed || 0,
      partsLimit: subscription.partsLimit,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      stripeCustomerId: subscription.stripeCustomerId,
      billingCycle: subscription.billingCycle as BillingCycle,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }
}
