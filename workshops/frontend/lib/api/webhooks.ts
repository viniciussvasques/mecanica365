import api from '../api';

export interface Webhook {
    id: string;
    url: string;
    secret: string;
    events: string[];
    isActive: boolean;
    lastTriggeredAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateWebhookDto {
    url: string;
    secret: string;
    events: string[];
    isActive?: boolean;
}

export interface UpdateWebhookDto {
    url?: string;
    secret?: string;
    events?: string[];
    isActive?: boolean;
}

export const webhooksApi = {
    findAll: async (): Promise<Webhook[]> => {
        const response = await api.get<Webhook[]>('/webhooks');
        return response.data;
    },

    findOne: async (id: string): Promise<Webhook> => {
        const response = await api.get<Webhook>(`/webhooks/${id}`);
        return response.data;
    },

    create: async (data: CreateWebhookDto): Promise<Webhook> => {
        const response = await api.post<Webhook>('/webhooks', data);
        return response.data;
    },

    update: async (id: string, data: UpdateWebhookDto): Promise<Webhook> => {
        const response = await api.patch<Webhook>(`/webhooks/${id}`, data);
        return response.data;
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`/webhooks/${id}`);
    },
};

export const availableEvents = [
    { value: 'quote.approved', label: 'Orçamento Aprovado' },
    { value: 'quote.created', label: 'Orçamento Criado' },
    { value: 'service_order.created', label: 'OS Criada' },
    { value: 'service_order.completed', label: 'OS Concluída' },
    { value: 'invoice.issued', label: 'Fatura Emitida' },
    { value: 'payment.received', label: 'Pagamento Recebido' },
    { value: 'customer.created', label: 'Cliente Criado' },
    { value: 'vehicle.created', label: 'Veículo Criado' },
    { value: 'stock.low', label: 'Estoque Baixo' },
];
