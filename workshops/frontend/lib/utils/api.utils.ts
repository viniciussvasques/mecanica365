import { getLocalStorageItem } from './localStorage';

/**
 * Utilitários compartilhados para configuração de API
 */

/**
 * Verifica se está rodando no cliente (browser)
 */
export function isClient(): boolean {
  return typeof globalThis.window !== 'undefined';
}

/**
 * Obtém o subdomain do localStorage
 */
export function getSubdomain(): string | null {
  if (!isClient()) {
    return null;
  }
  return getLocalStorageItem('subdomain');
}

/**
 * Obtém o token do localStorage
 */
export function getToken(): string | null {
  if (!isClient()) {
    return null;
  }
  return getLocalStorageItem('token');
}

/**
 * Função para obter a URL base da API com subdomain (apenas no cliente)
 */
export function getApiUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  // Verificar se estamos no cliente (localStorage só existe no browser)
  if (!isClient()) {
    return `${baseUrl}/api`;
  }
  
  const subdomain = getSubdomain();
  
  // Se houver subdomain, usar no host (ex: oficinartee.localhost:3001)
  if (subdomain && baseUrl.includes('localhost')) {
    return `http://${subdomain}.localhost:3001/api`;
  }
  
  // Caso contrário, usar URL padrão
  return `${baseUrl}/api`;
}

/**
 * Configura headers de autenticação e subdomain para requisição
 */
export function configureRequestHeaders(config: {
  headers?: Record<string, string>;
}): void {
  if (!isClient()) {
    return;
  }
  
  const token = getToken();
  if (token) {
    if (!config.headers) {
      config.headers = {};
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  const subdomain = getSubdomain();
  if (subdomain) {
    if (!config.headers) {
      config.headers = {};
    }
    config.headers['X-Tenant-Subdomain'] = subdomain;
  }
}

