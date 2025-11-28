import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckTenantStatusDto {
  @ApiProperty({
    description:
      'Documento (CPF ou CNPJ) para verificar se existe tenant pendente',
    example: '12345678000199',
  })
  @IsString()
  document: string;

  @ApiProperty({
    description: 'Email para verificar se existe tenant pendente',
    example: 'joao@oficina.com',
  })
  @IsString()
  email: string;
}
