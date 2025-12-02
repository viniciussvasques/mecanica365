import api from '../api';

// Enums
export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

// Interfaces
export interface Appointment {
  id: string;
  tenantId: string;
  customerId?: string;
  serviceOrderId?: string;
  assignedToId?: string;
  date: string;
  duration: number;
  serviceType?: string;
  notes?: string;
  status: AppointmentStatus;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  serviceOrder?: {
    id: string;
    number: string;
    status: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateAppointmentDto {
  customerId?: string;
  serviceOrderId?: string;
  assignedToId?: string;
  date: string;
  duration?: number;
  serviceType?: string;
  notes?: string;
  status?: AppointmentStatus;
}

export interface UpdateAppointmentDto {
  customerId?: string;
  serviceOrderId?: string;
  assignedToId?: string;
  date?: string;
  duration?: number;
  serviceType?: string;
  notes?: string;
  status?: AppointmentStatus;
}

export interface AppointmentFilters {
  customerId?: string;
  serviceOrderId?: string;
  assignedToId?: string;
  status?: AppointmentStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AppointmentsResponse {
  data: Appointment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CheckAvailabilityDto {
  date: string;
  duration?: number;
  elevatorId?: string;
}

export interface AvailabilityResponse {
  available: boolean;
  conflicts: Array<{
    type: 'mechanic' | 'elevator';
    id: string;
    name: string;
    startTime: string;
    endTime: string;
  }>;
}

export interface GetAvailableSlotsDto {
  date: string; // YYYY-MM-DD
  duration?: number; // minutos
  elevatorId?: string;
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  reason?: string;
}

export interface AvailableSlotsResponse {
  date: string;
  availableSlots: AvailableSlot[];
  hasAvailability: boolean;
}

export const appointmentsApi = {
  /**
   * Lista agendamentos com filtros e paginação
   */
  findAll: async (filters?: AppointmentFilters): Promise<AppointmentsResponse> => {
    const response = await api.get<AppointmentsResponse>('/appointments', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Busca um agendamento por ID
   */
  findOne: async (id: string): Promise<Appointment> => {
    const response = await api.get<Appointment>(`/appointments/${id}`);
    return response.data;
  },

  /**
   * Cria um novo agendamento
   */
  create: async (data: CreateAppointmentDto): Promise<Appointment> => {
    const response = await api.post<Appointment>('/appointments', data);
    return response.data;
  },

  /**
   * Atualiza um agendamento
   */
  update: async (id: string, data: UpdateAppointmentDto): Promise<Appointment> => {
    const response = await api.put<Appointment>(`/appointments/${id}`, data);
    return response.data;
  },

  /**
   * Remove um agendamento
   */
  remove: async (id: string): Promise<void> => {
    await api.delete(`/appointments/${id}`);
  },

  /**
   * Cancela um agendamento
   */
  cancel: async (id: string): Promise<Appointment> => {
    const response = await api.post<Appointment>(`/appointments/${id}/cancel`);
    return response.data;
  },

  /**
   * Mecânico pega um agendamento disponível (sem assignedToId)
   */
  claim: async (id: string): Promise<Appointment> => {
    const response = await api.post<Appointment>(`/appointments/${id}/claim`);
    return response.data;
  },

  /**
   * Verifica disponibilidade para agendamento
   */
  checkAvailability: async (
    data: CheckAvailabilityDto,
  ): Promise<AvailabilityResponse> => {
    const response = await api.get<AvailabilityResponse>(
      '/appointments/check-availability',
      {
        params: data,
      },
    );
    return response.data;
  },

  /**
   * Lista horários disponíveis de um dia
   */
  getAvailableSlots: async (
    data: GetAvailableSlotsDto,
  ): Promise<AvailableSlotsResponse> => {
    const response = await api.get<AvailableSlotsResponse>(
      '/appointments/available-slots',
      {
        params: data,
      },
    );
    return response.data;
  },
};

