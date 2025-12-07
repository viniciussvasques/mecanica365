import api from '../api';

// Tipos baseados no backend
export interface Symptom {
  symptom: string;
}

export interface VehicleMake {
  make: string;
}

export interface VehicleModel {
  model: string;
}

export interface SolutionStep {
  step: number;
  description: string;
}

export interface PartNeeded {
  name: string;
  partNumber?: string;
  avgCost?: number;
}

export interface KnowledgeBase {
  id: string;
  tenantId: string;
  problemTitle: string;
  problemDescription: string;
  symptoms: Symptom[];
  category: string;
  vehicleMakes: VehicleMake[];
  vehicleModels: VehicleModel[];
  solutionTitle: string;
  solutionDescription: string;
  solutionSteps: SolutionStep[];
  partsNeeded: PartNeeded[];
  estimatedCost?: number;
  estimatedTime?: number;
  successCount: number;
  failureCount: number;
  rating?: number;
  viewCount: number;
  createdById: string;
  createdByName: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeSummary {
  id: string;
  problemTitle: string;
  category: string;
  solutionTitle: string;
  successCount: number;
  rating?: number;
  isVerified: boolean;
  createdByName: string;
  createdAt: Date;
}

export interface CreateKnowledgeData {
  problemTitle: string;
  problemDescription: string;
  symptoms?: Symptom[];
  category: string;
  vehicleMakes?: VehicleMake[];
  vehicleModels?: VehicleModel[];
  solutionTitle: string;
  solutionDescription: string;
  solutionSteps?: SolutionStep[];
  partsNeeded?: PartNeeded[];
  estimatedCost?: number;
  estimatedTime?: number;
  isVerified?: boolean;
}

export interface UpdateKnowledgeData {
  problemTitle?: string;
  problemDescription?: string;
  symptoms?: Symptom[];
  category?: string;
  vehicleMakes?: VehicleMake[];
  vehicleModels?: VehicleModel[];
  solutionTitle?: string;
  solutionDescription?: string;
  solutionSteps?: SolutionStep[];
  partsNeeded?: PartNeeded[];
  estimatedCost?: number;
  estimatedTime?: number;
  isVerified?: boolean;
}

export interface RateKnowledgeData {
  rating: number;
  worked: boolean;
}

export interface KnowledgeFilters {
  search?: string;
  category?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  isVerified?: boolean;
  isActive?: boolean;
  sortBy?: 'createdAt' | 'rating' | 'successCount' | 'viewCount';
  sortOrder?: 'asc' | 'desc';
}

export const knowledgeApi = {
  /**
   * Criar nova entrada na base de conhecimento
   */
  create: async (data: CreateKnowledgeData): Promise<KnowledgeBase> => {
    const response = await api.post<KnowledgeBase>('/knowledge', data);
    return response.data;
  },

  /**
   * Listar entradas com filtros
   */
  getAll: async (filters?: KnowledgeFilters): Promise<KnowledgeSummary[]> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.vehicleMake) params.append('vehicleMake', filters.vehicleMake);
    if (filters?.vehicleModel) params.append('vehicleModel', filters.vehicleModel);
    if (filters?.isVerified !== undefined) params.append('isVerified', filters.isVerified.toString());
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get<KnowledgeSummary[]>(`/knowledge?${params.toString()}`);
    return response.data;
  },

  /**
   * Buscar soluções similares por sintomas
   */
  findSimilar: async (symptoms: string[]): Promise<KnowledgeSummary[]> => {
    const params = new URLSearchParams();
    params.append('symptoms', symptoms.join(','));

    const response = await api.get<KnowledgeSummary[]>(`/knowledge/similar?${params.toString()}`);
    return response.data;
  },

  /**
   * Buscar entrada específica
   */
  getById: async (id: string): Promise<KnowledgeBase> => {
    const response = await api.get<KnowledgeBase>(`/knowledge/${id}`);
    return response.data;
  },

  /**
   * Atualizar entrada
   */
  update: async (id: string, data: UpdateKnowledgeData): Promise<KnowledgeBase> => {
    const response = await api.patch<KnowledgeBase>(`/knowledge/${id}`, data);
    return response.data;
  },

  /**
   * Avaliar solução
   */
  rate: async (id: string, data: RateKnowledgeData): Promise<KnowledgeBase> => {
    const response = await api.post<KnowledgeBase>(`/knowledge/${id}/rate`, data);
    return response.data;
  },

  /**
   * Remover entrada
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/knowledge/${id}`);
  },
};
