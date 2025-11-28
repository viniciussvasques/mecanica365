import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Adicionar subdomain no header
  const subdomain = localStorage.getItem('subdomain');
  if (subdomain) {
    config.headers['X-Tenant-Subdomain'] = subdomain;
    console.log('[API] Enviando requisição com subdomain:', subdomain, 'para:', config.url);
  } else {
    console.warn('[API] Subdomain não encontrado no localStorage');
  }
  
  return config;
});

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone: string;
  cpf?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  name: string;
  email?: string;
  phone: string;
  cpf?: string;
  address?: string;
  notes?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  email?: string;
  phone?: string;
  cpf?: string;
  address?: string;
  notes?: string;
}

export interface CustomerFilters {
  name?: string;
  phone?: string;
  email?: string;
  cpf?: string;
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

