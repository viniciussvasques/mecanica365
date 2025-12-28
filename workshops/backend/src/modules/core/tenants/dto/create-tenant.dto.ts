import {
  IsString,
  MinLength,
  Matches,
  IsEnum,
  IsOptional,
  IsEmail,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
  PENDING = 'pending',
}

export enum TenantPlan {
  WORKSHOPS_STARTER = 'workshops_starter',
  WORKSHOPS_PROFESSIONAL = 'workshops_professional',
  WORKSHOPS_ENTERPRISE = 'workshops_enterprise',
}

export enum DocumentType {
  CNPJ = 'cnpj',
  CPF = 'cpf',
}

export class CreateTenantDto {
  @ApiProperty({
    description: 'Nome da oficina/empresa',
    example: 'Oficina do João',
  })
  @IsString()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  name: string;

  @ApiProperty({
    description:
      'Tipo de documento (CNPJ para empresa, CPF para pessoa física)',
    enum: DocumentType,
    example: DocumentType.CNPJ,
    default: DocumentType.CNPJ,
    required: false,
  })
  @IsEnum(DocumentType, { message: 'Tipo de documento inválido' })
  @IsOptional()
  documentType?: DocumentType;

  @ApiProperty({
    description: 'CNPJ (14 dígitos) ou CPF (11 dígitos) - apenas números',
    example: '12345678000199',
  })
  @IsString()
  @Matches(/^\d{11,14}$/, {
    message: 'Documento deve conter 11 dígitos (CPF) ou 14 dígitos (CNPJ)',
  })
  document: string;

  @ApiProperty({
    description:
      'Subdomain único para o tenant (apenas letras, números e hífen)',
    example: 'oficina-joao',
    pattern: '^[a-z0-9-]+$',
  })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Subdomain deve conter apenas letras minúsculas, números e hífen',
  })
  @MinLength(3, { message: 'Subdomain deve ter no mínimo 3 caracteres' })
  subdomain: string;

  @ApiProperty({
    description: 'Plano inicial do tenant',
    enum: TenantPlan,
    example: TenantPlan.WORKSHOPS_STARTER,
    default: TenantPlan.WORKSHOPS_STARTER,
  })
  @IsEnum(TenantPlan, { message: 'Plano inválido' })
  @IsOptional()
  plan?: TenantPlan;

  @ApiProperty({
    description: 'Status inicial do tenant',
    enum: TenantStatus,
    example: TenantStatus.PENDING,
    default: TenantStatus.PENDING,
    required: false,
  })
  @IsEnum(TenantStatus, { message: 'Status inválido' })
  @IsOptional()
  status?: TenantStatus;

  @ApiProperty({
    description: 'Email do usuário admin a ser criado automaticamente',
    example: 'admin@oficina.com',
    required: false,
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsOptional()
  adminEmail?: string;

  @ApiProperty({
    description: 'Nome do usuário admin',
    example: 'Administrador',
    required: false,
  })
  @IsString()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @IsOptional()
  adminName?: string;

  @ApiProperty({
    description: 'Senha do usuário admin',
    example: 'Admin123456',
    required: false,
  })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @IsOptional()
  adminPassword?: string;

  @ApiProperty({
    description: 'ID do link de indicação do afiliado',
    example: 'uuid',
    required: false,
  })
  @IsString()
  @IsOptional()
  referredByLinkId?: string;
}
