import api from '../api';

export interface WorkshopSettings {
  id: string;
  tenantId: string;
  displayName?: string;
  logoUrl?: string;
  faviconUrl?: string;
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
  country?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  showLogoOnQuotes: boolean;
  showAddressOnQuotes: boolean;
  showContactOnQuotes: boolean;
  quoteFooterText?: string;
  invoiceFooterText?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkshopSettingsDto {
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
  country?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  showLogoOnQuotes?: boolean;
  showAddressOnQuotes?: boolean;
  showContactOnQuotes?: boolean;
  quoteFooterText?: string;
  invoiceFooterText?: string;
}

export type UpdateWorkshopSettingsDto = Partial<CreateWorkshopSettingsDto>;

export const workshopSettingsApi = {
  /**
   * Busca as configurações da oficina
   */
  async findOne(): Promise<WorkshopSettings> {
    const response = await api.get<WorkshopSettings>('/workshop-settings');
    return response.data;
  },

  /**
   * Cria ou atualiza as configurações da oficina
   */
  async upsert(data: CreateWorkshopSettingsDto): Promise<WorkshopSettings> {
    const response = await api.post<WorkshopSettings>('/workshop-settings', data);
    return response.data;
  },

  /**
   * Atualiza as configurações da oficina
   */
  async update(data: UpdateWorkshopSettingsDto): Promise<WorkshopSettings> {
    const response = await api.patch<WorkshopSettings>('/workshop-settings', data);
    return response.data;
  },

  /**
   * Faz upload do logo da oficina
   */
  async uploadLogo(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<{ url: string }>(
      '/workshop-settings/upload-logo',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  },
};

