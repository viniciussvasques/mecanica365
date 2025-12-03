import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from './create-supplier.dto';

export class SupplierResponseDto {
  @ApiProperty({ description: 'ID do fornecedor' })
  id: string;

  @ApiProperty({ description: 'Nome do fornecedor' })
  name: string;

  @ApiPropertyOptional({ description: 'Tipo de documento', enum: DocumentType })
  documentType?: DocumentType | string;

  @ApiPropertyOptional({ description: 'CNPJ ou CPF' })
  document?: string;

  @ApiPropertyOptional({ description: 'Telefone' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Email' })
  email?: string;

  @ApiPropertyOptional({ description: 'Endereço' })
  address?: string;

  @ApiPropertyOptional({ description: 'Cidade' })
  city?: string;

  @ApiPropertyOptional({ description: 'Estado (UF)' })
  state?: string;

  @ApiPropertyOptional({ description: 'CEP' })
  zipCode?: string;

  @ApiPropertyOptional({ description: 'Nome do contato' })
  contactName?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  notes?: string;

  @ApiProperty({ description: 'Status ativo' })
  isActive: boolean;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}

