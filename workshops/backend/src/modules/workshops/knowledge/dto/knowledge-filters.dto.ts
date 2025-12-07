import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class KnowledgeFiltersDto {
  @ApiPropertyOptional({
    description: 'Buscar por texto no título ou descrição',
    example: 'motor não pega',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por categoria',
    enum: [
      'motor',
      'freios',
      'suspensao',
      'eletrica',
      'ar_condicionado',
      'transmissao',
      'direcao',
      'pneus',
      'carroceria',
      'exaustao',
      'outros',
    ],
  })
  @IsEnum(
    [
      'motor',
      'freios',
      'suspensao',
      'eletrica',
      'ar_condicionado',
      'transmissao',
      'direcao',
      'pneus',
      'carroceria',
      'exaustao',
      'outros',
    ],
    {
      message: 'Categoria inválida',
    },
  )
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por marca de veículo',
    example: 'Fiat',
  })
  @IsString()
  @IsOptional()
  vehicleMake?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por modelo de veículo',
    example: 'Uno',
  })
  @IsString()
  @IsOptional()
  vehicleModel?: string;

  @ApiPropertyOptional({
    description: 'Mostrar apenas soluções verificadas',
    default: false,
  })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Mostrar apenas soluções ativas',
    default: true,
  })
  @Transform(({ value }) =>
    value === 'true' || value === undefined
      ? true
      : value === 'false'
        ? false
        : value,
  )
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Ordenar por campo',
    enum: ['createdAt', 'rating', 'successCount', 'viewCount'],
  })
  @IsEnum(['createdAt', 'rating', 'successCount', 'viewCount'])
  @IsOptional()
  sortBy?: 'createdAt' | 'rating' | 'successCount' | 'viewCount';

  @ApiPropertyOptional({
    description: 'Direção da ordenação',
    enum: ['asc', 'desc'],
  })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}
