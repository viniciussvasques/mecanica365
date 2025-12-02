import api from '../api';
import { ProblemCategory } from './quotes';

// Enums
export enum ServiceOrderStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}

// Interfaces
export interface ServiceOrderItem {
  id?: string;
  serviceId?: string;
  partId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  hours?: number;
}

export interface ServiceOrder {
  id: string;
  tenantId: string;
  number: string;
  customerId?: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  vehicleId?: string;
  vehicle?: {
    id: string;
    placa?: string;
    make?: string;
    model?: string;
    year?: number;
  };
  technicianId?: string;
  technician?: {
    id: string;
    name: string;
    email?: string;
  };
  elevatorId?: string;
  elevator?: {
    id: string;
    name: string;
    number: string;
    status: string;
  };
  quoteId?: string;
  quote?: {
    id: string;
    number: string;
    totalCost: number;
  };
  status: ServiceOrderStatus;
  priority: string;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  actualStart?: Date;
  actualEnd?: Date;
  laborCost?: number;
  partsCost?: number;
  totalCost?: number;
  discount?: number;
  taxAmount?: number;
  reportedProblemCategory?: string;
  reportedProblemDescription?: string;
  reportedProblemSymptoms?: string[];
  identifiedProblemCategory?: string;
  identifiedProblemDescription?: string;
  identifiedProblemId?: string;
  diagnosticNotes?: string;
  recommendations?: string;
  items: ServiceOrderItem[];
  notes?: string;
  attachments?: Array<{
    id: string;
    type: string;
    url: string;
    originalName: string;
  }>;
  checklists?: Array<{
    id: string;
    checklistType: string;
    name: string;
    status: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceOrderDto {
  customerId?: string;
  vehicleId?: string;
  technicianId?: string;
  elevatorId?: string;
  quoteId?: string;
  status?: ServiceOrderStatus;
  priority?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  laborCost?: number;
  partsCost?: number;
  discount?: number;
  taxAmount?: number;
  reportedProblemCategory?: ProblemCategory;
  reportedProblemDescription?: string;
  reportedProblemSymptoms?: string[];
  identifiedProblemCategory?: ProblemCategory;
  identifiedProblemDescription?: string;
  identifiedProblemId?: string;
  diagnosticNotes?: string;
  recommendations?: string;
  items?: ServiceOrderItem[];
  notes?: string;
}

export interface UpdateServiceOrderDto {
  customerId?: string;
  vehicleId?: string;
  technicianId?: string;
  elevatorId?: string;
  status?: ServiceOrderStatus;
  priority?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  laborCost?: number;
  partsCost?: number;
  discount?: number;
  taxAmount?: number;
  reportedProblemCategory?: ProblemCategory;
  reportedProblemDescription?: string;
  reportedProblemSymptoms?: string[];
  identifiedProblemCategory?: ProblemCategory;
  identifiedProblemDescription?: string;
  identifiedProblemId?: string;
  diagnosticNotes?: string;
  recommendations?: string;
  items?: ServiceOrderItem[];
  notes?: string;
}

export interface ServiceOrderFilters {
  number?: string;
  status?: ServiceOrderStatus;
  customerId?: string;
  vehicleId?: string;
  technicianId?: string;
  elevatorId?: string;
  quoteId?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ServiceOrdersResponse {
  data: ServiceOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const serviceOrdersApi = {
  /**
   * Lista ordens de serviço com filtros e paginação
   */
  findAll: async (filters?: ServiceOrderFilters): Promise<ServiceOrdersResponse> => {
    const response = await api.get<ServiceOrdersResponse>('/service-orders', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Busca uma ordem de serviço por ID
   */
  findOne: async (id: string): Promise<ServiceOrder> => {
    const response = await api.get<ServiceOrder>(`/service-orders/${id}`);
    return response.data;
  },

  /**
   * Cria uma nova ordem de serviço
   */
  create: async (data: CreateServiceOrderDto): Promise<ServiceOrder> => {
    const response = await api.post<ServiceOrder>('/service-orders', data);
    return response.data;
  },

  /**
   * Atualiza uma ordem de serviço
   */
  update: async (id: string, data: UpdateServiceOrderDto): Promise<ServiceOrder> => {
    const response = await api.patch<ServiceOrder>(`/service-orders/${id}`, data);
    return response.data;
  },

  /**
   * Remove uma ordem de serviço
   */
  remove: async (id: string): Promise<void> => {
    await api.delete(`/service-orders/${id}`);
  },

  /**
   * Inicia uma ordem de serviço
   */
  start: async (id: string): Promise<ServiceOrder> => {
    const response = await api.post(`/service-orders/${id}/start`);
    return response.data;
  },

  /**
   * Completa uma ordem de serviço
   */
  complete: async (id: string, finalNotes?: string): Promise<ServiceOrder> => {
    const response = await api.post(`/service-orders/${id}/complete`, {
      finalNotes,
    });
    return response.data;
  },

  /**
   * Cancela uma ordem de serviço
   */
  cancel: async (id: string): Promise<ServiceOrder> => {
    const response = await api.post(`/service-orders/${id}/cancel`);
    return response.data;
  },
};

