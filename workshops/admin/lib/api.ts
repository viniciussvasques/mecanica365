import axios from 'axios';

// API base para o painel admin
const apiUrl = typeof globalThis.window !== 'undefined' 
  ? (globalThis.window as Window & { __NEXT_PUBLIC_API_URL__?: string }).__NEXT_PUBLIC_API_URL__ 
    || process.env.NEXT_PUBLIC_API_URL 
    || 'http://localhost:3001'
  : 'http://localhost:3001';

// Garantir que a URL não tenha /api duplicado
const baseUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;

const api = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
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
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Só desloga em caso de token inválido/expirado (mensagens específicas do backend)
    if (error.response?.status === 401 && typeof globalThis.window !== 'undefined') {
      const message = error.response?.data?.message || '';
      const isTokenError = message.includes('Token') || 
                          message.includes('token') ||
                          message.includes('expirado') ||
                          message.includes('inválido');
      
      if (isTokenError) {
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
// DASHBOARD API
// ========================

export interface DashboardSummary {
  tenants: {
    total: number;
    active: number;
    suspended: number;
    canceled: number;
    newLast30Days: number;
  };
  users: {
    total: number;
    active: number;
  };
  subscriptions: {
    active: number;
    byPlan: Array<{ plan: string; count: number }>;
  };
  revenue: {
    total: number;
    last30Days: number;
  };
  operations: {
    serviceOrdersLast30Days: number;
  };
  support: {
    total: number;
    open: number;
  };
  jobs: {
    total: number;
    failed: number;
  };
  recentActivity: Array<{
    id: string;
    userId: string;
    action: string;
    tenantId?: string;
    createdAt: string;
    user?: {
      email: string;
    };
    tenant?: {
      name: string;
    };
  }>;
}

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get<DashboardSummary>('/admin/dashboard/summary');
    return response.data;
  },
};

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
    const response = await api.get<Tenant[]>('/admin/tenants');
    return response.data;
  },

  findOne: async (id: string): Promise<Tenant> => {
    const response = await api.get<Tenant>(`/admin/tenants/${id}`);
    return response.data;
  },

  create: async (data: CreateTenantDto): Promise<Tenant> => {
    const response = await api.post<Tenant>('/admin/tenants', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateTenantDto>): Promise<Tenant> => {
    const response = await api.patch<Tenant>(`/admin/tenants/${id}`, data);
    return response.data;
  },

  activate: async (id: string): Promise<Tenant> => {
    const response = await api.post<Tenant>(`/admin/tenants/${id}/activate`);
    return response.data;
  },

  suspend: async (id: string): Promise<Tenant> => {
    const response = await api.post<Tenant>(`/admin/tenants/${id}/suspend`);
    return response.data;
  },

  cancel: async (id: string): Promise<Tenant> => {
    const response = await api.post<Tenant>(`/admin/tenants/${id}/cancel`);
    return response.data;
  },

  getUsers: async (tenantId: string): Promise<Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  }>> => {
    const response = await api.get(`/admin/tenants/${tenantId}/users`);
    return response.data;
  },

  resetUserPassword: async (tenantId: string, userId: string): Promise<{ message: string; tempPassword: string }> => {
    const response = await api.post(`/admin/tenants/${tenantId}/users/${userId}/reset-password`);
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
    const response = await api.get<Plan[]>('/admin/plans');
    return response.data;
  },
};

// ========================
// PLANS API (CRUD)
// ========================

export const plansApi = {
  findAll: async (includeInactive = false): Promise<Plan[]> => {
    const response = await api.get<Plan[]>('/admin/plans', { params: { includeInactive } });
    return response.data;
  },

  findOne: async (id: string): Promise<Plan> => {
    const response = await api.get<Plan>(`/admin/plans/${id}`);
    return response.data;
  },

  findByCode: async (code: string): Promise<Plan> => {
    const response = await api.get<Plan>(`/admin/plans/code/${code}`);
    return response.data;
  },

  create: async (data: CreatePlanDto): Promise<Plan> => {
    const response = await api.post<Plan>('/admin/plans', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreatePlanDto>): Promise<Plan> => {
    const response = await api.patch<Plan>(`/admin/plans/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/admin/plans/${id}`);
  },

  getStats: async (): Promise<{
    totalPlans: number;
    activePlans: number;
    totalSubscriptions: number;
    subscriptionsByPlan: Array<{ planId: string; planName: string; count: number }>;
  }> => {
    const response = await api.get('/admin/plans/stats');
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
  resourceType?: string;
  resource?: string; // Mantido para compatibilidade, mas será mapeado para resourceType
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const auditApi = {
  findAll: async (filters?: AuditFilters) => {
    // Mapear 'resource' para 'resourceType' se presente
    const params: Record<string, unknown> = { ...filters };
    if (params.resource && !params.resourceType) {
      params.resourceType = params.resource;
      delete params.resource;
    }
    const response = await api.get<{ data: AuditLog[]; total: number; totalPages: number }>('/admin/audit', { params });
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
    const response = await api.get<{ data: Job[]; total: number; totalPages: number }>('/admin/jobs', { params: filters });
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

// ========================
// BACKUP API
// ========================

export interface Backup {
  id: string;
  tenantId?: string;
  type: 'full' | 'incremental';
  status: 'in_progress' | 'success' | 'failed';
  size?: bigint;
  path?: string;
  s3Key?: string;
  encrypted: boolean;
  startedAt: string;
  completedAt?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface BackupStatus {
  total: number;
  success: number;
  failed: number;
  inProgress: number;
  expired: number;
}

export interface BackupFilters {
  tenantId?: string;
  type?: 'full' | 'incremental';
  status?: 'in_progress' | 'success' | 'failed';
  startDate?: string;
  endDate?: string;
  page?: string;
  limit?: string;
}

export const backupApi = {
  findAll: async (filters?: BackupFilters): Promise<{ backups: Backup[]; total: number }> => {
    const params = new URLSearchParams();
    if (filters?.tenantId) params.append('tenantId', filters.tenantId);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.page) params.append('page', filters.page);
    if (filters?.limit) params.append('limit', filters.limit);
    
    const response = await api.get<{ backups: Backup[]; total: number }>(`/backup?${params.toString()}`);
    return response.data;
  },

  findOne: async (id: string): Promise<Backup> => {
    const response = await api.get<Backup>(`/backup/${id}`);
    return response.data;
  },

  create: async (data: { type: 'full' | 'incremental'; encrypted?: boolean; retentionDays?: number }): Promise<Backup> => {
    const response = await api.post<Backup>('/backup', data);
    return response.data;
  },

  restore: async (id: string, data?: { testRestore?: boolean }): Promise<{ id: string; status: string }> => {
    const response = await api.post<{ id: string; status: string }>(`/backup/${id}/restore`, data || {});
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/backup/${id}`);
  },

  getStatus: async (): Promise<BackupStatus> => {
    const response = await api.get<BackupStatus>('/backup/status');
    return response.data;
  },
};

