import api from '../api';

export enum ChecklistType {
  PRE_DIAGNOSIS = 'pre_diagnosis',
  PRE_SERVICE = 'pre_service',
  DURING_SERVICE = 'during_service',
  POST_SERVICE = 'post_service',
}

export enum ChecklistStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ChecklistEntityType {
  QUOTE = 'quote',
  SERVICE_ORDER = 'service_order',
}

export interface ChecklistItem {
  id?: string;
  checklistId?: string;
  title: string;
  description?: string;
  isRequired: boolean;
  isCompleted?: boolean;
  completedAt?: Date;
  notes?: string;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Checklist {
  id: string;
  tenantId: string;
  entityType: ChecklistEntityType;
  entityId: string;
  checklistType: ChecklistType;
  name: string;
  description?: string;
  status: ChecklistStatus;
  completedAt?: Date;
  completedById?: string;
  items: ChecklistItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChecklistDto {
  entityType: ChecklistEntityType;
  entityId: string;
  checklistType: ChecklistType;
  name: string;
  description?: string;
  items: Array<{
    title: string;
    description?: string;
    isRequired: boolean;
    order?: number;
  }>;
}

export interface UpdateChecklistDto {
  name?: string;
  description?: string;
  status?: ChecklistStatus;
  items?: Array<{
    title: string;
    description?: string;
    isRequired: boolean;
    isCompleted?: boolean;
    notes?: string;
    order?: number;
  }>;
}

export interface CompleteChecklistItemDto {
  itemId: string; // UUID do item
  isCompleted: boolean;
  notes?: string;
}

export interface CompleteChecklistDto {
  items: CompleteChecklistItemDto[];
  notes?: string;
}

export interface ChecklistFilters {
  entityType?: ChecklistEntityType;
  entityId?: string;
  checklistType?: ChecklistType;
  status?: ChecklistStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ChecklistListResponse {
  data: Checklist[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ChecklistValidationResponse {
  isValid: boolean;
  message?: string;
}

export const checklistsApi = {
  /**
   * Criar um novo checklist
   */
  create: async (createChecklistDto: CreateChecklistDto): Promise<Checklist> => {
    const response = await api.post<Checklist>('/checklists', createChecklistDto);
    return response.data;
  },

  /**
   * Buscar um checklist por ID
   */
  findOne: async (id: string): Promise<Checklist> => {
    const response = await api.get<Checklist>(`/checklists/${id}`);
    return response.data;
  },

  /**
   * Listar checklists com filtros
   */
  findAll: async (filters?: ChecklistFilters): Promise<ChecklistListResponse> => {
    const response = await api.get<ChecklistListResponse>('/checklists', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Atualizar um checklist
   */
  update: async (
    id: string,
    updateChecklistDto: UpdateChecklistDto,
  ): Promise<Checklist> => {
    const response = await api.patch<Checklist>(`/checklists/${id}`, updateChecklistDto);
    return response.data;
  },

  /**
   * Completar um checklist
   */
  complete: async (
    id: string,
    completeChecklistDto: CompleteChecklistDto,
  ): Promise<Checklist> => {
    const response = await api.post<Checklist>(
      `/checklists/${id}/complete`,
      completeChecklistDto,
    );
    return response.data;
  },

  /**
   * Validar um checklist
   */
  validate: async (id: string): Promise<ChecklistValidationResponse> => {
    const response = await api.get<ChecklistValidationResponse>(
      `/checklists/${id}/validate`,
    );
    return response.data;
  },

  /**
   * Remover um checklist
   */
  remove: async (id: string): Promise<void> => {
    await api.delete(`/checklists/${id}`);
  },
};

