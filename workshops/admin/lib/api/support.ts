import api from '../api';

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'waiting_for_user' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'account' | 'feature_request' | 'general';
  userId?: string;
  userEmail?: string;
  userName?: string;
  tenantId?: string;
  assignedToId?: string;
  assignedToName?: string;
  lastReplyAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  repliesCount?: number;
  isUnread?: boolean;
}

export interface SupportStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  avgResponseTime: number;
}

export interface SupportTicketFilters {
  status?: string;
  priority?: string;
  category?: string;
  assignedToId?: string;
  tenantId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SupportTicketListResponse {
  data: SupportTicket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateSupportReplyDto {
  message: string;
  isInternal?: boolean;
  attachments?: string[];
}

export interface UpdateSupportTicketDto {
  status?: string;
  priority?: string;
  category?: string;
  assignedToId?: string;
  internalNotes?: string;
}

export const supportApi = {
  // Listar tickets
  getTickets: async (filters: SupportTicketFilters = {}): Promise<SupportTicketListResponse> => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/support/tickets?${params}`);
    return response.data;
  },

  // Buscar ticket específico
  getTicket: async (id: string): Promise<SupportTicket & { replies?: any[] }> => {
    const response = await api.get(`/support/tickets/${id}`);
    return response.data;
  },

  // Atualizar ticket
  updateTicket: async (id: string, data: UpdateSupportTicketDto): Promise<SupportTicket> => {
    const response = await api.patch(`/support/tickets/${id}`, data);
    return response.data;
  },

  // Deletar ticket
  deleteTicket: async (id: string): Promise<void> => {
    await api.delete(`/support/tickets/${id}`);
  },

  // Adicionar resposta
  addReply: async (ticketId: string, data: CreateSupportReplyDto): Promise<any> => {
    const response = await api.post(`/support/tickets/${ticketId}/replies`, data);
    return response.data;
  },

  // Estatísticas
  getStats: async (): Promise<SupportStats> => {
    const response = await api.get('/support/stats');
    return response.data;
  },
};
