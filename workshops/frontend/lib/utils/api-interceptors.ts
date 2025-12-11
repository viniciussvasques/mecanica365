/**
 * Interceptors compartilhados para Axios
 */

import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getApiUrl, configureRequestHeaders, isClient } from './api.utils';
import { clearAuthData } from './error.utils';
import { logger } from './logger';

/**
 * Configura interceptor de request padrão (URL, token, subdomain)
 */
export function setupRequestInterceptor(axiosInstance: AxiosInstance): void {
  axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    // Atualizar baseURL dinamicamente (apenas no cliente)
    if (isClient()) {
      config.baseURL = getApiUrl();
    }
    
    // Configurar headers de autenticação e subdomain
    configureRequestHeaders(config);
    
    return config;
  });
}

/**
 * Configura interceptor de response simples (apenas redireciona em 401)
 * Use este para APIs que não precisam de refresh automático de token
 */
export function setupSimpleResponseInterceptor(axiosInstance: AxiosInstance): void {
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { status?: number } }).response?.status === 401
      ) {
        // Limpar dados de autenticação
        clearAuthData();
        
        // Redirecionar para login
        if (isClient()) {
          globalThis.window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );
}

