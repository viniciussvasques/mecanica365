/**
 * Tipos de gateways de pagamento suportados
 */
export enum GatewayType {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  PAGSEGURO = 'pagseguro',
  MERCADO_PAGO = 'mercadopago',
  ASAAAS = 'asaas',
  GERENCIANET = 'gerencianet',
  PHYSICAL_TERMINAL = 'physical_terminal', // Maquininha física
  OTHER = 'other',
}

/**
 * Configuração de um gateway de pagamento
 */
export interface PaymentGatewayConfig {
  id: string;
  tenantId: string;
  name: string; // Nome personalizado (ex: "Stripe Principal", "Maquininha Loja 1")
  type: GatewayType;
  isActive: boolean;
  isDefault: boolean;
  
  // Credenciais (criptografadas no backend)
  credentials: {
    // Stripe
    publishableKey?: string;
    secretKey?: string;
    
    // PayPal
    clientId?: string;
    clientSecret?: string;
    paypalSandbox?: boolean;
    
    // PagSeguro
    email?: string;
    token?: string;
    pagseguroSandbox?: boolean;
    
    // Mercado Pago
    accessToken?: string;
    publicKey?: string;
    
    // Asaas
    asaasApiKey?: string;
    
    // Gerencianet
    gerencianetClientId?: string;
    gerencianetClientSecret?: string;
    gerencianetSandbox?: boolean;
    
    // Maquininha física
    terminalId?: string;
    merchantId?: string;
    
    // Outros
    otherApiKey?: string;
    otherApiSecret?: string;
    [key: string]: string | boolean | undefined;
  };
  
  // Configurações adicionais
  settings: {
    autoCapture?: boolean; // Captura automática
    installments?: {
      enabled: boolean;
      maxInstallments: number;
      minInstallmentValue: number;
    };
    webhookUrl?: string;
    notificationUrl?: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO para criar/atualizar gateway
 */
export interface CreatePaymentGatewayDto {
  name: string;
  type: GatewayType;
  isActive: boolean;
  isDefault?: boolean;
  credentials: Record<string, string | boolean | undefined>;
  settings?: {
    autoCapture?: boolean;
    installments?: {
      enabled: boolean;
      maxInstallments: number;
      minInstallmentValue: number;
    };
    webhookUrl?: string;
    notificationUrl?: string;
  };
}

/**
 * API para gerenciar gateways de pagamento
 * 
 * Nota: Esta API será implementada no backend futuramente.
 * Por enquanto, podemos usar o workshop-settings para armazenar essas configurações.
 */
import api from '../api';

export const paymentGatewaysApi = {
  findAll: async (): Promise<PaymentGatewayConfig[]> => {
    const response = await api.get<PaymentGatewayConfig[]>('/payment-gateways');
    return response.data;
  },

  create: async (
    data: CreatePaymentGatewayDto,
  ): Promise<PaymentGatewayConfig> => {
    const response = await api.post<PaymentGatewayConfig>(
      '/payment-gateways',
      data,
    );
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<CreatePaymentGatewayDto>,
  ): Promise<PaymentGatewayConfig> => {
    const response = await api.patch<PaymentGatewayConfig>(
      `/payment-gateways/${id}`,
      data,
    );
    return response.data;
  },

  setDefault: async (id: string): Promise<void> => {
    await api.patch(`/payment-gateways/${id}/default`);
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/payment-gateways/${id}`);
  },

  testConnection: async (
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(
      `/payment-gateways/${id}/test`,
      {},
    );
    return response.data;
  },
};

