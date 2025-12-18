import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TestEmailDto {
  @ApiProperty({ description: 'Email para enviar o teste', example: 'teste@exemplo.com' })
  @IsEmail()
  testEmail: string;
}
