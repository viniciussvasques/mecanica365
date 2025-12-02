import api from '../api';

export type NotificationType =
  | 'quote_assigned'
  | 'quote_available'
  | 'diagnosis_completed'
  | 'quote_approved'
  | 'service_order_started'
  | 'service_order_completed';

export interface Notification {
  id: string;
  tenantId: string;
  userId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  readAt: Date | string | null;
  createdAt: Date | string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface NotificationFilters {
  unreadOnly?: boolean;
  limit?: number;
}

export const notificationsApi = {
  /**
   * Lista notificações do usuário
   */
  findAll: async (filters?: NotificationFilters): Promise<NotificationListResponse> => {
    const params = new URLSearchParams();
    if (filters?.unreadOnly) {
      params.append('unreadOnly', 'true');
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/notifications?${queryString}` : '/notifications';
    
    const response = await api.get<NotificationListResponse>(url);
    return response.data;
  },

  /**
   * Obtém contador de notificações não lidas
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<{ unreadCount: number }>('/notifications/unread-count');
    return response.data.unreadCount;
  },

  /**
   * Marca uma notificação como lida
   */
  markAsRead: async (id: string): Promise<void> => {
    await api.post(`/notifications/${id}/read`);
  },

  /**
   * Marca todas as notificações como lidas
   */
  markAllAsRead: async (): Promise<void> => {
    await api.post('/notifications/read-all');
  },
};

