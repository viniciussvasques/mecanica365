import {
  IsArray,
  ValidateNested,
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ImportPartItemDto {
  @ApiPropertyOptional({
    description: 'Número da peça (código interno)',
    example: 'PEC-001',
  })
  @IsOptional()
  @IsString()
  partNumber?: string;

  @ApiProperty({
    description: 'Nome da peça',
    example: 'Pastilha de Freio Dianteira',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada da peça',
    example: 'Pastilha de freio para eixo dianteiro',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Categoria da peça',
    example: 'Freios',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Marca da peça',
    example: 'Bosch',
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({
    description: 'ID do fornecedor',
    example: 'uuid-do-fornecedor',
  })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiProperty({
    description: 'Quantidade em estoque',
    example: 10,
    default: 0,
  })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({
    description: 'Quantidade mínima em estoque (alerta)',
    example: 5,
    default: 0,
  })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minQuantity: number;

  @ApiProperty({
    description: 'Preço de custo',
    example: 50,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  costPrice: number;

  @ApiProperty({
    description: 'Preço de venda',
    example: 80,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  sellPrice: number;

  @ApiPropertyOptional({
    description: 'Localização física na oficina',
    example: 'Estoque A - Prateleira 3',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Se a peça está ativa',
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;
}

export class ImportPartsDto {
  @ApiProperty({
    description: 'Lista de peças para importar',
    type: [ImportPartItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportPartItemDto)
  parts: ImportPartItemDto[];
}

export class ImportPartsResponseDto {
  @ApiProperty({ description: 'Total de peças processadas' })
  total: number;

  @ApiProperty({ description: 'Peças criadas com sucesso' })
  created: number;

  @ApiProperty({ description: 'Peças atualizadas (se partNumber já existir)' })
  updated: number;

  @ApiProperty({ description: 'Peças com erro' })
  errors: number;

  @ApiProperty({
    description: 'Lista de erros detalhados',
    type: [Object],
  })
  errorDetails: Array<{
    row: number;
    partNumber?: string;
    name?: string;
    error: string;
  }>;
}
