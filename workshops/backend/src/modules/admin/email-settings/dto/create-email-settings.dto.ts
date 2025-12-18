import { IsString, IsEmail, IsNumber, IsBoolean, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmailSettingsDto {
  @ApiProperty({ description: 'Nome identificador da configuração', example: 'SMTP Principal' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ description: 'Host do servidor SMTP', example: 'smtp.gmail.com' })
  @IsString()
  host: string;

  @ApiProperty({ description: 'Porta do servidor SMTP', example: 587 })
  @IsNumber()
  port: number;

  @ApiProperty({ description: 'Usar SSL/TLS', example: false })
  @IsBoolean()
  secure: boolean;

  @ApiProperty({ description: 'Usuário SMTP', example: 'usuario@exemplo.com' })
  @IsString()
  user: string;

  @ApiProperty({ description: 'Senha SMTP' })
  @IsString()
  @MinLength(4)
  password: string;

  @ApiProperty({ description: 'Email do remetente', example: 'noreply@exemplo.com' })
  @IsEmail()
  fromEmail: string;

  @ApiProperty({ description: 'Nome do remetente', example: 'Mecânica365' })
  @IsString()
  fromName: string;

  @ApiProperty({ description: 'Configuração ativa', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
