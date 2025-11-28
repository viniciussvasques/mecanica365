import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

export type FeatureName =
  | 'elevators'
  | 'inventory'
  | 'service_orders'
  | 'quotes'
  | 'customers'
  | 'vehicles'
  | 'appointments'
  | 'bodywork'
  | 'diagnostics'
  | 'reports'
  | 'suppliers'
  | 'parts_catalog'
  | 'documents'
  | 'invoices'
  | 'payments'
  | 'vehicle_history'
  | 'automations';

export interface FeatureConfig {
  enabled: boolean;
  limit?: number;
  unlimited?: boolean;
}

export interface FeatureLimits {
  [key: string]: FeatureConfig;
}

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);

  // Matriz de features por plano
  private readonly featureMatrix: Record<string, FeatureLimits> = {
    workshops_starter: {
      elevators: { enabled: true, limit: 2 },
      inventory: { enabled: true, limit: 100 },
      service_orders: { enabled: true, limit: 50 }, // por mês
      quotes: { enabled: true, unlimited: true },
      customers: { enabled: true, limit: 100 },
      vehicles: { enabled: true, unlimited: true },
      appointments: { enabled: true, unlimited: true },
      bodywork: { enabled: true, unlimited: true },
      diagnostics: { enabled: false },
      reports: { enabled: false },
      suppliers: { enabled: false },
      parts_catalog: { enabled: false },
      documents: { enabled: true, unlimited: true },
      invoices: { enabled: true, unlimited: true },
      payments: { enabled: true, unlimited: true },
      vehicle_history: { enabled: true, unlimited: true },
      automations: { enabled: true, unlimited: true },
    },
    workshops_professional: {
      elevators: { enabled: true, unlimited: true },
      inventory: { enabled: true, unlimited: true },
      service_orders: { enabled: true, unlimited: true },
      quotes: { enabled: true, unlimited: true },
      customers: { enabled: true, unlimited: true },
      vehicles: { enabled: true, unlimited: true },
      appointments: { enabled: true, unlimited: true },
      bodywork: { enabled: true, unlimited: true },
      diagnostics: { enabled: true, unlimited: true },
      reports: { enabled: true, unlimited: true },
      suppliers: { enabled: true, unlimited: true },
      parts_catalog: { enabled: true, unlimited: true },
      documents: { enabled: true, unlimited: true },
      invoices: { enabled: true, unlimited: true },
      payments: { enabled: true, unlimited: true },
      vehicle_history: { enabled: true, unlimited: true },
      automations: { enabled: true, unlimited: true },
    },
    workshops_enterprise: {
      elevators: { enabled: true, unlimited: true },
      inventory: { enabled: true, unlimited: true },
      service_orders: { enabled: true, unlimited: true },
      quotes: { enabled: true, unlimited: true },
      customers: { enabled: true, unlimited: true },
      vehicles: { enabled: true, unlimited: true },
      appointments: { enabled: true, unlimited: true },
      bodywork: { enabled: true, unlimited: true },
      diagnostics: { enabled: true, unlimited: true },
      reports: { enabled: true, unlimited: true },
      suppliers: { enabled: true, unlimited: true },
      parts_catalog: { enabled: true, unlimited: true },
      documents: { enabled: true, unlimited: true },
      invoices: { enabled: true, unlimited: true },
      payments: { enabled: true, unlimited: true },
      vehicle_history: { enabled: true, unlimited: true },
      automations: { enabled: true, unlimited: true },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verifica se uma feature está habilitada para um tenant
   */
  async isFeatureEnabled(
    tenantId: string,
    feature: FeatureName,
  ): Promise<boolean> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { subscription: true },
      });

      if (!tenant) {
        this.logger.warn(`Tenant não encontrado: ${tenantId}`);
        return false;
      }

      const plan = tenant.subscription?.plan || tenant.plan;
      const featureConfig = this.getFeatureConfig(plan, feature);

      return featureConfig?.enabled || false;
    } catch (error) {
      this.logger.error(
        `Erro ao verificar feature ${feature} para tenant ${tenantId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Obtém o limite de uma feature para um tenant
   */
  async getFeatureLimit(
    tenantId: string,
    feature: FeatureName,
  ): Promise<number | null> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { subscription: true },
      });

      if (!tenant) {
        return null;
      }

      const plan = tenant.subscription?.plan || tenant.plan;
      const featureConfig = this.getFeatureConfig(plan, feature);

      if (!featureConfig?.enabled) {
        return null;
      }

      if (featureConfig.unlimited) {
        return null; // null = ilimitado
      }

      return featureConfig.limit || null;
    } catch (error) {
      this.logger.error(
        `Erro ao obter limite de ${feature} para tenant ${tenantId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Verifica se o tenant pode usar a feature (está habilitada e dentro do limite)
   */
  async checkFeatureAccess(
    tenantId: string,
    feature: FeatureName,
    currentCount?: number,
  ): Promise<{ allowed: boolean; reason?: string; limit?: number }> {
    const enabled = await this.isFeatureEnabled(tenantId, feature);

    if (!enabled) {
      return {
        allowed: false,
        reason: `Feature ${feature} não está habilitada para este plano`,
      };
    }

    const limit = await this.getFeatureLimit(tenantId, feature);

    // Se não tem limite, está liberado
    if (limit === null) {
      return { allowed: true };
    }

    // Se tem limite e não passou o count atual, verificar
    if (currentCount !== undefined && currentCount >= limit) {
      return {
        allowed: false,
        reason: `Limite de ${limit} atingido para ${feature}`,
        limit,
      };
    }

    return { allowed: true, limit };
  }

  /**
   * Obtém todas as features disponíveis para um tenant
   */
  async getTenantFeatures(
    tenantId: string,
  ): Promise<Record<string, FeatureConfig>> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { subscription: true },
      });

      if (!tenant) {
        return {};
      }

      const plan = tenant.subscription?.plan || tenant.plan;
      return this.featureMatrix[plan] || {};
    } catch (error) {
      this.logger.error(
        `Erro ao obter features para tenant ${tenantId}:`,
        error,
      );
      return {};
    }
  }

  /**
   * Obtém todas as features habilitadas para um plano (método público)
   */
  getEnabledFeaturesForPlan(plan: string): Record<string, FeatureConfig> {
    return this.featureMatrix[plan] || {};
  }

  /**
   * Obtém a configuração de uma feature para um plano
   */
  private getFeatureConfig(
    plan: string,
    feature: FeatureName,
  ): FeatureConfig | null {
    const planFeatures = this.featureMatrix[plan];
    if (!planFeatures) {
      this.logger.warn(`Plano não encontrado: ${plan}`);
      return null;
    }

    return planFeatures[feature] || null;
  }

  /**
   * Valida se um plano existe
   */
  isValidPlan(plan: string): boolean {
    return plan in this.featureMatrix;
  }

  /**
   * Lista todos os planos disponíveis
   */
  getAvailablePlans(): string[] {
    return Object.keys(this.featureMatrix);
  }
}
