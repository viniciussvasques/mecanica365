import api from '../api';

export enum DocumentType {
  CNPJ = 'cnpj',
  CPF = 'cpf',
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  documentType?: DocumentType;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contactName?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDto {
  name: string;
  documentType?: DocumentType;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contactName?: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateSupplierDto {
  name?: string;
  documentType?: DocumentType;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contactName?: string;
  notes?: string;
  isActive?: boolean;
}

export interface SupplierFilters {
  search?: string;
  isActive?: boolean;
  city?: string;
  state?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface SuppliersResponse {
  data: Supplier[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const suppliersApi = {
  findAll: async (filters?: SupplierFilters): Promise<SuppliersResponse> => {
    const response = await api.get<SuppliersResponse>('/suppliers', { params: filters });
    return response.data;
  },

  findOne: async (id: string): Promise<Supplier> => {
    const response = await api.get<Supplier>(`/suppliers/${id}`);
    return response.data;
  },

  create: async (data: CreateSupplierDto): Promise<Supplier> => {
    const response = await api.post<Supplier>('/suppliers', data);
    return response.data;
  },

  update: async (id: string, data: UpdateSupplierDto): Promise<Supplier> => {
    const response = await api.patch<Supplier>(`/suppliers/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
  },
};

