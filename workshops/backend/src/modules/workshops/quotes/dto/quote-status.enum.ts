export enum QuoteStatus {
  DRAFT = 'draft',
  AWAITING_DIAGNOSIS = 'awaiting_diagnosis', // Aguardando avaliação do mecânico
  DIAGNOSED = 'diagnosed', // Mecânico já fez diagnóstico
  SENT = 'sent',
  VIEWED = 'viewed',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CONVERTED = 'converted',
}
