import axios from 'axios';

// Função para obter a URL base da API com subdomain (apenas no cliente)
const getApiUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  // Verificar se estamos no cliente (localStorage só existe no browser)
  if (typeof window === 'undefined') {
    return `${baseUrl}/api`;
  }
  
  const subdomain = localStorage.getItem('subdomain');
  
  // Se houver subdomain, usar no host (ex: oficinartee.localhost:3001)
  if (subdomain && baseUrl.includes('localhost')) {
    return `http://${subdomain}.localhost:3001/api`;
  }
  
  // Caso contrário, usar URL padrão
  return `${baseUrl}/api`;
};

const api = axios.create({
  baseURL: typeof window !== 'undefined' ? getApiUrl() : 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para configurar URL dinamicamente
api.interceptors.request.use((config) => {
  // Atualizar baseURL dinamicamente (apenas no cliente)
  if (typeof window !== 'undefined') {
    config.baseURL = getApiUrl();
  }
  
  // Token e subdomain só no cliente
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Adicionar subdomain no header também (fallback)
    const subdomain = localStorage.getItem('subdomain');
    if (subdomain) {
      config.headers['X-Tenant-Subdomain'] = subdomain;
    }
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
      // Para find-tenant, usar URL sem subdomain (rota pública)
      // Garantir que baseUrl não tenha /api duplicado
      let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      // Remover /api do final se existir
      baseUrl = baseUrl.replace(/\/api\/?$/, '');
      // Construir URL completa
      const apiUrl = `${baseUrl}/api/auth/find-tenant`;
      console.log('[authApi] Buscando tenant em:', apiUrl);
      const response = await axios.post(apiUrl, { email });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number }; message?: string };
      // Se não encontrar tenant (404) ou erro de rede, retornar null
      if (axiosError.response?.status === 404 || !axiosError.response) {
        return null;
      }
      // Para outros erros, retornar null também para não bloquear o login
      console.warn('Erro ao buscar tenant:', axiosError.message);
      return null;
    }
  },

  login: async (subdomain: string, data: { email: string; password: string }) => {
    // Para login, usar URL com subdomain
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const apiUrl = subdomain && baseUrl.includes('localhost') 
      ? `http://${subdomain}.localhost:3001/api`
      : `${baseUrl}/api`;
    
    const response = await axios.post(`${apiUrl}/auth/login`, data, {
      headers: {
        'X-Tenant-Subdomain': subdomain,
      },
    });
    return response.data;
  },

  forgotPassword: async (data: { email: string }) => {
    // Usar URL com subdomain se disponível
    const subdomain = typeof window !== 'undefined' ? localStorage.getItem('subdomain') : null;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const apiUrl = subdomain && baseUrl.includes('localhost')
      ? `http://${subdomain}.localhost:3001/api`
      : `${baseUrl}/api`;

    const response = await axios.post(`${apiUrl}/auth/forgot-password`, data, {
      headers: subdomain ? { 'X-Tenant-Subdomain': subdomain } : {},
    });
    return response.data;
  },

  resetPassword: async (data: { token: string; newPassword: string }) => {
    // Reset password é público, usar URL base
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const apiUrl = `${baseUrl.replace(/\/api\/?$/, '')}/api`;

    const response = await axios.post(`${apiUrl}/auth/reset-password`, data);
    return response.data;
  },

  validateResetToken: async (token: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const apiUrl = `${baseUrl.replace(/\/api\/?$/, '')}/api`;

    const response = await axios.get(`${apiUrl}/auth/validate-reset-token?token=${token}`);
    return response.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    const response = await api.patch('/auth/change-password', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  logout: async (refreshToken: string) => {
    const response = await api.post('/auth/logout', { refreshToken });
    return response.data;
  },

  refresh: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },
};

export default api;
