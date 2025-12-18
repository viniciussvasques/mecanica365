import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendBulkEmailDto {
  @ApiProperty({ description: 'Assunto do e-mail' })
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Mensagem do e-mail (texto ou HTML simples)' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Texto do botão CTA' })
  @IsOptional()
  @IsString()
  ctaText?: string;

  @ApiPropertyOptional({ description: 'URL do botão CTA' })
  @IsOptional()
  @IsString()
  ctaUrl?: string;

  @ApiPropertyOptional({ description: 'Filtros para selecionar destinatários' })
  @IsOptional()
  @IsObject()
  filters?: {
    status?: string[]; // ['active', 'suspended', etc]
    plan?: string[]; // ['starter', 'professional', etc]
    tenantIds?: string[]; // IDs específicos de tenants
  };
}
