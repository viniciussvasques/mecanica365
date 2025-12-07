import api from '../api';

export enum InvoiceStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum InvoiceType {
  SERVICE = 'service',
  SALE = 'sale',
  PART = 'part',
}

export enum InvoiceItemType {
  SERVICE = 'service',
  PART = 'part',
}

export enum PaymentPreference {
  ONLINE_GATEWAY = 'online_gateway',
  POS_TERMINAL = 'pos_terminal',
  MANUAL = 'manual',
}

export interface InvoiceItem {
  id?: string;
  type: InvoiceItemType;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface ServiceOrder {
  id: string;
  number: string;
  status: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  serviceOrderId?: string;
  customerId?: string;
  customer?: Customer;
  serviceOrder?: ServiceOrder;
  type: InvoiceType;
  total: number;
  discount: number;
  taxAmount: number;
  nfeKey?: string;
  nfeXmlUrl?: string;
  nfePdfUrl?: string;
  nfeStatus?: string;
  paymentMethod?: string;
  paymentPreference?: PaymentPreference;
  paymentGatewayId?: string;
  paymentGateway?: {
    id: string;
    name: string;
    type: string;
  };
  paymentStatus: PaymentStatus;
  paidAt?: string;
  status: InvoiceStatus;
  issuedAt?: string;
  dueDate?: string;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceDto {
  serviceOrderId?: string;
  customerId?: string;
  type: InvoiceType;
  invoiceNumber?: string;
  items: InvoiceItem[];
  total?: number;
  discount?: number;
  taxAmount?: number;
  paymentMethod?: string;
  paymentPreference?: PaymentPreference;
  paymentGatewayId?: string;
  paymentStatus?: PaymentStatus;
  status?: InvoiceStatus;
  dueDate?: string;
  nfeKey?: string;
  nfeXmlUrl?: string;
  nfePdfUrl?: string;
  nfeStatus?: string;
}

export interface UpdateInvoiceDto {
  customerId?: string;
  type?: InvoiceType;
  items?: InvoiceItem[];
  total?: number;
  discount?: number;
  taxAmount?: number;
  paymentMethod?: string;
  paymentPreference?: PaymentPreference;
  paymentGatewayId?: string;
  paymentStatus?: PaymentStatus;
  status?: InvoiceStatus;
  dueDate?: string;
  nfeKey?: string;
  nfeXmlUrl?: string;
  nfePdfUrl?: string;
  nfeStatus?: string;
}

export interface InvoiceFilters {
  invoiceNumber?: string;
  customerId?: string;
  serviceOrderId?: string;
  type?: InvoiceType;
  status?: InvoiceStatus;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface InvoicesResponse {
  data: Invoice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const invoicingApi = {
  /**
   * Lista faturas com filtros e paginação
   */
  findAll: async (filters?: InvoiceFilters): Promise<InvoicesResponse> => {
    const response = await api.get<InvoicesResponse>('/invoices', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Busca uma fatura por ID
   */
  findOne: async (id: string): Promise<Invoice> => {
    const response = await api.get<Invoice>(`/invoices/${id}`);
    return response.data;
  },

  /**
   * Cria uma nova fatura
   */
  create: async (data: CreateInvoiceDto): Promise<Invoice> => {
    const response = await api.post<Invoice>('/invoices', data);
    return response.data;
  },

  /**
   * Atualiza uma fatura
   */
  update: async (id: string, data: UpdateInvoiceDto): Promise<Invoice> => {
    const response = await api.patch<Invoice>(`/invoices/${id}`, data);
    return response.data;
  },

  /**
   * Remove uma fatura
   */
  remove: async (id: string): Promise<void> => {
    await api.delete(`/invoices/${id}`);
  },

  /**
   * Emite uma fatura
   */
  issue: async (id: string): Promise<Invoice> => {
    const response = await api.post<Invoice>(`/invoices/${id}/issue`);
    return response.data;
  },

  /**
   * Cancela uma fatura
   */
  cancel: async (id: string): Promise<Invoice> => {
    const response = await api.post<Invoice>(`/invoices/${id}/cancel`);
    return response.data;
  },
};

