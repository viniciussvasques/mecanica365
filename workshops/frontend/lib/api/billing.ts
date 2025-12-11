import axios from 'axios';
import { getApiUrl, isClient } from '../utils/api.utils';
import { setupRequestInterceptor, setupSimpleResponseInterceptor } from '../utils/api-interceptors';

const api = axios.create({
  baseURL: isClient() ? getApiUrl() : 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configurar interceptors compartilhados
setupRequestInterceptor(api);
setupSimpleResponseInterceptor(api);

export type PlanCode = 'workshops_starter' | 'workshops_professional' | 'workshops_enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing' | 'incomplete';
export type BillingCycle = 'monthly' | 'annual';

export interface Plan {
  id: string;
  code: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  annualPrice: number;
  serviceOrdersLimit: number | null;
  partsLimit: number | null;
  usersLimit: number | null;
  features: string[];
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  highlightText?: string | null;
  price: {
    monthly: number;
    annual: number;
  };
  limits: {
    serviceOrdersLimit: number | null;
    partsLimit: number | null;
    usersLimit: number | null;
    features: string[];
  };
}

export interface Subscription {
  id: string;
  tenantId: string;
  plan: PlanCode;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  activeFeatures: string[];
  serviceOrdersLimit: number | null;
  serviceOrdersUsed: number;
  partsLimit: number | null;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  billingCycle: BillingCycle;
  createdAt: string;
  updatedAt: string;
}

export interface UsageStats {
  serviceOrders: {
    used: number;
    limit: number | null;
    percentage: number | null;
  };
  users: {
    used: number;
    limit: number | null;
    percentage: number | null;
  };
  parts: {
    used: number;
    limit: number | null;
    percentage: number | null;
  };
}

type ApiPlanResponse = {
  id?: string;
  code?: string;
  name: string;
  description?: string | null;
  monthlyPrice?: number | null;
  annualPrice?: number | null;
  serviceOrdersLimit?: number | null;
  partsLimit?: number | null;
  usersLimit?: number | null;
  features?: string[] | null;
  highlightText?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder?: number | null;
  price?: {
    monthly?: number | null;
    annual?: number | null;
  };
  limits?: {
    serviceOrdersLimit?: number | null;
    partsLimit?: number | null;
    usersLimit?: number | null;
    features?: string[] | null;
  };
};

export const billingApi = {
  // Obter assinatura atual
  getSubscription: async (): Promise<Subscription> => {
    const response = await api.get<Subscription>('/billing/subscription');
    return response.data;
  },

  // Listar planos disponíveis
  getPlans: async (): Promise<Plan[]> => {
    const response = await api.get<ApiPlanResponse[]>('/billing/plans');
    return response.data.map((plan, index) => {
      const monthlyPrice =
        plan.monthlyPrice ?? plan.price?.monthly ?? 0;
      const annualPrice =
        plan.annualPrice ?? plan.price?.annual ?? 0;
      const serviceOrdersLimit =
        plan.serviceOrdersLimit ?? plan.limits?.serviceOrdersLimit ?? null;
      const partsLimit =
        plan.partsLimit ?? plan.limits?.partsLimit ?? null;
      const usersLimit =
        plan.usersLimit ?? plan.limits?.usersLimit ?? null;
      const features =
        plan.features ?? plan.limits?.features ?? [];

      return {
        id: plan.id ?? plan.code ?? plan.name,
        code: (plan.code ?? plan.id ?? plan.name) as PlanCode,
        name: plan.name,
        description: plan.description ?? undefined,
        monthlyPrice,
        annualPrice,
        serviceOrdersLimit,
        partsLimit,
        usersLimit,
        features,
        isActive: plan.isActive ?? true,
        isDefault: plan.isDefault ?? false,
        sortOrder: plan.sortOrder ?? index,
        highlightText: plan.highlightText ?? undefined,
        price: {
          monthly: monthlyPrice,
          annual: annualPrice,
        },
        limits: {
          serviceOrdersLimit,
          partsLimit,
          usersLimit,
          features,
        },
      };
    });
  },

  // Fazer upgrade de plano
  upgrade: async (newPlan: PlanCode): Promise<Subscription> => {
    const response = await api.post<Subscription>('/billing/subscription/upgrade', {
      newPlan,
    });
    return response.data;
  },

  // Fazer downgrade de plano
  downgrade: async (newPlan: PlanCode): Promise<Subscription> => {
    const response = await api.post<Subscription>('/billing/subscription/downgrade', {
      newPlan,
    });
    return response.data;
  },

  // Cancelar assinatura
  cancel: async (): Promise<Subscription> => {
    const response = await api.post<Subscription>('/billing/subscription/cancel');
    return response.data;
  },

  // Reativar assinatura
  reactivate: async (): Promise<Subscription> => {
    const response = await api.post<Subscription>('/billing/subscription/reactivate');
    return response.data;
  },

  // Atualizar ciclo de cobrança
  updateBillingCycle: async (billingCycle: BillingCycle): Promise<Subscription> => {
    const response = await api.patch<Subscription>('/billing/subscription', {
      billingCycle,
    });
    return response.data;
  },
};

// Funções auxiliares
export const getPlanDisplayName = (planCode: PlanCode): string => {
  const names: Record<PlanCode, string> = {
    workshops_starter: 'Starter',
    workshops_professional: 'Professional',
    workshops_enterprise: 'Enterprise',
  };
  return names[planCode] || planCode;
};

export const getStatusDisplayName = (status: SubscriptionStatus): string => {
  const names: Record<SubscriptionStatus, string> = {
    active: 'Ativo',
    cancelled: 'Cancelado',
    past_due: 'Pagamento Atrasado',
    trialing: 'Período de Teste',
    incomplete: 'Incompleto',
  };
  return names[status] || status;
};

export const getStatusColor = (status: SubscriptionStatus): string => {
  const colors: Record<SubscriptionStatus, string> = {
    active: 'text-[#4ADE80] bg-[#4ADE80]/10',
    cancelled: 'text-[#EF4444] bg-[#EF4444]/10',
    past_due: 'text-[#F59E0B] bg-[#F59E0B]/10',
    trialing: 'text-[#3B82F6] bg-[#3B82F6]/10',
    incomplete: 'text-[#6B7280] bg-[#6B7280]/10',
  };
  return colors[status] || 'text-gray-500 bg-gray-500/10';
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Features legíveis
export const FEATURE_LABELS: Record<string, string> = {
  basic_service_orders: 'Ordens de Serviço',
  basic_customers: 'Gestão de Clientes',
  advanced_reports: 'Relatórios Avançados',
  multiple_locations: 'Múltiplas Localizações',
  api_access: 'Acesso à API',
  white_label: 'White Label',
  priority_support: 'Suporte Prioritário',
  custom_integrations: 'Integrações Customizadas',
  elevators: 'Elevadores',
  inventory: 'Inventário',
  quotes: 'Orçamentos',
  appointments: 'Agendamentos',
  invoices: 'Faturas',
  payments: 'Pagamentos',
  automations: 'Automações',
};

export const getFeatureLabel = (feature: string): string => {
  return FEATURE_LABELS[feature] || feature;
};

