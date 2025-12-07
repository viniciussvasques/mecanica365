import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';
import {
  MaintenanceCategory,
  MaintenanceStatus,
  MaintenancePriority,
} from './maintenance-category.enum';

export class CreateVehicleScheduleDto {
  @ApiProperty({ description: 'ID do veículo' })
  @IsUUID()
  vehicleId: string;

  @ApiPropertyOptional({ description: 'ID do template (opcional)' })
  @IsUUID()
  @IsOptional()
  templateId?: string;

  @ApiProperty({ description: 'Nome da manutenção' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Categoria da manutenção',
    enum: MaintenanceCategory,
  })
  @IsEnum(MaintenanceCategory)
  category: MaintenanceCategory;

  @ApiPropertyOptional({
    description: 'Quilometragem para próxima manutenção',
    example: 50000,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  nextDueKm?: number;

  @ApiPropertyOptional({
    description: 'Data para próxima manutenção',
    example: '2025-06-01',
  })
  @IsDateString()
  @IsOptional()
  nextDueDate?: string;

  @ApiPropertyOptional({
    description: 'Status',
    enum: MaintenanceStatus,
    default: 'pending',
  })
  @IsEnum(MaintenanceStatus)
  @IsOptional()
  status?: MaintenanceStatus;

  @ApiPropertyOptional({
    description: 'Prioridade',
    enum: MaintenancePriority,
    default: 'normal',
  })
  @IsEnum(MaintenancePriority)
  @IsOptional()
  priority?: MaintenancePriority;

  @ApiPropertyOptional({ description: 'Custo estimado' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedCost?: number;

  @ApiPropertyOptional({ description: 'Notas' })
  @IsString()
  @IsOptional()
  notes?: string;
}
