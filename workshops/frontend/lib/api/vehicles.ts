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

// Interfaces
export interface Vehicle {
  id: string;
  customerId: string;
  vin: string | null;
  renavan: string | null;
  placa: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  mileage: number | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVehicleDto {
  customerId: string;
  vin?: string;
  renavan?: string;
  placa?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  mileage?: number;
  isDefault?: boolean;
}

export interface UpdateVehicleDto {
  customerId?: string; // Para transferência de veículo
  vin?: string;
  renavan?: string;
  placa?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  mileage?: number;
  isDefault?: boolean;
}

export interface VehicleFilters {
  customerId?: string;
  placa?: string;
  vin?: string;
  renavan?: string;
  make?: string;
  model?: string;
  page?: number;
  limit?: number;
}

export interface VehiclesResponse {
  data: Vehicle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const vehiclesApi = {
  /**
   * Lista veículos com filtros e paginação
   */
  findAll: async (filters?: VehicleFilters): Promise<VehiclesResponse> => {
    const response = await api.get<VehiclesResponse>('/vehicles', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Busca um veículo por ID
   */
  findOne: async (id: string): Promise<Vehicle> => {
    const response = await api.get<Vehicle>(`/vehicles/${id}`);
    return response.data;
  },

  /**
   * Cria um novo veículo
   */
  create: async (data: CreateVehicleDto): Promise<Vehicle> => {
    const response = await api.post<Vehicle>('/vehicles', data);
    return response.data;
  },

  /**
   * Atualiza um veículo
   */
  update: async (id: string, data: UpdateVehicleDto): Promise<Vehicle> => {
    const response = await api.patch<Vehicle>(`/vehicles/${id}`, data);
    return response.data;
  },

  /**
   * Remove um veículo
   */
  remove: async (id: string): Promise<void> => {
    await api.delete(`/vehicles/${id}`);
  },

  /**
   * Consulta dados do veículo por placa
   */
  queryByPlaca: async (placa: string): Promise<{
    make?: string;
    model?: string;
    year?: number;
    color?: string;
    vin?: string;
    renavan?: string;
    fuelType?: string;
    engine?: string;
    chassis?: string;
  }> => {
    const response = await api.get(`/vehicles/query/placa/${placa}`);
    return response.data;
  },

  /**
   * Consulta dados do veículo por RENAVAN
   */
  queryByRenavan: async (renavan: string): Promise<{
    make?: string;
    model?: string;
    year?: number;
    color?: string;
    vin?: string;
    placa?: string;
    fuelType?: string;
    engine?: string;
    chassis?: string;
  }> => {
    const response = await api.get(`/vehicles/query/renavan/${renavan}`);
    return response.data;
  },
};

