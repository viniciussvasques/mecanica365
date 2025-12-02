import api from '../api';

export enum AttachmentType {
  PHOTO_BEFORE = 'photo_before',
  PHOTO_DURING = 'photo_during',
  PHOTO_AFTER = 'photo_after',
  DOCUMENT = 'document',
  OTHER = 'other',
}

export interface Attachment {
  id: string;
  type: AttachmentType;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  url: string;
  description?: string;
  quoteId?: string;
  serviceOrderId?: string;
  customerId?: string;
  vehicleId?: string;
  uploadedById?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAttachmentDto {
  type: AttachmentType;
  description?: string;
  quoteId?: string;
  serviceOrderId?: string;
  customerId?: string;
  vehicleId?: string;
}

export interface AttachmentFilters {
  type?: AttachmentType;
  quoteId?: string;
  serviceOrderId?: string;
  customerId?: string;
  vehicleId?: string;
  uploadedById?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AttachmentListResponse {
  data: Attachment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const attachmentsApi = {
  /**
   * Upload de um novo anexo
   */
  upload: async (
    file: File,
    createAttachmentDto: CreateAttachmentDto,
  ): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', createAttachmentDto.type);
    if (createAttachmentDto.description) {
      formData.append('description', createAttachmentDto.description);
    }
    if (createAttachmentDto.quoteId) {
      formData.append('quoteId', createAttachmentDto.quoteId);
    }
    if (createAttachmentDto.serviceOrderId) {
      formData.append('serviceOrderId', createAttachmentDto.serviceOrderId);
    }
    if (createAttachmentDto.customerId) {
      formData.append('customerId', createAttachmentDto.customerId);
    }
    if (createAttachmentDto.vehicleId) {
      formData.append('vehicleId', createAttachmentDto.vehicleId);
    }

    const response = await api.post<Attachment>('/attachments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Buscar um anexo por ID
   */
  findOne: async (id: string): Promise<Attachment> => {
    const response = await api.get<Attachment>(`/attachments/${id}`);
    return response.data;
  },

  /**
   * Listar anexos com filtros
   */
  findAll: async (filters?: AttachmentFilters): Promise<AttachmentListResponse> => {
    const response = await api.get<AttachmentListResponse>('/attachments', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Atualizar um anexo
   */
  update: async (
    id: string,
    updateData: Partial<CreateAttachmentDto>,
  ): Promise<Attachment> => {
    const response = await api.patch<Attachment>(`/attachments/${id}`, updateData);
    return response.data;
  },

  /**
   * Remover um anexo
   */
  remove: async (id: string): Promise<void> => {
    await api.delete(`/attachments/${id}`);
  },
};

