import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsDateString,
  IsArray,
  IsNumber,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ServiceOrderStatus } from './service-order-status.enum';
import { ProblemCategory } from '@modules/workshops/shared/enums/problem-category.enum';

export class CreateServiceOrderDto {
  @ApiProperty({
    description: 'ID do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString({ message: 'ID do cliente deve ser uma string' })
  @IsOptional()
  customerId?: string;

  @ApiProperty({
    description: 'ID do veículo (VIN)',
    example: '1HGBH41JXMN109186',
    required: false,
  })
  @IsString({ message: 'VIN deve ser uma string' })
  @IsOptional()
  vehicleVin?: string;

  @ApiProperty({
    description: 'Placa do veículo',
    example: 'ABC1234',
    required: false,
  })
  @IsString({ message: 'Placa deve ser uma string' })
  @IsOptional()
  vehiclePlaca?: string;

  @ApiProperty({
    description: 'Marca do veículo',
    example: 'Honda',
    required: false,
  })
  @IsString({ message: 'Marca deve ser uma string' })
  @IsOptional()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value,
  )
  vehicleMake?: string;

  @ApiProperty({
    description: 'Modelo do veículo',
    example: 'Civic',
    required: false,
  })
  @IsString({ message: 'Modelo deve ser uma string' })
  @IsOptional()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value,
  )
  vehicleModel?: string;

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
  vehicleYear?: number;

  @ApiProperty({
    description: 'Quilometragem do veículo',
    example: 50000,
    required: false,
  })
  @IsInt({ message: 'Quilometragem deve ser um número inteiro' })
  @IsOptional()
  @Min(0, { message: 'Quilometragem deve ser maior ou igual a 0' })
  vehicleMileage?: number;

  @ApiProperty({
    description: 'ID do mecânico responsável',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString({ message: 'ID do mecânico deve ser uma string' })
  @IsOptional()
  technicianId?: string;

  @ApiProperty({
    description: 'Status da ordem de serviço',
    enum: ServiceOrderStatus,
    example: ServiceOrderStatus.SCHEDULED,
    default: ServiceOrderStatus.SCHEDULED,
    required: false,
  })
  @IsEnum(ServiceOrderStatus, { message: 'Status inválido' })
  @IsOptional()
  status?: ServiceOrderStatus = ServiceOrderStatus.SCHEDULED;

  @ApiProperty({
    description: 'Data/hora do agendamento',
    example: '2024-01-15T10:00:00Z',
    required: false,
  })
  @IsDateString({}, { message: 'Data de agendamento deve ser uma data válida' })
  @IsOptional()
  appointmentDate?: string;

  @ApiProperty({
    description: 'ID do elevador para reserva (quando orçamento aprovado)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString({ message: 'ID do elevador deve ser uma string' })
  @IsOptional()
  elevatorId?: string;

  @ApiProperty({
    description: 'Horas estimadas para o serviço',
    example: 2.5,
    required: false,
  })
  @IsNumber({}, { message: 'Horas estimadas deve ser um número' })
  @IsOptional()
  @Min(0, { message: 'Horas estimadas deve ser maior ou igual a 0' })
  estimatedHours?: number;

  @ApiProperty({
    description: 'Custo de mão de obra',
    example: 150.0,
    required: false,
  })
  @IsNumber({}, { message: 'Custo de mão de obra deve ser um número' })
  @IsOptional()
  @Min(0, { message: 'Custo de mão de obra deve ser maior ou igual a 0' })
  laborCost?: number;

  @ApiProperty({
    description: 'Custo de peças',
    example: 300.0,
    required: false,
  })
  @IsNumber({}, { message: 'Custo de peças deve ser um número' })
  @IsOptional()
  @Min(0, { message: 'Custo de peças deve ser maior ou igual a 0' })
  partsCost?: number;

  @ApiProperty({
    description: 'Desconto aplicado',
    example: 50.0,
    required: false,
    default: 0,
  })
  @IsNumber({}, { message: 'Desconto deve ser um número' })
  @IsOptional()
  @Min(0, { message: 'Desconto deve ser maior ou igual a 0' })
  discount?: number = 0;

  @ApiProperty({
    description: 'Observações sobre a ordem de serviço',
    example: 'Cliente relatou barulho no freio',
    required: false,
  })
  @IsString({ message: 'Observações devem ser uma string' })
  @IsOptional()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value,
  )
  notes?: string;

  // Problema relatado pelo cliente
  @ApiProperty({
    description: 'Categoria do problema relatado pelo cliente',
    enum: ProblemCategory,
    example: ProblemCategory.FREIOS,
    required: false,
  })
  @IsEnum(ProblemCategory, { message: 'Categoria de problema inválida' })
  @IsOptional()
  reportedProblemCategory?: ProblemCategory;

  @ApiProperty({
    description: 'Descrição detalhada do problema relatado pelo cliente',
    example: 'Barulho no freio ao frear, parece estar rangendo',
    required: false,
  })
  @IsString({ message: 'Descrição do problema deve ser uma string' })
  @IsOptional()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value,
  )
  reportedProblemDescription?: string;

  @ApiProperty({
    description: 'Sintomas relatados pelo cliente',
    example: ['ruído no freio', 'barulho ao frear', 'freio rangendo'],
    type: [String],
    required: false,
  })
  @IsArray({ message: 'Sintomas devem ser um array' })
  @IsString({ each: true, message: 'Cada sintoma deve ser uma string' })
  @IsOptional()
  reportedProblemSymptoms?: string[];

  // Problema identificado pelo mecânico
  @ApiProperty({
    description: 'Categoria do problema identificado pelo mecânico',
    enum: ProblemCategory,
    example: ProblemCategory.FREIOS,
    required: false,
  })
  @IsEnum(ProblemCategory, { message: 'Categoria de problema inválida' })
  @IsOptional()
  identifiedProblemCategory?: ProblemCategory;

  @ApiProperty({
    description: 'Descrição do problema identificado pelo mecânico',
    example: 'Pastilhas de freio desgastadas, necessária troca',
    required: false,
  })
  @IsString({ message: 'Descrição do problema identificado deve ser uma string' })
  @IsOptional()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value,
  )
  identifiedProblemDescription?: string;

  @ApiProperty({
    description: 'ID do problema comum identificado (referência a CommonProblem)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString({ message: 'ID do problema comum deve ser uma string' })
  @IsOptional()
  identifiedProblemId?: string;

  @ApiProperty({
    description: 'Observações do mecânico durante diagnóstico',
    example: 'Pastilhas com 80% de desgaste, discos ainda em bom estado',
    required: false,
  })
  @IsString({ message: 'Observações de diagnóstico devem ser uma string' })
  @IsOptional()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value,
  )
  diagnosticNotes?: string;

  @ApiProperty({
    description: 'Recomendações do mecânico (troca de peça, manutenção preventiva, etc.)',
    example: 'Recomendada troca de pastilhas e verificação do sistema de freios completo',
    required: false,
  })
  @IsString({ message: 'Recomendações devem ser uma string' })
  @IsOptional()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value,
  )
  recommendations?: string;
}

