import api from '../api';

export enum AutomationTrigger {
    QUOTE_APPROVED = 'quote.approved',
    SERVICE_ORDER_COMPLETED = 'service_order.completed',
    INVOICE_ISSUED = 'invoice.issued',
    PAYMENT_RECEIVED = 'payment.received',
    STOCK_LOW = 'stock.low',
    APPOINTMENT_SCHEDULED = 'appointment.scheduled',
    CUSTOM = 'custom',
}

export enum AutomationAction {
    SEND_EMAIL = 'send_email',
    SEND_SMS = 'send_sms',
    CREATE_NOTIFICATION = 'create_notification',
    CREATE_JOB = 'create_job',
    UPDATE_STATUS = 'update_status',
    CUSTOM = 'custom',
}

export interface Automation {
    id: string;
    name: string;
    description: string;
    trigger: AutomationTrigger;
    action: AutomationAction;
    conditions?: Record<string, unknown>;
    actionConfig: Record<string, unknown>;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateAutomationDto {
    name: string;
    description: string;
    trigger: AutomationTrigger;
    action: AutomationAction;
    conditions?: Record<string, unknown>;
    actionConfig: Record<string, unknown>;
    isActive?: boolean;
}

export interface UpdateAutomationDto {
    name?: string;
    description?: string;
    trigger?: AutomationTrigger;
    action?: AutomationAction;
    conditions?: Record<string, unknown>;
    actionConfig?: Record<string, unknown>;
    isActive?: boolean;
}

export const automationsApi = {
    findAll: async (): Promise<Automation[]> => {
        const response = await api.get<Automation[]>('/automations');
        return response.data;
    },

    findOne: async (id: string): Promise<Automation> => {
        const response = await api.get<Automation>(`/automations/${id}`);
        return response.data;
    },

    create: async (data: CreateAutomationDto): Promise<Automation> => {
        const response = await api.post<Automation>('/automations', data);
        return response.data;
    },

    update: async (id: string, data: UpdateAutomationDto): Promise<Automation> => {
        const response = await api.patch<Automation>(`/automations/${id}`, data);
        return response.data;
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`/automations/${id}`);
    },

    execute: async (id: string, data: Record<string, unknown>): Promise<unknown> => {
        const response = await api.post(`/automations/${id}/execute`, data);
        return response.data;
    },
};
