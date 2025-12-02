/**
 * Status do pagamento
 */
export enum PaymentStatus {
  PENDING = 'pending', // Pendente
  PROCESSING = 'processing', // Processando
  COMPLETED = 'completed', // Completo
  FAILED = 'failed', // Falhou
  REFUNDED = 'refunded', // Reembolsado
  CANCELLED = 'cancelled', // Cancelado
}

/**
 * Método de pagamento
 */
export enum PaymentMethod {
  CASH = 'cash', // Dinheiro
  CREDIT_CARD = 'credit_card', // Cartão de crédito
  DEBIT_CARD = 'debit_card', // Cartão de débito
  PIX = 'pix', // PIX
  BOLETO = 'boleto', // Boleto
  TRANSFER = 'transfer', // Transferência bancária
}
