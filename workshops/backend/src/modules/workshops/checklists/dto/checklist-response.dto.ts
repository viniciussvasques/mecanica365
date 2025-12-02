import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ChecklistType,
  ChecklistEntityType,
  ChecklistStatus,
} from './checklist-type.enum';
import { ChecklistItemResponseDto } from './checklist-item.dto';

export class ChecklistResponseDto {
  @ApiProperty({
    description: 'ID do checklist',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Tipo de entidade relacionada',
    enum: ChecklistEntityType,
    example: ChecklistEntityType.QUOTE,
  })
  entityType: ChecklistEntityType;

  @ApiProperty({
    description: 'ID da entidade relacionada',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  entityId: string;

  @ApiProperty({
    description: 'Tipo de checklist',
    enum: ChecklistType,
    example: ChecklistType.PRE_DIAGNOSIS,
  })
  checklistType: ChecklistType;

  @ApiProperty({
    description: 'Nome do checklist',
    example: 'Checklist Pré-Diagnóstico',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição do checklist',
    example: 'Checklist para verificação inicial do veículo',
  })
  description?: string;

  @ApiProperty({
    description: 'Status do checklist',
    enum: ChecklistStatus,
    example: ChecklistStatus.PENDING,
  })
  status: ChecklistStatus;

  @ApiPropertyOptional({
    description: 'Data de conclusão',
    example: '2025-12-01T10:00:00.000Z',
  })
  completedAt?: Date;

  @ApiPropertyOptional({
    description: 'ID do usuário que completou',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  completedById?: string;

  @ApiProperty({
    description: 'Itens do checklist',
    type: [ChecklistItemResponseDto],
  })
  items: ChecklistItemResponseDto[];

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-12-01T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2025-12-01T10:00:00.000Z',
  })
  updatedAt: Date;
}
