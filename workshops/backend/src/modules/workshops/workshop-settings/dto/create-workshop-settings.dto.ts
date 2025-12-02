import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateWorkshopSettingsDto {
  @ApiProperty({
    description: 'Nome de exibição da oficina',
    example: 'Oficina Mecânica Silva',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  displayName?: string;

  @ApiProperty({
    description: 'URL do logo da oficina',
    example: 'https://example.com/logo.png ou /uploads/logos/logo.png',
    required: false,
  })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({
    description: 'URL do favicon',
    example: 'https://example.com/favicon.ico',
    required: false,
  })
  @IsString()
  @IsOptional()
  faviconUrl?: string;

  @ApiProperty({
    description: 'Cor primária (hex)',
    example: '#00E0B8',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^(#[0-9A-Fa-f]{6})?$/, {
    message: 'Cor deve estar no formato hexadecimal (#RRGGBB) ou vazio',
  })
  primaryColor?: string;

  @ApiProperty({
    description: 'Cor secundária (hex)',
    example: '#3ABFF8',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^(#[0-9A-Fa-f]{6})?$/, {
    message: 'Cor deve estar no formato hexadecimal (#RRGGBB) ou vazio',
  })
  secondaryColor?: string;

  @ApiProperty({
    description: 'Cor de destaque (hex)',
    example: '#FF4E3D',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^(#[0-9A-Fa-f]{6})?$/, {
    message: 'Cor deve estar no formato hexadecimal (#RRGGBB) ou vazio',
  })
  accentColor?: string;

  @ApiProperty({
    description: 'Telefone de contato',
    example: '(11) 98765-4321',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({
    description: 'Email de contato',
    example: 'contato@oficina.com.br',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @ApiProperty({
    description: 'WhatsApp de contato',
    example: '5511987654321',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  whatsapp?: string;

  @ApiProperty({
    description: 'Endereço completo',
    example: 'Rua das Flores, 123',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'São Paulo',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiProperty({
    description: 'Estado (UF)',
    example: 'SP',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^[A-Z]{2}$|^$/, {
    message: 'Estado deve ter 2 letras maiúsculas ou estar vazio',
  })
  state?: string;

  @ApiProperty({
    description: 'CEP',
    example: '01234-567',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  zipCode?: string;

  @ApiProperty({
    description: 'País (código ISO)',
    example: 'BR',
    required: false,
    default: 'BR',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2)
  country?: string;

  @ApiProperty({
    description: 'Website',
    example: 'https://www.oficina.com.br',
    required: false,
  })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiProperty({
    description: 'Facebook',
    example: 'https://www.facebook.com/oficina',
    required: false,
  })
  @IsString()
  @IsOptional()
  facebook?: string;

  @ApiProperty({
    description: 'Instagram',
    example: 'https://www.instagram.com/oficina',
    required: false,
  })
  @IsString()
  @IsOptional()
  instagram?: string;

  @ApiProperty({
    description: 'LinkedIn',
    example: 'https://www.linkedin.com/company/oficina',
    required: false,
  })
  @IsString()
  @IsOptional()
  linkedin?: string;

  @ApiProperty({
    description: 'Mostrar logo nos orçamentos',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  showLogoOnQuotes?: boolean;

  @ApiProperty({
    description: 'Mostrar endereço nos orçamentos',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  showAddressOnQuotes?: boolean;

  @ApiProperty({
    description: 'Mostrar contato nos orçamentos',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  showContactOnQuotes?: boolean;

  @ApiProperty({
    description: 'Texto do rodapé nos orçamentos',
    example: 'Obrigado pela preferência!',
    required: false,
  })
  @IsString()
  @IsOptional()
  quoteFooterText?: string;

  @ApiProperty({
    description: 'Texto do rodapé nas faturas',
    example: 'Pagamento em até 30 dias',
    required: false,
  })
  @IsString()
  @IsOptional()
  invoiceFooterText?: string;
}
