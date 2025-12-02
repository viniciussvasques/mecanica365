import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';

export class ChecklistItemDto {
  @ApiProperty({
    description: 'Título do item',
    example: 'Verificar nível de óleo',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    description: 'Descrição do item',
    example: 'Verificar se o nível de óleo está entre o mínimo e máximo',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Se o item é obrigatório',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Ordem de exibição',
    example: 1,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class ChecklistItemResponseDto extends ChecklistItemDto {
  @ApiProperty({
    description: 'ID do item',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'ID do checklist',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  checklistId: string;

  @ApiProperty({
    description: 'Se o item está completo',
    example: false,
  })
  isCompleted: boolean;

  @ApiPropertyOptional({
    description: 'Data de conclusão',
    example: '2025-12-01T10:00:00.000Z',
  })
  completedAt?: Date;

  @ApiPropertyOptional({
    description: 'Notas do item',
    example: 'Óleo está no nível correto',
    maxLength: 1000,
  })
  notes?: string;

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

export class UpdateChecklistItemDto {
  @ApiPropertyOptional({
    description: 'Título do item',
    example: 'Verificar nível de óleo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Descrição do item',
    example: 'Verificar se o nível de óleo está entre o mínimo e máximo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Se o item é obrigatório',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Se o item está completo',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @ApiPropertyOptional({
    description: 'Notas do item',
    example: 'Óleo está no nível correto',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Ordem de exibição',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
