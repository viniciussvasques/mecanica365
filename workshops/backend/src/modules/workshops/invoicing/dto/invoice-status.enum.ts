/**
 * Status da fatura
 */
export enum InvoiceStatus {
  DRAFT = 'draft', // Rascunho
  ISSUED = 'issued', // Emitida
  PAID = 'paid', // Paga
  OVERDUE = 'overdue', // Vencida
  CANCELLED = 'cancelled', // Cancelada
}

/**
 * Status do pagamento da fatura
 */
export enum PaymentStatus {
  PENDING = 'pending', // Pendente
  PARTIAL = 'partial', // Parcial
  PAID = 'paid', // Paga
  OVERDUE = 'overdue', // Vencida
  CANCELLED = 'cancelled', // Cancelada
}

/**
 * Tipo de fatura
 */
export enum InvoiceType {
  SERVICE = 'service', // Serviço
  SALE = 'sale', // Venda
  PART = 'part', // Peça
}
