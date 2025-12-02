import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import {
  ChecklistType,
  ChecklistEntityType,
  ChecklistStatus,
} from './checklist-type.enum';

export class ChecklistFiltersDto {
  @ApiPropertyOptional({
    description: 'Tipo de entidade',
    enum: ChecklistEntityType,
  })
  @IsOptional()
  @IsEnum(ChecklistEntityType)
  entityType?: ChecklistEntityType;

  @ApiPropertyOptional({
    description: 'ID da entidade relacionada',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Tipo de checklist',
    enum: ChecklistType,
  })
  @IsOptional()
  @IsEnum(ChecklistType)
  checklistType?: ChecklistType;

  @ApiPropertyOptional({
    description: 'Status do checklist',
    enum: ChecklistStatus,
  })
  @IsOptional()
  @IsEnum(ChecklistStatus)
  status?: ChecklistStatus;

  @ApiPropertyOptional({
    description: 'Data inicial (ISO 8601)',
    example: '2025-12-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Data final (ISO 8601)',
    example: '2025-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Página (para paginação)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Limite de itens por página',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
