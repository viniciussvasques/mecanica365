import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

class SymptomDto {
  @ApiProperty({
    description: 'Sintoma observado',
    example: 'Barulho estranho no motor',
  })
  @IsString()
  @IsNotEmpty({ message: 'Sintoma não pode ser vazio' })
  symptom: string;
}

class VehicleMakeDto {
  @ApiProperty({ description: 'Marca do veículo', example: 'Fiat' })
  @IsString()
  @IsNotEmpty({ message: 'Marca não pode ser vazia' })
  make: string;
}

class VehicleModelDto {
  @ApiProperty({ description: 'Modelo do veículo', example: 'Uno' })
  @IsString()
  @IsNotEmpty({ message: 'Modelo não pode ser vazio' })
  model: string;
}

class SolutionStepDto {
  @ApiProperty({ description: 'Número da etapa', example: 1 })
  @IsNumber()
  @Min(1, { message: 'Número da etapa deve ser pelo menos 1' })
  step: number;

  @ApiProperty({
    description: 'Descrição da etapa',
    example: 'Verificar velas de ignição',
  })
  @IsString()
  @IsNotEmpty({ message: 'Descrição da etapa não pode ser vazia' })
  description: string;
}

class PartNeededDto {
  @ApiProperty({ description: 'Nome da peça', example: 'Vela de Ignição' })
  @IsString()
  @IsNotEmpty({ message: 'Nome da peça não pode ser vazio' })
  name: string;

  @ApiPropertyOptional({ description: 'Número da peça', example: '12345' })
  @IsString()
  @IsOptional()
  partNumber?: string;

  @ApiPropertyOptional({ description: 'Custo médio da peça', example: 25.5 })
  @IsNumber()
  @Min(0, { message: 'Custo deve ser positivo' })
  @IsOptional()
  avgCost?: number;
}

export class CreateKnowledgeDto {
  @ApiProperty({
    description: 'Título do problema',
    example: 'Motor não pega',
  })
  @IsString()
  @IsNotEmpty({ message: 'Título do problema é obrigatório' })
  problemTitle: string;

  @ApiProperty({
    description: 'Descrição detalhada do problema',
    example: 'O veículo não liga mesmo com bateria carregada',
  })
  @IsString()
  @IsNotEmpty({ message: 'Descrição do problema é obrigatória' })
  problemDescription: string;

  @ApiPropertyOptional({
    description: 'Sintomas observados',
    type: [SymptomDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SymptomDto)
  @IsOptional()
  symptoms?: SymptomDto[];

  @ApiProperty({
    description: 'Categoria do problema',
    enum: [
      'motor',
      'freios',
      'suspensao',
      'eletrica',
      'ar_condicionado',
      'transmissao',
      'direcao',
      'pneus',
      'carroceria',
      'exaustao',
      'outros',
    ],
    example: 'motor',
  })
  @IsString()
  @IsNotEmpty({ message: 'Categoria é obrigatória' })
  @IsEnum(
    [
      'motor',
      'freios',
      'suspensao',
      'eletrica',
      'ar_condicionado',
      'transmissao',
      'direcao',
      'pneus',
      'carroceria',
      'exaustao',
      'outros',
    ],
    {
      message: 'Categoria inválida',
    },
  )
  category: string;

  @ApiPropertyOptional({
    description: 'Marcas de veículo afetadas',
    type: [VehicleMakeDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VehicleMakeDto)
  @IsOptional()
  vehicleMakes?: VehicleMakeDto[];

  @ApiPropertyOptional({
    description: 'Modelos de veículo afetados',
    type: [VehicleModelDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VehicleModelDto)
  @IsOptional()
  vehicleModels?: VehicleModelDto[];

  @ApiProperty({
    description: 'Título da solução',
    example: 'Substituir velas de ignição',
  })
  @IsString()
  @IsNotEmpty({ message: 'Título da solução é obrigatório' })
  solutionTitle: string;

  @ApiProperty({
    description: 'Descrição detalhada da solução',
    example: 'Substitua todas as velas de ignição por novas',
  })
  @IsString()
  @IsNotEmpty({ message: 'Descrição da solução é obrigatória' })
  solutionDescription: string;

  @ApiPropertyOptional({
    description: 'Passos da solução',
    type: [SolutionStepDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SolutionStepDto)
  @IsOptional()
  solutionSteps?: SolutionStepDto[];

  @ApiPropertyOptional({
    description: 'Peças necessárias',
    type: [PartNeededDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartNeededDto)
  @IsOptional()
  partsNeeded?: PartNeededDto[];

  @ApiPropertyOptional({
    description: 'Custo estimado da solução',
    example: 150,
  })
  @IsNumber()
  @Min(0, { message: 'Custo deve ser positivo' })
  @IsOptional()
  estimatedCost?: number;

  @ApiPropertyOptional({
    description: 'Tempo estimado em horas',
    example: 2.5,
  })
  @IsNumber()
  @Min(0, { message: 'Tempo deve ser positivo' })
  @IsOptional()
  estimatedTime?: number;

  @ApiPropertyOptional({
    description: 'Indica se é solução verificada',
    default: false,
  })
  @IsOptional()
  isVerified?: boolean = false;
}
