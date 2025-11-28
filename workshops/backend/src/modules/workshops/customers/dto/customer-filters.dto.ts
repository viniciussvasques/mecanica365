import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CustomerFiltersDto {
  @ApiProperty({
    description: 'Buscar por nome (busca parcial)',
    example: 'João',
    required: false,
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Buscar por telefone',
    example: '(11) 98765-4321',
    required: false,
  })
  @IsString({ message: 'Telefone deve ser uma string' })
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Buscar por email',
    example: 'joao@email.com',
    required: false,
  })
  @IsString({ message: 'Email deve ser uma string' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Tipo de documento para filtrar',
    example: 'cpf',
    enum: ['cpf', 'cnpj'],
    required: false,
  })
  @IsString({ message: 'documentType deve ser uma string' })
  @IsOptional()
  documentType?: string;

  @ApiProperty({
    description: 'Buscar por CPF',
    example: '12345678901',
    required: false,
  })
  @IsString({ message: 'CPF deve ser uma string' })
  @IsOptional()
  cpf?: string;

  @ApiProperty({
    description: 'Buscar por CNPJ',
    example: '123456780001',
    required: false,
  })
  @IsString({ message: 'CNPJ deve ser uma string' })
  @IsOptional()
  cnpj?: string;

  @ApiProperty({
    description: 'Página (para paginação)',
    example: 1,
    default: 1,
    required: false,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @Min(1, { message: 'Página deve ser maior ou igual a 1' })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Itens por página (para paginação)',
    example: 20,
    default: 20,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Min(1, { message: 'Limite deve ser maior ou igual a 1' })
  @Max(100, { message: 'Limite deve ser menor ou igual a 100' })
  @IsOptional()
  limit?: number = 20;
}
