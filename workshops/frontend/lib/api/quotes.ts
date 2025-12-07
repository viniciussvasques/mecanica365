import api from '../api';

// Enums
export enum QuoteStatus {
  DRAFT = 'draft',
  AWAITING_DIAGNOSIS = 'awaiting_diagnosis', // Aguardando avaliação do mecânico
  DIAGNOSED = 'diagnosed', // Mecânico já fez diagnóstico
  SENT = 'sent',
  VIEWED = 'viewed',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CONVERTED = 'converted',
}

export enum QuoteItemType {
  SERVICE = 'service',
  PART = 'part',
}

export enum ProblemCategory {
  MOTOR = 'motor',
  SUSPENSAO = 'suspensao',
  ELETRICA = 'eletrica',
  REFRIGERACAO = 'refrigeracao',
  FREIOS = 'freios',
  TRANSMISSAO = 'transmissao',
  PNEUS = 'pneus',
  AR_CONDICIONADO = 'ar_condicionado',
  COMBUSTIVEL = 'combustivel',
  ESCAPE = 'escape',
  ILUMINACAO = 'iluminacao',
  BATERIA = 'bateria',
  RADIADOR = 'radiador',
  DIRECAO = 'direcao',
  OUTROS = 'outros',
}

// Interfaces
export interface QuoteItem {
  id?: string;
  type: QuoteItemType;
  serviceId?: string;
  partId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitCost: number;
  totalCost?: number;
  hours?: number;
}

