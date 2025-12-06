import api from '../api';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PIX = 'pix',
  BOLETO = 'boleto',
  TRANSFER = 'transfer',
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  status: string;
}

export interface Payment {
  id: string;
  tenantId: string;
  invoiceId?: string;
  invoice?: Invoice;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt?: string;
  transactionId?: string;
  installments: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentDto {
  invoiceId?: string;
  amount: number;
  method: PaymentMethod;
  status?: PaymentStatus;
  transactionId?: string;
  installments?: number;
  notes?: string;
}

export interface UpdatePaymentDto {
  amount?: number;
  method?: PaymentMethod;
  status?: PaymentStatus;
  transactionId?: string;
  installments?: number;
  notes?: string;
}

export interface PaymentFilters {
  invoiceId?: string;
  method?: PaymentMethod;
  status?: PaymentStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaymentsResponse {
  data: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const paymentsApi = {
  /**
   * Lista pagamentos com filtros e paginação
   */
  findAll: async (filters?: PaymentFilters): Promise<PaymentsResponse> => {
    const response = await api.get<PaymentsResponse>('/payments', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Busca um pagamento por ID
   */
  findOne: async (id: string): Promise<Payment> => {
    const response = await api.get<Payment>(`/payments/${id}`);
    return response.data;
  },

  /**
   * Cria um novo pagamento
   */
  create: async (data: CreatePaymentDto): Promise<Payment> => {
    const response = await api.post<Payment>('/payments', data);
    return response.data;
  },

  /**
   * Atualiza um pagamento
   */
  update: async (id: string, data: UpdatePaymentDto): Promise<Payment> => {
    const response = await api.patch<Payment>(`/payments/${id}`, data);
    return response.data;
  },

  /**
   * Remove um pagamento
   */
  remove: async (id: string): Promise<void> => {
    await api.delete(`/payments/${id}`);
  },
};

