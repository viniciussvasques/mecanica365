/**
 * Utilitários para mapeamento de DTOs
 * Reduz duplicação de código entre services
 */

/**
 * Converte um valor Decimal do Prisma para number
 */
export function toNumber(
  value: { toNumber: () => number } | number | null | undefined,
): number | undefined {
  if (value == null) {
    return undefined;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'object' && 'toNumber' in value) {
    return value.toNumber();
  }
  return undefined;
}

/**
 * Converte um valor para string ou undefined
 */
export function toStringOrUndefined(
  value: string | null | undefined,
): string | undefined {
  return value ?? undefined;
}

/**
 * Converte um valor para number ou undefined
 */
export function toNumberOrUndefined(
  value: number | null | undefined,
): number | undefined {
  return value ?? undefined;
}

/**
 * Converte um valor para boolean ou undefined
 */
export function toBooleanOrUndefined(
  value: boolean | null | undefined,
): boolean | undefined {
  return value ?? undefined;
}

/**
 * Mapeia um objeto relacionado (customer, vehicle, etc.) para DTO
 */
export function mapRelatedEntity<T extends { id: string }>(
  entity: T | null | undefined,
): T | undefined {
  return entity ?? undefined;
}

/**
 * Mapeia um array de entidades relacionadas
 */
export function mapRelatedEntities<T>(entities: T[] | null | undefined): T[] {
  return entities ?? [];
}
