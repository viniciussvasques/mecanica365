/**
 * Utilitários para tratamento de erros no frontend
 */

/**
 * Interface para erros do Axios
 */
export interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string | string[];
      error?: string;
      statusCode?: number;
    };
    status?: number;
  };
  message?: string;
  config?: unknown;
}

/**
 * Type guard para verificar se o erro é um erro do Axios
 */
export function isAxiosError(error: unknown): error is AxiosErrorResponse {
  return (
    error !== null &&
    typeof error === 'object' &&
    'response' in error
  );
}

/**
 * Extrai a mensagem de erro de forma segura
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (isAxiosError(error)) {
    if (error.response?.data?.message) {
      const message = error.response.data.message;
      return Array.isArray(message) ? message.join(', ') : message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.status) {
      return `Erro ${error.response.status}: Requisição falhou`;
    }
    if (error.message) {
      return error.message;
    }
  }
  return 'Erro desconhecido';
}

/**
 * Extrai mensagens de erro do Axios de forma formatada
 */
export function getAxiosErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) {
    return getErrorMessage(error);
  }
  
  if (error.response?.data) {
    const data = error.response.data;
    
    if (data.message) {
      const message = data.message;
      return Array.isArray(message) 
        ? message.map((m: string) => `• ${m}`).join('\n')
        : message;
    }
    
    if (data.error) {
      return data.error;
    }
    
    if (error.response.status) {
      return `Erro ${error.response.status}: ${JSON.stringify(data)}`;
    }
  }
  
  if (error.response?.status) {
    return `Erro ${error.response.status}: Requisição falhou`;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'Erro desconhecido';
}

/**
 * Verifica se o erro é um erro de autenticação (401)
 */
export function isAuthError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 401;
}

/**
 * Verifica se o erro é um erro de permissão (403)
 */
export function isForbiddenError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 403;
}

/**
 * Verifica se o erro é um erro de validação (400)
 */
export function isValidationError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 400;
}

/**
 * Extrai o status code do erro
 */
export function getErrorStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}

/**
 * Limpa todos os dados de autenticação do localStorage
 */
export function clearAuthData(): void {
  if (globalThis.window === undefined) {
    return;
  }
  
  const authKeys = [
    'token',
    'refreshToken',
    'userName',
    'userEmail',
    'userId',
    'userRole',
    'subdomain',
  ];
  
  authKeys.forEach((key) => {
    removeLocalStorageItem(key);
  });
}

