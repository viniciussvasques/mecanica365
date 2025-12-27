import api from '../api';

export enum IntegrationType {
    RENAVAN = 'renavan',
    VIN = 'vin',
    CEP = 'cep',
    CUSTOM = 'custom',
}

export enum IntegrationStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    ERROR = 'error',
}

export interface Integration {
    id: string;
    name: string;
    type: IntegrationType;
    apiUrl: string;
    apiKey?: string;
    config?: Record<string, unknown>;
    status: IntegrationStatus;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateIntegrationDto {
    name: string;
    type: IntegrationType;
    apiUrl: string;
    apiKey?: string;
    config?: Record<string, unknown>;
    isActive?: boolean;
}

export interface UpdateIntegrationDto {
    name?: string;
    type?: IntegrationType;
    apiUrl?: string;
    apiKey?: string;
    config?: Record<string, unknown>;
    isActive?: boolean;
}

export const integrationsApi = {
    findAll: async (): Promise<Integration[]> => {
        const response = await api.get<Integration[]>('/integrations');
        return response.data;
    },

    findOne: async (id: string): Promise<Integration> => {
        const response = await api.get<Integration>(`/integrations/${id}`);
        return response.data;
    },

    create: async (data: CreateIntegrationDto): Promise<Integration> => {
        const response = await api.post<Integration>('/integrations', data);
        return response.data;
    },

    update: async (id: string, data: UpdateIntegrationDto): Promise<Integration> => {
        const response = await api.patch<Integration>(`/integrations/${id}`, data);
        return response.data;
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`/integrations/${id}`);
    },

    test: async (id: string): Promise<{ success: boolean; message: string; data?: any }> => {
        const response = await api.post(`/integrations/${id}/test`);
        return response.data;
    }
};
