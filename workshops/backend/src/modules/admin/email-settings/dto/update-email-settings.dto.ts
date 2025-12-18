import { IsString, IsEmail, IsNumber, IsBoolean, IsOptional, MinLength, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEmailSettingsDto {
  @ApiPropertyOptional({ description: 'Nome identificador da configuração' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Host do servidor SMTP' })
  @IsString()
  @IsOptional()
  host?: string;

  @ApiPropertyOptional({ description: 'Porta do servidor SMTP' })
  @IsNumber()
  @IsOptional()
  port?: number;

  @ApiPropertyOptional({ description: 'Usar SSL/TLS' })
  @IsBoolean()
  @IsOptional()
  secure?: boolean;

  @ApiPropertyOptional({ description: 'Usuário SMTP' })
  @IsString()
  @IsOptional()
  user?: string;

  @ApiPropertyOptional({ description: 'Senha SMTP (deixe em branco para não alterar)' })
  @IsString()
  @ValidateIf((o) => o.password !== undefined && o.password !== '')
  @MinLength(4)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ description: 'Email do remetente' })
  @IsEmail()
  @IsOptional()
  fromEmail?: string;

  @ApiPropertyOptional({ description: 'Nome do remetente' })
  @IsString()
  @IsOptional()
  fromName?: string;

  @ApiPropertyOptional({ description: 'Configuração ativa' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
