declare module 'axios' {
  export interface AxiosInstance {
    (config: unknown): Promise<unknown>;
    request<T = unknown>(config: unknown): Promise<T>;
    get<T = unknown>(url: string, config?: unknown): Promise<T>;
    delete<T = unknown>(url: string, config?: unknown): Promise<T>;
    head<T = unknown>(url: string, config?: unknown): Promise<T>;
    options<T = unknown>(url: string, config?: unknown): Promise<T>;
    post<T = unknown>(
      url: string,
      data?: unknown,
      config?: unknown,
    ): Promise<T>;
    put<T = unknown>(url: string, data?: unknown, config?: unknown): Promise<T>;
    patch<T = unknown>(
      url: string,
      data?: unknown,
      config?: unknown,
    ): Promise<T>;
    defaults: unknown;
    interceptors: unknown;
    create(config?: unknown): AxiosInstance;
  }

  export interface AxiosRequestConfig {
    url?: string;
    method?: string;
    baseURL?: string;
    headers?: unknown;
    params?: unknown;
    data?: unknown;
    timeout?: number;
    [key: string]: unknown;
  }

  export interface AxiosResponse<T = unknown> {
    data: T;
    status: number;
    statusText: string;
    headers: unknown;
    config: AxiosRequestConfig;
  }

  export interface AxiosError<T = unknown> extends Error {
    config: AxiosRequestConfig;
    code?: string;
    request?: unknown;
    response?: AxiosResponse<T>;
    isAxiosError: boolean;
  }

  const axios: AxiosInstance & {
    create(config?: unknown): AxiosInstance;
    Cancel: unknown;
    CancelToken: unknown;
    isCancel(value: unknown): boolean;
    all<T>(values: (T | Promise<T>)[]): Promise<T[]>;
    spread<T, R>(callback: (...args: T[]) => R): (array: T[]) => R;
  };

  export default axios;
  export { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError };
}
