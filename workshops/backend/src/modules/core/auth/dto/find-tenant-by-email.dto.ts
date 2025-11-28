import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindTenantByEmailDto {
  @ApiProperty({
    description: 'Email do usuário para buscar o tenant',
    example: 'usuario@oficina.com',
  })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;
}

