import api from '../api';

export enum ReportType {
  SALES = 'sales',
  SERVICES = 'services',
  FINANCIAL = 'financial',
  INVENTORY = 'inventory',
  CUSTOMERS = 'customers',
  MECHANICS = 'mechanics',
  QUOTES = 'quotes',
  INVOICES = 'invoices',
  PAYMENTS = 'payments',
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
}

export interface ReportFilters {
  serviceOrderStatus?: string;
  customerId?: string;
  mechanicId?: string;
  lowStock?: boolean;
  category?: string;
  brand?: string;
  [key: string]: string | boolean | undefined;
}

export interface GenerateReportDto {
  type: ReportType;
  format: ReportFormat;
  startDate?: string;
  endDate?: string;
  filters?: ReportFilters;
}

export interface ReportResponse {
  id: string;
  type: ReportType;
  format: ReportFormat;
  downloadUrl: string;
  url?: string; // Alias para downloadUrl
  filename?: string;
  fileSize?: number;
  size?: number; // Alias para fileSize
  generatedAt: string;
  summary?: Record<string, unknown>;
  data?: unknown;
}

export interface ReportListItem {
  id: string;
  type: ReportType;
  format: ReportFormat;
  filename: string;
  fileSize?: number;
  createdAt: string;
  summary?: Record<string, unknown>;
}

export interface ReportListResponse {
  reports: ReportListItem[];
  total: number;
  limit: number;
  offset: number;
}

export const reportsApi = {
  /**
   * Gera um relatório
   */
  generate: async (data: GenerateReportDto): Promise<ReportResponse> => {
    const response = await api.post<ReportResponse>('/reports/generate', data);
    return response.data;
  },

  /**
   * Lista relatórios gerados
   */
  findAll: async (limit = 50, offset = 0): Promise<ReportListResponse> => {
    const response = await api.get<ReportListResponse>('/reports', {
      params: { limit, offset },
    });
    return response.data;
  },

  /**
   * Busca relatório por ID
   */
  findOne: async (id: string): Promise<ReportResponse> => {
    const response = await api.get<ReportResponse>(`/reports/${id}`);
    return response.data;
  },

  /**
   * Download de relatório
   */
  download: async (id: string): Promise<Blob> => {
    const response = await api.get(`/reports/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

