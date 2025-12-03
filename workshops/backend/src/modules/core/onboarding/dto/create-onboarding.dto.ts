import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentType, TenantPlan } from '../../tenants/dto/create-tenant.dto';

export class CreateOnboardingDto {
  @ApiProperty({
    description: 'Nome da oficina/empresa',
    example: 'Oficina do João',
  })
  @IsString()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Email do cliente (será o usuário admin)',
    example: 'joao@oficina.com',
  })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({
    description:
      'Tipo de documento (CNPJ para empresa, CPF para pessoa física)',
    enum: DocumentType,
    example: DocumentType.CNPJ,
  })
  @IsEnum(DocumentType, { message: 'Tipo de documento inválido' })
  documentType: DocumentType;

  @ApiProperty({
    description: 'CNPJ ou CPF (apenas números)',
    example: '12345678000199',
    pattern: '^\\d{11}$|^\\d{14}$',
  })
  @IsString()
  @Matches(/^\d{11}$|^\d{14}$/, {
    message: 'Documento deve conter 11 (CPF) ou 14 (CNPJ) dígitos numéricos',
  })
  document: string;

  @ApiProperty({
    description: 'Subdomain único (apenas letras, números e hífen)',
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
    description: 'Plano escolhido',
    enum: TenantPlan,
    example: TenantPlan.WORKSHOPS_STARTER,
  })
  @IsEnum(TenantPlan, { message: 'Plano inválido' })
  plan: TenantPlan;

  @ApiProperty({
    description:
      'Senha do usuário admin (opcional - se não fornecido, será gerada após pagamento)',
    example: 'MinhaSenh@123',
    required: false,
  })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @IsOptional()
  password?: string;
}
