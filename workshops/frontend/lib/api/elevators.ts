import api from '../api';

// Enums
export enum ElevatorType {
  HYDRAULIC = 'hydraulic',
  PNEUMATIC = 'pneumatic',
  SCISSOR = 'scissor',
}

export enum ElevatorStatus {
  FREE = 'free',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  SCHEDULED = 'scheduled',
}

// Interfaces
export interface Elevator {
  id: string;
  tenantId: string;
  name: string;
  number: string;
  type: ElevatorType;
  capacity: number;
  status: ElevatorStatus;
  location?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ElevatorUsage {
  id: string;
  elevatorId: string;
  elevator?: {
    id: string;
    name: string;
    number: string;
  };
  serviceOrderId?: string;
  serviceOrder?: {
    id: string;
    number: string;
    status: string;
  };
  vehicleId?: string;
  vehicle?: {
    id: string;
    placa?: string;
    make?: string;
    model?: string;
  };
  technicianId?: string;
  technician?: {
    id: string;
    name: string;
  };
  startTime: Date;
  endTime?: Date;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateElevatorDto {
  name: string;
  number: string;
  type: ElevatorType;
  capacity: number;
  status?: ElevatorStatus;
  location?: string;
  notes?: string;
}

export interface UpdateElevatorDto {
  name?: string;
  number?: string;
  type?: ElevatorType;
  capacity?: number;
  status?: ElevatorStatus;
  location?: string;
  notes?: string;
}

export interface ReserveElevatorDto {
  serviceOrderId?: string;
  vehicleId?: string;
  technicianId?: string;
  scheduledStart?: string;
  notes?: string;
}

export interface ElevatorFilters {
  name?: string;
  number?: string;
  type?: ElevatorType;
  status?: ElevatorStatus;
  page?: number;
  limit?: number;
}

export interface ElevatorsResponse {
  data: Elevator[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ElevatorUsagesResponse {
  data: ElevatorUsage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const elevatorsApi = {
  /**
   * Lista elevadores com filtros e paginação
   */
  findAll: async (filters?: ElevatorFilters): Promise<ElevatorsResponse> => {
    const response = await api.get<ElevatorsResponse>('/elevators', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Busca um elevador por ID
   */
  findOne: async (id: string): Promise<Elevator> => {
    const response = await api.get<Elevator>(`/elevators/${id}`);
    return response.data;
  },

  /**
   * Cria um novo elevador
   */
  create: async (data: CreateElevatorDto): Promise<Elevator> => {
    const response = await api.post<Elevator>('/elevators', data);
    return response.data;
  },

  /**
   * Atualiza um elevador
   */
  update: async (id: string, data: UpdateElevatorDto): Promise<Elevator> => {
    const response = await api.patch<Elevator>(`/elevators/${id}`, data);
    return response.data;
  },

  /**
   * Remove um elevador
   */
  remove: async (id: string): Promise<void> => {
    await api.delete(`/elevators/${id}`);
  },

  /**
   * Reserva um elevador
   */
  reserve: async (id: string, data: ReserveElevatorDto): Promise<ElevatorUsage> => {
    const response = await api.post<ElevatorUsage>(`/elevators/${id}/reserve`, data);
    return response.data;
  },

  /**
   * Inicia uso do elevador
   */
  startUsage: async (id: string, usageId: string): Promise<ElevatorUsage> => {
    const response = await api.post<ElevatorUsage>(`/elevators/${id}/usage/${usageId}/start`);
    return response.data;
  },

  /**
   * Finaliza uso do elevador
   */
  endUsage: async (id: string, usageId: string): Promise<ElevatorUsage> => {
    const response = await api.post<ElevatorUsage>(`/elevators/${id}/usage/${usageId}/end`);
    return response.data;
  },

  /**
   * Lista histórico de uso do elevador
   */
  getUsageHistory: async (id: string, filters?: { page?: number; limit?: number }): Promise<ElevatorUsagesResponse> => {
    const response = await api.get<ElevatorUsagesResponse>(`/elevators/${id}/usage`, {
      params: filters,
    });
    return response.data;
  },

  /**
   * Lista todos os elevadores disponíveis
   */
  getAvailable: async (): Promise<Elevator[]> => {
    const response = await api.get<Elevator[]>('/elevators/available');
    return response.data;
  },
};

