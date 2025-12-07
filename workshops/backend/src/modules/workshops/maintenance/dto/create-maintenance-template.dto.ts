import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
  Min,
  MaxLength,
} from 'class-validator';
import { MaintenanceCategory } from './maintenance-category.enum';

export class SuggestedPartDto {
  @ApiProperty({ description: 'ID da peça' })
  @IsString()
  partId: string;

  @ApiProperty({ description: 'Quantidade' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Se é opcional' })
  @IsBoolean()
  @IsOptional()
  optional?: boolean;
}

export class MaintenanceItemDto {
  @ApiProperty({ description: 'Nome do item' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Se é obrigatório' })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;
}

export class CreateMaintenanceTemplateDto {
  @ApiProperty({ description: 'Nome do template', example: 'Revisão 10.000km' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Descrição do template' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Categoria da manutenção',
    enum: MaintenanceCategory,
  })
  @IsEnum(MaintenanceCategory)
  category: MaintenanceCategory;

  @ApiPropertyOptional({
    description: 'Intervalo em quilômetros',
    example: 10000,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  intervalKm?: number;

  @ApiPropertyOptional({ description: 'Intervalo em meses', example: 6 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  intervalMonths?: number;

  @ApiPropertyOptional({
    description: 'Itens a verificar/trocar',
    type: [MaintenanceItemDto],
  })
  @IsArray()
  @IsOptional()
  items?: MaintenanceItemDto[];

  @ApiPropertyOptional({ description: 'Custo estimado', example: 450 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedCost?: number;

  @ApiPropertyOptional({ description: 'Horas estimadas', example: 2.5 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedHours?: number;

  @ApiPropertyOptional({
    description: 'Peças sugeridas',
    type: [SuggestedPartDto],
  })
  @IsArray()
  @IsOptional()
  suggestedParts?: SuggestedPartDto[];

  @ApiPropertyOptional({ description: 'Se está ativo', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Se é template padrão do sistema',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