export interface Quote {
  id: string;
  tenantId: string;
  tenantName?: string;
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
  elevatorId?: string;
  elevator?: {
    id: string;
    name: string;
    number: string;
    status: string;
  };
  serviceOrderId?: string;
  status: QuoteStatus;
  version: number;
  parentQuoteId?: string;
  laborCost?: number;
  partsCost?: number;
  totalCost: number;
  discount: number;
  taxAmount: number;
  expiresAt?: Date;
  validUntil?: Date;
  sentAt?: Date;
  viewedAt?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  rejectedReason?: string;
  customerSignature?: string;
  approvalMethod?: string;
  publicToken?: string;
  publicTokenExpiresAt?: Date;
  convertedAt?: Date;
  convertedToServiceOrderId?: string;
  workshopSettings?: {
    displayName?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    phone?: string;
    email?: string;
    whatsapp?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    showLogoOnQuotes?: boolean;
    showAddressOnQuotes?: boolean;
    showContactOnQuotes?: boolean;
    quoteFooterText?: string;
  };
  assignedMechanicId?: string;
  assignedAt?: Date | string;
  assignedMechanic?: {
    id: string;
    name: string;
    email: string;
  };
  reportedProblemCategory?: string;
  reportedProblemDescription?: string;
  reportedProblemSymptoms?: string[];
  identifiedProblemCategory?: string;
  identifiedProblemDescription?: string;
  identifiedProblemId?: string;
  diagnosticNotes?: string;
  recommendations?: string;
  estimatedHours?: number; // Tempo estimado de serviço em horas (preenchido no diagnóstico)
  items: QuoteItem[];
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

export interface CreateQuoteDto {
  customerId?: string;
  vehicleId?: string;
  elevatorId?: string;
  status?: QuoteStatus;
  laborCost?: number;
  partsCost?: number;
  discount?: number;
  taxAmount?: number;
  expiresAt?: string;
  validUntil?: string;
  reportedProblemCategory?: ProblemCategory;
  reportedProblemDescription?: string;
  reportedProblemSymptoms?: string[];
  identifiedProblemCategory?: ProblemCategory;
  identifiedProblemDescription?: string;
  identifiedProblemId?: string;
  recommendations?: string;
  items: QuoteItem[];
}

export interface UpdateQuoteDto {
  customerId?: string;
  vehicleId?: string;
  elevatorId?: string;
  status?: QuoteStatus;
  laborCost?: number;
  partsCost?: number;
  discount?: number;
  taxAmount?: number;
  expiresAt?: string;
  validUntil?: string;
  reportedProblemCategory?: ProblemCategory;
  reportedProblemDescription?: string;
  reportedProblemSymptoms?: string[];
  identifiedProblemCategory?: ProblemCategory;
  identifiedProblemDescription?: string;
  identifiedProblemId?: string;
  recommendations?: string;
  items?: QuoteItem[];
}

export interface CompleteDiagnosisDto {
  identifiedProblemCategory?: ProblemCategory;
  identifiedProblemDescription?: string;
  identifiedProblemId?: string;
  recommendations?: string;
  diagnosticNotes?: string;
  estimatedHours?: number; // Tempo estimado de serviço em horas
}

export interface QuoteFilters {
  number?: string;
  status?: QuoteStatus;
  customerId?: string;
  vehicleId?: string;
  elevatorId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface QuotesResponse {
  data: Quote[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const quotesApi = {
  /**
   * Lista orçamentos com filtros e paginação
   */
  findAll: async (filters?: QuoteFilters): Promise<QuotesResponse> => {
    const response = await api.get<QuotesResponse>('/quotes', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Busca um orçamento por ID
   */
  findOne: async (id: string): Promise<Quote> => {
    const response = await api.get<Quote>(`/quotes/${id}`);
    return response.data;
  },

  /**
   * Cria um novo orçamento
   */
  create: async (data: CreateQuoteDto): Promise<Quote> => {
    const response = await api.post<Quote>('/quotes', data);
    return response.data;
  },

  /**
   * Atualiza um orçamento
   */
  update: async (id: string, data: UpdateQuoteDto): Promise<Quote> => {
    const response = await api.patch<Quote>(`/quotes/${id}`, data);
    return response.data;
  },

  /**
   * Remove um orçamento
   */
  remove: async (id: string): Promise<void> => {
    await api.delete(`/quotes/${id}`);
  },

  /**
   * Aprova um orçamento (converte para Service Order)
   */
  approve: async (id: string): Promise<{ quote: Quote; serviceOrder: any }> => {
    const response = await api.post(`/quotes/${id}/approve`);
    return response.data;
  },

  /**
   * Envia orçamento para diagnóstico do mecânico
   */
  sendForDiagnosis: async (id: string): Promise<Quote> => {
    const response = await api.post<Quote>(`/quotes/${id}/send-for-diagnosis`);
    return response.data;
  },

  /**
   * Envia orçamento ao cliente (muda status para SENT)
   */
  sendToCustomer: async (id: string): Promise<Quote> => {
    const response = await api.post<Quote>(`/quotes/${id}/send`);
    return response.data;
  },

  /**
   * Atribui um mecânico ao orçamento
   */
  assignMechanic: async (
    id: string,
    mechanicId?: string,
    reason?: string,
  ): Promise<Quote> => {
    const response = await api.post<Quote>(`/quotes/${id}/assign-mechanic`, {
      mechanicId,
      reason,
    });
    return response.data;
  },

  /**
   * Mecânico pega um orçamento disponível
   */
  claimQuote: async (id: string): Promise<Quote> => {
    const response = await api.post<Quote>(`/quotes/${id}/claim`);
    return response.data;
  },

  /**
   * Completa o diagnóstico do mecânico
   */
  completeDiagnosis: async (
    id: string,
    data: CompleteDiagnosisDto,
  ): Promise<Quote> => {
    const response = await api.post<Quote>(
      `/quotes/${id}/complete-diagnosis`,
      data,
    );
    return response.data;
  },

  /**
   * Aprovar orçamento manualmente (após assinatura física)
   */
  approveManually: async (
    id: string,
    data?: { customerSignature?: string; notes?: string },
  ): Promise<{ quote: Quote; serviceOrder: any }> => {
    const response = await api.post(`/quotes/${id}/approve-manually`, data || {});
    return response.data;
  },

  /**
   * Gera PDF do orçamento
   */
  generatePdf: async (id: string): Promise<Blob> => {
    const response = await api.get(`/quotes/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Regenerar token público do orçamento
   */
  regenerateToken: async (id: string): Promise<Quote> => {
    const response = await api.post<Quote>(`/quotes/${id}/regenerate-token`);
    return response.data;
  },
};

// API pública (sem autenticação)
const getPublicApiUrl = () => {
  if (globalThis.window === undefined) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    // Remover /api se existir no final
    return baseUrl.replace(/\/api\/?$/, '');
  }
  
  // Se estiver rodando no navegador, construir a URL corretamente
  const hostname = globalThis.window.location.hostname;
  
  // Sempre usar porta 3001 para o backend (mesmo que o frontend esteja em outra porta)
  // Detectar se é localhost ou subdomain.localhost
  const isLocalhost = hostname === 'localhost' || 
                      hostname === '127.0.0.1' || 
                      hostname.endsWith('.localhost');
  
  if (isLocalhost) {
    // Manter o hostname completo (incluindo subdomain se existir) mas usar porta 3001
    return `http://${hostname}:3001`;
  }
  
  // Para produção, tentar usar NEXT_PUBLIC_API_URL se definido
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    return apiUrl.replace(/\/api\/?$/, '');
  }
  
  // Fallback: usar mesma origem mas assumir que backend está na porta 3001
  return `${globalThis.window.location.protocol}//${hostname}:3001`;
};

export const quotesPublicApi = {
  /**
   * Visualizar orçamento por token público
   */
  viewByToken: async (token: string): Promise<Quote> => {
    const baseUrl = getPublicApiUrl();
    // Garantir que não há /api duplicado
    const apiPath = baseUrl.endsWith('/api') ? '/public/quotes/view' : '/api/public/quotes/view';
    const url = `${baseUrl}${apiPath}?token=${encodeURIComponent(token)}`;
    console.log('[quotesPublicApi] Buscando orçamento em:', url);
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Token inválido ou expirado' }));
      throw new Error(errorData.message || 'Token inválido ou expirado');
    }
    return response.json();
  },

  /**
   * Aprovar orçamento via token público
   */
  approveByToken: async (token: string, customerSignature: string): Promise<Quote> => {
    const baseUrl = getPublicApiUrl();
    const apiPath = baseUrl.endsWith('/api') ? '/public/quotes/approve' : '/api/public/quotes/approve';
    const response = await fetch(`${baseUrl}${apiPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, customerSignature }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao aprovar orçamento' }));
      throw new Error(error.message || 'Erro ao aprovar orçamento');
    }
    return response.json();
  },

  /**
   * Rejeitar orçamento via token público
   */
  rejectByToken: async (token: string, reason?: string): Promise<Quote> => {
    const baseUrl = getPublicApiUrl();
    const apiPath = baseUrl.endsWith('/api') ? '/public/quotes/reject' : '/api/public/quotes/reject';
    const response = await fetch(`${baseUrl}${apiPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, reason }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao rejeitar orçamento' }));
      throw new Error(error.message || 'Erro ao rejeitar orçamento');
    }
    return response.json();
  },
};

