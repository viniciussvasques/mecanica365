import { IsString, MinLength, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Senha atual do usuário',
    example: 'SenhaAtual123',
    minLength: 8,
    maxLength: 100,
  })
  @IsString({ message: 'Senha atual deve ser uma string' })
  @MinLength(8, { message: 'Senha atual deve ter no mínimo 8 caracteres' })
  @MaxLength(100, { message: 'Senha atual deve ter no máximo 100 caracteres' })
  currentPassword: string;

  @ApiProperty({
    description: 'Nova senha do usuário (deve conter maiúscula, minúscula e número)',
    example: 'NovaSenha123',
    minLength: 8,
    maxLength: 100,
  })
  @IsString({ message: 'Nova senha deve ser uma string' })
  @MinLength(8, { message: 'Nova senha deve ter no mínimo 8 caracteres' })
  @MaxLength(100, { message: 'Nova senha deve ter no máximo 100 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Nova senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número',
  })
  newPassword: string;

  @ApiProperty({
    description: 'Confirmação da nova senha (deve ser igual à nova senha)',
    example: 'NovaSenha123',
    minLength: 8,
    maxLength: 100,
  })
  @IsString({ message: 'Confirmação de senha deve ser uma string' })
  @MinLength(8, {
    message: 'Confirmação de senha deve ter no mínimo 8 caracteres',
  })
  @MaxLength(100, {
    message: 'Confirmação de senha deve ter no máximo 100 caracteres',
  })
  confirmPassword: string;
}

