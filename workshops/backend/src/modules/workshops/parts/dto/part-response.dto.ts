import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupplierResponseDto {
  @ApiProperty({ description: 'ID do fornecedor' })
  id: string;

  @ApiProperty({ description: 'Nome do fornecedor' })
  name: string;
}

export class PartResponseDto {
  @ApiProperty({ description: 'ID da peça' })
  id: string;

  @ApiProperty({ description: 'ID do tenant' })
  tenantId: string;

  @ApiPropertyOptional({ description: 'Número da peça' })
  partNumber?: string;

  @ApiProperty({ description: 'Nome da peça' })
  name: string;

  @ApiPropertyOptional({ description: 'Descrição da peça' })
  description?: string;

  @ApiPropertyOptional({ description: 'Categoria da peça' })
  category?: string;

  @ApiPropertyOptional({ description: 'Marca da peça' })
  brand?: string;

  @ApiPropertyOptional({ description: 'ID do fornecedor' })
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Dados do fornecedor' })
  supplier?: SupplierResponseDto;

  @ApiProperty({ description: 'Quantidade em estoque' })
  quantity: number;

  @ApiProperty({ description: 'Quantidade mínima' })
  minQuantity: number;

  @ApiProperty({ description: 'Preço de custo', type: Number })
  costPrice: number;

  @ApiProperty({ description: 'Preço de venda', type: Number })
  sellPrice: number;

  @ApiPropertyOptional({ description: 'Localização' })
  location?: string;

  @ApiProperty({ description: 'Se está ativa' })
  isActive: boolean;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}
