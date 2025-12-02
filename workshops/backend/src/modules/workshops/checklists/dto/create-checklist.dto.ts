import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsOptional,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ChecklistType, ChecklistEntityType } from './checklist-type.enum';
import { ChecklistItemDto } from './checklist-item.dto';

export class CreateChecklistDto {
  @ApiProperty({
    description: 'Tipo de entidade relacionada',
    enum: ChecklistEntityType,
    example: ChecklistEntityType.QUOTE,
  })
  @IsEnum(ChecklistEntityType)
  entityType: ChecklistEntityType;

  @ApiProperty({
    description: 'ID da entidade relacionada (Quote ou ServiceOrder)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  entityId: string;

  @ApiProperty({
    description: 'Tipo de checklist',
    enum: ChecklistType,
    example: ChecklistType.PRE_DIAGNOSIS,
  })
  @IsEnum(ChecklistType)
  checklistType: ChecklistType;

  @ApiProperty({
    description: 'Nome do checklist',
    example: 'Checklist Pré-Diagnóstico',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição do checklist',
    example: 'Checklist para verificação inicial do veículo',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Itens do checklist',
    type: [ChecklistItemDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  items: ChecklistItemDto[];
}
