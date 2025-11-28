import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
  Max,
  Matches,
  MaxLength,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty({
    description: 'ID do cliente proprietário do veículo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'ID do cliente deve ser uma string' })
  customerId: string;

  @ApiProperty({
    description: 'VIN (Vehicle Identification Number) - 17 caracteres. Obrigatório se RENAVAN e Placa não forem informados',
    example: '1HGBH41JXMN109186',
    required: false,
  })
  @IsString({ message: 'VIN deve ser uma string' })
  @IsOptional()
  @Length(17, 17, { message: 'VIN deve ter exatamente 17 caracteres' })
  @Matches(/^[A-HJ-NPR-Z0-9]{17}$/i, {
    message: 'VIN inválido. Deve conter apenas letras e números (exceto I, O, Q)',
  })
  vin?: string;

  @ApiProperty({
    description: 'RENAVAN (Registro Nacional de Veículos Automotores) - 11 dígitos',
    example: '12345678901',
    required: false,
  })
  @IsString({ message: 'RENAVAN deve ser uma string' })
  @IsOptional()
  @Length(11, 11, { message: 'RENAVAN deve ter exatamente 11 dígitos' })
  @Matches(/^[0-9]{11}$/, {
    message: 'RENAVAN inválido. Deve conter exatamente 11 dígitos numéricos',
  })
  renavan?: string;

  @ApiProperty({
    description: 'Placa do veículo (formato: ABC1234 ou ABC1D23)',
    example: 'ABC1234',
    required: false,
  })
  @IsString({ message: 'Placa deve ser uma string' })
  @IsOptional()
  @Matches(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/i, {
    message: 'Placa inválida. Use o formato ABC1234 (Mercosul) ou ABC1D23 (antigo)',
  })
  placa?: string;

  @ApiProperty({
    description: 'Marca do veículo',
    example: 'Honda',
    required: false,
  })
  @IsString({ message: 'Marca deve ser uma string' })
  @IsOptional()
  @MaxLength(100, { message: 'Marca deve ter no máximo 100 caracteres' })
  make?: string;

  @ApiProperty({
    description: 'Modelo do veículo',
    example: 'Civic',
    required: false,
  })
  @IsString({ message: 'Modelo deve ser uma string' })
  @IsOptional()
  @MaxLength(100, { message: 'Modelo deve ter no máximo 100 caracteres' })
  model?: string;

  @ApiProperty({
    description: 'Ano do veículo',
    example: 2020,
    required: false,
  })
  @IsInt({ message: 'Ano deve ser um número inteiro' })
  @IsOptional()
  @Min(1900, { message: 'Ano deve ser maior ou igual a 1900' })
  @Max(new Date().getFullYear() + 1, {
    message: `Ano deve ser menor ou igual a ${new Date().getFullYear() + 1}`,
  })
  year?: number;

  @ApiProperty({
    description: 'Cor do veículo',
    example: 'Branco',
    required: false,
  })
  @IsString({ message: 'Cor deve ser uma string' })
  @IsOptional()
  @MaxLength(50, { message: 'Cor deve ter no máximo 50 caracteres' })
  color?: string;

  @ApiProperty({
    description: 'Quilometragem atual do veículo',
    example: 50000,
    required: false,
  })
  @IsInt({ message: 'Quilometragem deve ser um número inteiro' })
  @IsOptional()
  @Min(0, { message: 'Quilometragem deve ser maior ou igual a 0' })
  mileage?: number;

  @ApiProperty({
    description: 'Se este é o veículo padrão do cliente',
    example: false,
    required: false,
    default: false,
  })
  @IsBoolean({ message: 'isDefault deve ser um booleano' })
  @IsOptional()
  isDefault?: boolean;
}

