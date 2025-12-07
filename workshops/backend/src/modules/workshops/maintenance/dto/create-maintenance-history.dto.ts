import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsDateString,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';
import { MaintenanceCategory } from './maintenance-category.enum';

export class PartUsedDto {
  @ApiPropertyOptional({ description: 'ID da peça' })
  @IsString()
  @IsOptional()
  partId?: string;

  @ApiProperty({ description: 'Nome da peça' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Quantidade' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Custo unitário' })
  @IsNumber()
  @Min(0)
  cost: number;
}

export class ServicePerformedDto {
  @ApiProperty({ description: 'Nome do serviço' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Custo' })
  @IsNumber()
  @Min(0)
  cost: number;
}

export class CreateMaintenanceHistoryDto {
  @ApiProperty({ description: 'ID do veículo' })
  @IsUUID()
  vehicleId: string;

  @ApiPropertyOptional({ description: 'ID da manutenção programada' })
  @IsUUID()
  @IsOptional()
  scheduleId?: string;

  @ApiPropertyOptional({ description: 'ID da ordem de serviço' })
  @IsUUID()
  @IsOptional()
  serviceOrderId?: string;

  @ApiProperty({ description: 'Nome da manutenção realizada' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Categoria',
    enum: MaintenanceCategory,
  })
  @IsEnum(MaintenanceCategory)
  category: MaintenanceCategory;

  @ApiProperty({ description: 'Data da realização' })
  @IsDateString()
  performedAt: string;

  @ApiPropertyOptional({ description: 'Quilometragem quando foi feita' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  mileageAtService?: number;

  @ApiPropertyOptional({ description: 'Custo de mão de obra' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  laborCost?: number;

  @ApiPropertyOptional({ description: 'Custo de peças' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  partsCost?: number;

  @ApiPropertyOptional({ description: 'Custo total' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  totalCost?: number;

  @ApiPropertyOptional({ description: 'Peças utilizadas', type: [PartUsedDto] })
  @IsArray()
  @IsOptional()
  partsUsed?: PartUsedDto[];

  @ApiPropertyOptional({
    description: 'Serviços realizados',
    type: [ServicePerformedDto],
  })
  @IsArray()
  @IsOptional()
  servicesPerformed?: ServicePerformedDto[];

  @ApiPropertyOptional({
    description: 'Quilometragem para próxima manutenção',
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  nextDueKm?: number;

  @ApiPropertyOptional({ description: 'Data para próxima manutenção' })
  @IsDateString()
  @IsOptional()
  nextDueDate?: string;

  @ApiPropertyOptional({ description: 'Nome de quem realizou' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  performedByName?: string;

  @ApiPropertyOptional({ description: 'Notas' })
  @IsString()
  @IsOptional()
  notes?: string;
}
