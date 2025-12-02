/**
 * Tipos de checklist suportados pelo sistema
 */
export enum ChecklistType {
  PRE_DIAGNOSIS = 'pre_diagnosis', // Checklist pré-diagnóstico (Quote)
  PRE_SERVICE = 'pre_service', // Checklist pré-serviço (Service Order)
  DURING_SERVICE = 'during_service', // Checklist durante serviço (Service Order)
  POST_SERVICE = 'post_service', // Checklist pós-serviço (Service Order)
}

/**
 * Tipos de entidades que podem ter checklists
 */
export enum ChecklistEntityType {
  QUOTE = 'quote',
  SERVICE_ORDER = 'service_order',
}

/**
 * Status do checklist
 */
export enum ChecklistStatus {
  PENDING = 'pending', // Pendente
  IN_PROGRESS = 'in_progress', // Em progresso
  COMPLETED = 'completed', // Completo
  CANCELLED = 'cancelled', // Cancelado
}
