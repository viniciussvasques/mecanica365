import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Nome completo do cliente',
    example: 'João Silva',
    minLength: 3,
    maxLength: 255,
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(255, { message: 'Nome deve ter no máximo 255 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Email do cliente',
    example: 'joao.silva@email.com',
    required: false,
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    description:
      'Telefone do cliente (formato: (00) 00000-0000 ou (00) 0000-0000)',
    example: '(11) 98765-4321',
  })
  @IsString({ message: 'Telefone deve ser uma string' })
  @Matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, {
    message: 'Telefone deve estar no formato (00) 00000-0000 ou (00) 0000-0000',
  })
  phone: string;

  @ApiProperty({
    description: 'CPF do cliente (apenas números, 11 dígitos)',
    example: '12345678901',
    required: false,
  })
  @IsString({ message: 'CPF deve ser uma string' })
  @Matches(/^[0-9]{11}$/, {
    message: 'CPF deve conter exatamente 11 dígitos numéricos',
  })
  @IsOptional()
  cpf?: string;

  @ApiProperty({
    description: 'Endereço completo do cliente',
    example: 'Rua das Flores, 123 - Centro - São Paulo/SP',
    required: false,
  })
  @IsString({ message: 'Endereço deve ser uma string' })
  @MaxLength(500, { message: 'Endereço deve ter no máximo 500 caracteres' })
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'Observações sobre o cliente',
    example: 'Cliente preferencial, sempre paga em dia',
    required: false,
  })
  @IsString({ message: 'Observações deve ser uma string' })
  @MaxLength(1000, {
    message: 'Observações deve ter no máximo 1000 caracteres',
  })
  @IsOptional()
  notes?: string;
}
