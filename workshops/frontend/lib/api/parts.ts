import api from '../api';

export interface Supplier {
  id: string;
  name: string;
}

export interface Part {
  id: string;
  tenantId: string;
  partNumber?: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  supplierId?: string;
  supplier?: Supplier;
  quantity: number;
  minQuantity: number;
  costPrice: number;
  sellPrice: number;
  location?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartDto {
  partNumber?: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  supplierId?: string;
  quantity: number;
  minQuantity: number;
  costPrice: number;
  sellPrice: number;
  location?: string;
  isActive?: boolean;
}

export interface UpdatePartDto {
  partNumber?: string;
  name?: string;
  description?: string;
  category?: string;
  brand?: string;
  supplierId?: string;
  quantity?: number;
  minQuantity?: number;
  costPrice?: number;
  sellPrice?: number;
  location?: string;
  isActive?: boolean;
}

export interface PartFilters {
  search?: string;
  category?: string;
  brand?: string;
  supplierId?: string;
  isActive?: boolean;
  lowStock?: boolean;
  page?: number;
  limit?: number;
}

export interface PartsResponse {
  data: Part[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const partsApi = {
  /**
   * Lista peças com filtros e paginação
   */
  findAll: async (filters?: PartFilters): Promise<PartsResponse> => {
    const response = await api.get<PartsResponse>('/parts', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Busca uma peça por ID
   */
  findOne: async (id: string): Promise<Part> => {
    const response = await api.get<Part>(`/parts/${id}`);
    return response.data;
  },

  /**
   * Cria uma nova peça
   */
  create: async (data: CreatePartDto): Promise<Part> => {
    const response = await api.post<Part>('/parts', data);
    return response.data;
  },

  /**
   * Atualiza uma peça
   */
  update: async (id: string, data: UpdatePartDto): Promise<Part> => {
    const response = await api.patch<Part>(`/parts/${id}`, data);
    return response.data;
  },

  /**
   * Remove uma peça
   */
  remove: async (id: string): Promise<void> => {
    await api.delete(`/parts/${id}`);
  },

  /**
   * Importa múltiplas peças via planilha
   */
  import: async (parts: CreatePartDto[]): Promise<{
    total: number;
    created: number;
    updated: number;
    errors: number;
    errorDetails: Array<{
      row: number;
      partNumber?: string;
      name?: string;
      error: string;
    }>;
  }> => {
    const response = await api.post('/parts/import', { parts });
    return response.data;
  },
};

