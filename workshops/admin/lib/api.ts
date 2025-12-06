import axios from 'axios';

// API base para o painel admin
const apiUrl = typeof globalThis.window !== 'undefined' 
  ? (globalThis.window as Window & { __NEXT_PUBLIC_API_URL__?: string }).__NEXT_PUBLIC_API_URL__ 
    || process.env.NEXT_PUBLIC_API_URL 
    || 'http://localhost:3001'
  : 'http://localhost:3001';

const api = axios.create({
  baseURL: `${apiUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-Subdomain': 'system', // Tenant especial para o painel admin
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use((config) => {
  if (typeof globalThis.window !== 'undefined') {
    const token = globalThis.window.localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  // Garantir que o header X-Tenant-Subdomain está sempre presente
  config.headers['X-Tenant-Subdomain'] = 'system';
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof globalThis.window !== 'undefined') {
        globalThis.window.localStorage.removeItem('adminToken');
        globalThis.window.localStorage.removeItem('adminUser');
        globalThis.window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ========================
// TENANTS API
// ========================

export interface Tenant {
  id: string;
  name: string;
  documentType: 'cpf' | 'cnpj';
  document: string;
  subdomain: string;
  plan: string;
  status: 'pending' | 'active' | 'suspended' | 'cancelled';
  adminEmail?: string;
  subscription?: {
    id: string;
    plan: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantDto {
  name: string;
  documentType: 'cpf' | 'cnpj';
  document: string;
  subdomain: string;
  plan?: string;
  adminEmail?: string;
  adminName?: string;
  adminPassword?: string;
}

export const tenantsApi = {
  findAll: async (): Promise<Tenant[]> => {
    const response = await api.get<Tenant[]>('/tenants');
    return response.data;
  },

  findOne: async (id: string): Promise<Tenant> => {
    const response = await api.get<Tenant>(`/tenants/${id}`);
    return response.data;
  },

  create: async (data: CreateTenantDto): Promise<Tenant> => {
    const response = await api.post<Tenant>('/tenants', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateTenantDto>): Promise<Tenant> => {
    const response = await api.patch<Tenant>(`/tenants/${id}`, data);
    return response.data;
  },

  activate: async (id: string): Promise<Tenant> => {
    const response = await api.post<Tenant>(`/tenants/${id}/activate`);
    return response.data;
  },

  suspend: async (id: string): Promise<Tenant> => {
    const response = await api.post<Tenant>(`/tenants/${id}/suspend`);
    return response.data;
  },

  cancel: async (id: string): Promise<Tenant> => {
    const response = await api.post<Tenant>(`/tenants/${id}/cancel`);
    return response.data;
  },
};

// ========================
// BILLING API
// ========================

export interface Plan {
  id: string;
  code?: string;
  name: string;
  description?: string;
  price: { monthly: number; yearly?: number; annual?: number };
  monthlyPrice?: number;
  annualPrice?: number;
  features?: string[];
  limits?: { 
    serviceOrders?: number; 
    users?: number; 
    parts?: number;
    serviceOrdersLimit?: number | null;
    usersLimit?: number | null;
    partsLimit?: number | null;
    features?: string[];
  };
  serviceOrdersLimit?: number | null;
  partsLimit?: number | null;
  usersLimit?: number | null;
  isActive?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
  highlightText?: string | null;
  stripePriceIdMonthly?: string | null;
  stripePriceIdAnnual?: string | null;
  stripeProductId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePlanDto {
  code: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  annualPrice: number;
  serviceOrdersLimit?: number | null;
  partsLimit?: number | null;
  usersLimit?: number | null;
  features: string[];
  isActive?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
  highlightText?: string;
  stripePriceIdMonthly?: string;
  stripePriceIdAnnual?: string;
  stripeProductId?: string;
}

export const billingApi = {
  getPlans: async (): Promise<Plan[]> => {
    const response = await api.get<Plan[]>('/billing/plans');
    return response.data;
  },
};

// ========================
// PLANS API (CRUD)
// ========================

export const plansApi = {
  findAll: async (includeInactive = false): Promise<Plan[]> => {
    const response = await api.get<Plan[]>('/plans', { params: { includeInactive } });
    return response.data;
  },

  findOne: async (id: string): Promise<Plan> => {
    const response = await api.get<Plan>(`/plans/${id}`);
    return response.data;
  },

  findByCode: async (code: string): Promise<Plan> => {
    const response = await api.get<Plan>(`/plans/code/${code}`);
    return response.data;
  },

  create: async (data: CreatePlanDto): Promise<Plan> => {
    const response = await api.post<Plan>('/plans', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreatePlanDto>): Promise<Plan> => {
    const response = await api.patch<Plan>(`/plans/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/plans/${id}`);
  },

  getStats: async (): Promise<{
    totalPlans: number;
    activePlans: number;
    totalSubscriptions: number;
    subscriptionsByPlan: Array<{ planId: string; planName: string; count: number }>;
  }> => {
    const response = await api.get('/plans/stats');
    return response.data;
  },
};

// ========================
// AUDIT API
// ========================

export interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string;
  user?: { id: string; name: string; email: string };
  action: string;
  resource: string;
  resourceId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface AuditFilters {
  action?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const auditApi = {
  findAll: async (filters?: AuditFilters) => {
    const response = await api.get<{ data: AuditLog[]; total: number; totalPages: number }>('/audit', { params: filters });
    return response.data;
  },
};

// ========================
// JOBS API
// ========================

export interface Job {
  id: string;
  tenantId: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  data?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  completedAt?: string;
}

export const jobsApi = {
  findAll: async (filters?: { type?: string; status?: string; page?: number; limit?: number }) => {
    const response = await api.get<{ data: Job[]; total: number; totalPages: number }>('/jobs', { params: filters });
    return response.data;
  },
};

// ========================
// WEBHOOKS API
// ========================

export interface Webhook {
  id: string;
  tenantId: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  failureCount: number;
  lastTriggeredAt?: string;
  createdAt: string;
}

export const webhooksApi = {
  findAll: async (): Promise<Webhook[]> => {
    const response = await api.get<Webhook[]>('/webhooks');
    return response.data;
  },

  create: async (data: { name: string; url: string; events: string[] }): Promise<Webhook> => {
    const response = await api.post<Webhook>('/webhooks', data);
    return response.data;
  },

  update: async (id: string, data: Partial<{ name: string; url: string; events: string[]; isActive: boolean }>): Promise<Webhook> => {
    const response = await api.patch<Webhook>(`/webhooks/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/webhooks/${id}`);
  },
};

// ========================
// INTEGRATIONS API
// ========================

export interface Integration {
  id: string;
  tenantId: string;
  type: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  config: Record<string, unknown>;
  lastSyncAt?: string;
  lastError?: string;
  createdAt: string;
}

export const integrationsApi = {
  findAll: async (): Promise<Integration[]> => {
    const response = await api.get<Integration[]>('/integrations');
    return response.data;
  },

  create: async (data: { type: string; name: string; config: Record<string, unknown> }): Promise<Integration> => {
    const response = await api.post<Integration>('/integrations', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Integration>): Promise<Integration> => {
    const response = await api.patch<Integration>(`/integrations/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/integrations/${id}`);
  },

  test: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(`/integrations/${id}/test`);
    return response.data;
  },
};

// ========================
// AUTOMATIONS API
// ========================

export interface Automation {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  trigger: string;
  actions: { type: string; config: Record<string, unknown> }[];
  status: 'active' | 'inactive' | 'error';
  executionCount: number;
  lastExecutedAt?: string;
  createdAt: string;
}

export const automationsApi = {
  findAll: async (): Promise<Automation[]> => {
    const response = await api.get<Automation[]>('/automations');
    return response.data;
  },

  create: async (data: { name: string; trigger: string; actions: { type: string; config: Record<string, unknown> }[] }): Promise<Automation> => {
    const response = await api.post<Automation>('/automations', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Automation>): Promise<Automation> => {
    const response = await api.patch<Automation>(`/automations/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/automations/${id}`);
  },

  execute: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(`/automations/${id}/execute`);
    return response.data;
  },
};

