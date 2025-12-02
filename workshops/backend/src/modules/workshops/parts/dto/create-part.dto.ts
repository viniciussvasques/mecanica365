import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePartDto {
  @ApiPropertyOptional({
    description: 'Número da peça (código interno)',
    maxLength: 100,
    example: 'PEC-001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  partNumber?: string;

  @ApiProperty({
    description: 'Nome da peça',
    example: 'Pastilha de Freio Dianteira',
  })
  @IsString()
  @MaxLength(255)
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
    maxLength: 100,
    example: 'Freios',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({
    description: 'Marca da peça',
    maxLength: 100,
    example: 'Bosch',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
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
    example: 50.0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  costPrice: number;

  @ApiProperty({
    description: 'Preço de venda',
    example: 80.0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  sellPrice: number;

  @ApiPropertyOptional({
    description: 'Localização física na oficina',
    maxLength: 100,
    example: 'Estoque A - Prateleira 3',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({
    description: 'Se a peça está ativa',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}
