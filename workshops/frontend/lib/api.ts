import axios from 'axios';

// Função para obter a URL base da API com subdomain
const getApiUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const subdomain = localStorage.getItem('subdomain');
  
  // Se houver subdomain, usar no host (ex: oficinartee.localhost:3001)
  if (subdomain && baseUrl.includes('localhost')) {
    return `http://${subdomain}.localhost:3001/api`;
  }
  
  // Caso contrário, usar URL padrão
  return `${baseUrl}/api`;
};

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para configurar URL dinamicamente
api.interceptors.request.use((config) => {
  config.baseURL = getApiUrl();
  
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Adicionar subdomain no header também (fallback)
  const subdomain = localStorage.getItem('subdomain');
  if (subdomain) {
    config.headers['X-Tenant-Subdomain'] = subdomain;
  }
  
  return config;
});

export interface RegisterData {
  name: string;
  email: string;
  documentType: 'cpf' | 'cnpj';
  document: string;
  subdomain: string;
  plan: 'workshops_starter' | 'workshops_professional' | 'workshops_enterprise';
  password?: string;
}

// Os valores dos planos são os mesmos em TenantPlan e SubscriptionPlan
export type PlanType = 'workshops_starter' | 'workshops_professional' | 'workshops_enterprise';

export interface CheckoutData {
  tenantId: string;
  plan: 'workshops_starter' | 'workshops_professional' | 'workshops_enterprise';
  billingCycle?: 'monthly' | 'annual';
}

export interface LoginData {
  email: string;
  password: string;
  subdomain: string;
}

export const onboardingApi = {
  register: async (data: RegisterData) => {
    const response = await api.post('/onboarding/register', data);
    return response.data;
  },

  checkout: async (data: CheckoutData) => {
    const response = await api.post('/onboarding/checkout', data);
    return response.data;
  },

  checkStatus: async (document: string, email: string) => {
    const response = await api.post('/onboarding/check-status', {
      document,
      email,
    });
    return response.data;
  },
};

export const authApi = {
  findTenantByEmail: async (email: string) => {
    try {
      const response = await api.post('/auth/find-tenant', { email });
      return response.data;
    } catch (error: any) {
      // Se não encontrar tenant (404) ou erro de rede, retornar null
      if (error.response?.status === 404 || !error.response) {
        return null;
      }
      // Para outros erros, retornar null também para não bloquear o login
      console.warn('Erro ao buscar tenant:', error.message);
      return null;
    }
  },

  login: async (subdomain: string, data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data, {
      headers: {
        'X-Tenant-Subdomain': subdomain,
      },
    });
    return response.data;
  },
};

export default api;
