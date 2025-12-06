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
export const paymentGatewaysApi = {
  /**
   * Lista todos os gateways configurados
   */
  findAll: async (): Promise<PaymentGatewayConfig[]> => {
    // TODO: Implementar endpoint no backend
    // Por enquanto, retornar array vazio ou usar localStorage
    return [];
  },

  /**
   * Busca um gateway por ID
   */
  findOne: async (id: string): Promise<PaymentGatewayConfig> => {
    // TODO: Implementar endpoint no backend
    throw new Error('Not implemented');
  },

  /**
   * Cria um novo gateway
   */
  create: async (data: CreatePaymentGatewayDto): Promise<PaymentGatewayConfig> => {
    // TODO: Implementar endpoint no backend
    throw new Error('Not implemented');
  },

  /**
   * Atualiza um gateway
   */
  update: async (id: string, data: Partial<CreatePaymentGatewayDto>): Promise<PaymentGatewayConfig> => {
    // TODO: Implementar endpoint no backend
    throw new Error('Not implemented');
  },

  /**
   * Remove um gateway
   */
  remove: async (id: string): Promise<void> => {
    // TODO: Implementar endpoint no backend
    throw new Error('Not implemented');
  },

  /**
   * Testa a conexão com um gateway
   */
  testConnection: async (id: string): Promise<{ success: boolean; message: string }> => {
    // TODO: Implementar endpoint no backend
    throw new Error('Not implemented');
  },
};

