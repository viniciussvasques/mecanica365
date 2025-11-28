import {
  IsString,
  IsArray,
  IsEmail,
  IsOptional,
  ValidateNested,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class RecipientDto {
  @ApiProperty({
    description: 'Email do destinatário',
    example: 'cliente@example.com',
  })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiPropertyOptional({
    description: 'Nome do destinatário',
    example: 'João Silva',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Dados personalizados para substituição no template',
    example: { empresa: 'Oficina XYZ', plano: 'Professional' },
  })
  @IsOptional()
  @IsObject()
  customData?: Record<string, unknown>;
}

export class SendBulkEmailDto {
  @ApiProperty({
    description: 'Lista de destinatários',
    type: [RecipientDto],
    example: [
      { email: 'cliente1@example.com', name: 'Cliente 1' },
      { email: 'cliente2@example.com', name: 'Cliente 2' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  recipients: RecipientDto[];

  @ApiProperty({
    description: 'Assunto do email',
    example: 'Atualização Importante - Mecânica365',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @MinLength(3, { message: 'Assunto deve ter no mínimo 3 caracteres' })
  @MaxLength(200, { message: 'Assunto deve ter no máximo 200 caracteres' })
  subject: string;

  @ApiProperty({
    description:
      'Conteúdo HTML do email. Use {{name}}, {{email}} ou variáveis customizadas',
    example: '<h1>Olá {{name}}</h1><p>Seu email é {{email}}</p>',
  })
  @IsString()
  @MinLength(10, { message: 'Conteúdo HTML deve ter no mínimo 10 caracteres' })
  htmlContent: string;

  @ApiPropertyOptional({
    description: 'Conteúdo em texto puro (opcional)',
    example: 'Olá {{name}}\nSeu email é {{email}}',
  })
  @IsOptional()
  @IsString()
  textContent?: string;

  @ApiPropertyOptional({
    description: 'Nome do remetente',
    example: 'Mecânica365',
    default: 'Mecânica365',
  })
  @IsOptional()
  @IsString()
  fromName?: string;

  @ApiPropertyOptional({
    description: 'Email para resposta',
    example: 'suporte@mecanica365.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email de resposta inválido' })
  replyTo?: string;
}
