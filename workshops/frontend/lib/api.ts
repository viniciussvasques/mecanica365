import axios from 'axios';
import { logger } from './utils/logger';
import { clearAuthData, isAxiosError } from './utils/error.utils';
import { getApiUrl, configureRequestHeaders, isClient, getSubdomain } from './utils/api.utils';

const api = axios.create({
  baseURL: isClient() ? getApiUrl() : 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag para evitar múltiplos refresh simultâneos
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Interceptor para configurar URL dinamicamente e adicionar token
api.interceptors.request.use((config) => {
  // Atualizar baseURL dinamicamente (apenas no cliente)
  if (isClient()) {
    config.baseURL = getApiUrl();
  }
  
  // Configurar headers de autenticação e subdomain
  configureRequestHeaders(config);
  
  return config;
});

/**
 * Verifica se o erro deve ser tratado pelo interceptor de auth
 */
function shouldHandleAuthError(error: unknown): error is { config?: unknown; response?: { status?: number } } {
  return isAxiosError(error) && error.config !== undefined && error.response?.status === 401;
}

/**
 * Verifica se deve tentar refresh ou redirecionar para login
 */
function shouldAttemptRefresh(requestConfig: { _retry?: boolean; url?: string }): boolean {
  return !requestConfig._retry && !requestConfig.url?.includes('/auth/');
}

/**
 * Redireciona para login e limpa dados de autenticação
 */
function redirectToLogin(): void {
  clearAuthData();
  if (isClient()) {
    globalThis.window.location.href = '/login';
  }
}

/**
 * Adiciona token ao header da requisição
 */
function setRequestAuthHeader(
  originalRequest: { headers?: Record<string, string> },
  token: string,
): void {
  if (originalRequest.headers) {
    originalRequest.headers.Authorization = `Bearer ${token}`;
  }
}

/**
 * Salva tokens no localStorage
 */
function saveTokens(accessToken: string, refreshToken?: string): void {
  if (!isClient()) {
    return;
  }
  setLocalStorageItem('token', accessToken);
  if (refreshToken) {
    setLocalStorageItem('refreshToken', refreshToken);
  }
}

/**
 * Obtém refresh token do localStorage
 */
function getRefreshToken(): string | null {
  return getLocalStorageItem('refreshToken');
}

/**
 * Processa requisições na fila quando refresh está em andamento
 */
function queueRequest(
  axiosInstance: typeof api,
  originalRequest: unknown,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    failedQueue.push({ resolve, reject });
  })
    .then((token) => {
      const request = originalRequest as { headers?: Record<string, string> };
      if (request.headers && typeof token === 'string') {
        setRequestAuthHeader(request, token);
      }
      return axiosInstance(originalRequest as Parameters<typeof axiosInstance>[0]);
    })
    .catch((err: unknown) => {
      throw toError(err);
    });
}

/**
 * Executa refresh do token
 */
async function performTokenRefresh(
  axiosInstance: typeof api,
  originalRequest: unknown,
): Promise<unknown> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    logger.warn('[Auth Interceptor] Refresh token não encontrado');
    throw new Error('Refresh token não encontrado');
  }

  const response = await authApi.refresh(refreshToken);
  if (!response.accessToken || !isClient()) {
    throw new Error('Token não retornado no refresh');
  }

  saveTokens(response.accessToken, response.refreshToken);
  setRequestAuthHeader(
    originalRequest as { headers?: Record<string, string> },
    response.accessToken,
  );
  processQueue(null, response.accessToken);
  isRefreshing = false;
  logger.log('[Auth Interceptor] Token renovado com sucesso');

  return axiosInstance(originalRequest as Parameters<typeof axiosInstance>[0]);
}

/**
 * Converte erro desconhecido para Error
 */
function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String(error.message));
  }
  return new Error('Erro desconhecido');
}

/**
 * Trata erro de refresh do token
 */
function handleRefreshError(refreshError: unknown): never {
  logger.error('[Auth Interceptor] Erro ao renovar token:', refreshError);
  processQueue(refreshError, null);
  isRefreshing = false;
  redirectToLogin();
  throw toError(refreshError);
}

/**
 * Função helper para configurar interceptor de resposta (pode ser reutilizada em outros arquivos)
 */
export const setupAuthResponseInterceptor = (axiosInstance: typeof api) => {
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      // Verificar se deve tratar o erro
      if (!shouldHandleAuthError(error)) {
        throw toError(error);
      }

      const originalRequest = error.config;
      if (!originalRequest) {
        throw toError(error);
      }

      const requestConfig = originalRequest as { _retry?: boolean; url?: string };

      // Se não deve tentar refresh, redirecionar para login
      if (!shouldAttemptRefresh(requestConfig)) {
        redirectToLogin();
        throw toError(error);
      }

      // Se já está fazendo refresh, adicionar à fila
      if (isRefreshing) {
        return queueRequest(axiosInstance, originalRequest);
      }

      // Marcar requisição como tentada e iniciar refresh
      requestConfig._retry = true;
      isRefreshing = true;

      try {
        return await performTokenRefresh(axiosInstance, originalRequest);
      } catch (refreshError: unknown) {
        handleRefreshError(refreshError);
      }
    },
  );
};

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
      logger.log('[authApi] Buscando tenant em:', apiUrl);
      const response = await axios.post(apiUrl, { email });
      return response.data;
    } catch (error: unknown) {
      // Se não encontrar tenant (404) ou erro de rede, retornar null
      if (isAxiosError(error)) {
        if (error.response?.status === 404 || !error.response) {
          return null;
        }
        // Para outros erros, retornar null também para não bloquear o login
        logger.warn('Erro ao buscar tenant:', error.message);
      }
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
      const subdomain = isClient() ? getSubdomain() : null;
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

// Aplicar interceptor na instância principal (depois de definir authApi)
setupAuthResponseInterceptor(api);

export default api;
