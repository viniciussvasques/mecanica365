export enum MaintenanceCategory {
  PREVENTIVE = 'preventive', // Manutenção preventiva (revisões, trocas programadas)
  CORRECTIVE = 'corrective', // Manutenção corretiva (reparos)
  INSPECTION = 'inspection', // Inspeção
  OIL_CHANGE = 'oil_change', // Troca de óleo
  BRAKE = 'brake', // Freios
  SUSPENSION = 'suspension', // Suspensão
  ENGINE = 'engine', // Motor
  TRANSMISSION = 'transmission', // Câmbio
  ELECTRICAL = 'electrical', // Elétrica
  AIR_CONDITIONING = 'air_conditioning', // Ar condicionado
  TIRES = 'tires', // Pneus
  BELTS = 'belts', // Correias
  FILTERS = 'filters', // Filtros
  FLUIDS = 'fluids', // Fluidos
  OTHER = 'other', // Outros
}

export enum MaintenanceStatus {
  PENDING = 'pending', // Pendente
  DUE = 'due', // Vence em breve
  OVERDUE = 'overdue', // Atrasada
  COMPLETED = 'completed', // Concluída
  CANCELLED = 'cancelled', // Cancelada
}

export enum MaintenancePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}
