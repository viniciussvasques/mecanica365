import { ApiProperty } from '@nestjs/swagger';

export class WorkshopSettingsResponseDto {
  @ApiProperty({ description: 'ID das configurações' })
  id: string;

  @ApiProperty({ description: 'ID do tenant' })
  tenantId: string;

  @ApiProperty({ description: 'Nome de exibição', nullable: true })
  displayName?: string;

  @ApiProperty({ description: 'URL do logo', nullable: true })
  logoUrl?: string;

  @ApiProperty({ description: 'URL do favicon', nullable: true })
  faviconUrl?: string;

  @ApiProperty({ description: 'Cor primária', nullable: true })
  primaryColor?: string;

  @ApiProperty({ description: 'Cor secundária', nullable: true })
  secondaryColor?: string;

  @ApiProperty({ description: 'Cor de destaque', nullable: true })
  accentColor?: string;

  @ApiProperty({ description: 'Telefone', nullable: true })
  phone?: string;

  @ApiProperty({ description: 'Email', nullable: true })
  email?: string;

  @ApiProperty({ description: 'WhatsApp', nullable: true })
  whatsapp?: string;

  @ApiProperty({ description: 'Endereço', nullable: true })
  address?: string;

  @ApiProperty({ description: 'Cidade', nullable: true })
  city?: string;

  @ApiProperty({ description: 'Estado', nullable: true })
  state?: string;

  @ApiProperty({ description: 'CEP', nullable: true })
  zipCode?: string;

  @ApiProperty({ description: 'País', nullable: true })
  country?: string;

  @ApiProperty({ description: 'Website', nullable: true })
  website?: string;

  @ApiProperty({ description: 'Facebook', nullable: true })
  facebook?: string;

  @ApiProperty({ description: 'Instagram', nullable: true })
  instagram?: string;

  @ApiProperty({ description: 'LinkedIn', nullable: true })
  linkedin?: string;

  @ApiProperty({ description: 'Mostrar logo nos orçamentos' })
  showLogoOnQuotes: boolean;

  @ApiProperty({ description: 'Mostrar endereço nos orçamentos' })
  showAddressOnQuotes: boolean;

  @ApiProperty({ description: 'Mostrar contato nos orçamentos' })
  showContactOnQuotes: boolean;

  @ApiProperty({
    description: 'Texto do rodapé nos orçamentos',
    nullable: true,
  })
  quoteFooterText?: string;

  @ApiProperty({ description: 'Texto do rodapé nas faturas', nullable: true })
  invoiceFooterText?: string;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}
