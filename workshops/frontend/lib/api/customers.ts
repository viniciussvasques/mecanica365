import axios from 'axios';
import { getApiUrl, isClient } from '../utils/api.utils';
import { setupRequestInterceptor, setupSimpleResponseInterceptor } from '../utils/api-interceptors';

const api = axios.create({
  baseURL: isClient() ? getApiUrl() : 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configurar interceptors compartilhados
setupRequestInterceptor(api);
setupSimpleResponseInterceptor(api);

export enum DocumentType {
  CPF = 'cpf',
  CNPJ = 'cnpj',
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  email?: string | null;
  phone: string;
  documentType: string;
  cpf?: string | null;
  cnpj?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  name: string;
  email?: string;
  phone: string;
  documentType?: DocumentType;
  cpf?: string;
  cnpj?: string;
  address?: string;
  notes?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  email?: string;
  phone?: string;
  documentType?: DocumentType;
  cpf?: string;
  cnpj?: string;
  address?: string;
  notes?: string;
}

export interface CustomerFilters {
  name?: string;
  phone?: string;
  email?: string;
  documentType?: string;
  cpf?: string;
  cnpj?: string;
  page?: number;
  limit?: number;
}

export interface CustomersResponse {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const customersApi = {
  /**
   * Lista clientes com filtros e paginação
   */
  findAll: async (filters?: CustomerFilters): Promise<CustomersResponse> => {
    const response = await api.get<CustomersResponse>('/customers', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Busca um cliente por ID
   */
  findOne: async (id: string): Promise<Customer> => {
    const response = await api.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  /**
   * Cria um novo cliente
   */
  create: async (data: CreateCustomerDto): Promise<Customer> => {
    const response = await api.post<Customer>('/customers', data);
    return response.data;
  },

  /**
   * Atualiza um cliente
   */
  update: async (id: string, data: UpdateCustomerDto): Promise<Customer> => {
    const response = await api.patch<Customer>(`/customers/${id}`, data);
    return response.data;
  },

  /**
   * Remove um cliente
   */
  remove: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },
};

