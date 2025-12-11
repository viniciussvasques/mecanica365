/**
 * Logger utilitário para substituir console.log em produção
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Logger que só funciona em desenvolvimento
 */
export const logger = {
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  warn: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  error: (...args: unknown[]): void => {
    // Erros sempre são logados, mesmo em produção
    console.error(...args);
  },
  
  info: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  debug: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};

