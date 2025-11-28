/**
 * Utilitários para tratamento de erros
 */

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
  return 'Erro desconhecido';
}

/**
 * Extrai o stack trace de erro de forma segura
 */
export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
}
