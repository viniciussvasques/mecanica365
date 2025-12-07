import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MaintenanceCategory,
  MaintenanceStatus,
  MaintenancePriority,
} from './maintenance-category.enum';

// Template Response
export class MaintenanceTemplateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: MaintenanceCategory })
  category: MaintenanceCategory;

  @ApiPropertyOptional()
  intervalKm?: number;

  @ApiPropertyOptional()
  intervalMonths?: number;

  @ApiPropertyOptional()
  items?: unknown[];

  @ApiPropertyOptional()
  estimatedCost?: number;

  @ApiPropertyOptional()
  estimatedHours?: number;

  @ApiPropertyOptional()
  suggestedParts?: unknown[];

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// Vehicle Schedule Response
export class VehicleScheduleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  vehicleId: string;

  @ApiPropertyOptional()
  templateId?: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: MaintenanceCategory })
  category: MaintenanceCategory;

  @ApiPropertyOptional()
  nextDueKm?: number;

  @ApiPropertyOptional()
  nextDueDate?: Date;

  @ApiProperty({ enum: MaintenanceStatus })
  status: MaintenanceStatus;

  @ApiProperty({ enum: MaintenancePriority })
  priority: MaintenancePriority;

  @ApiPropertyOptional()
  alertSentAt?: Date;

  @ApiProperty()
  alertDismissed: boolean;

  @ApiPropertyOptional()
  estimatedCost?: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiPropertyOptional()
  completedById?: string;

  // Relações
  @ApiPropertyOptional()
  vehicle?: {
    id: string;
    make?: string;
    model?: string;
    year?: number;
    placa?: string;
  };

  @ApiPropertyOptional()
  template?: {
    id: string;
    name: string;
  };
}

// Maintenance History Response
export class MaintenanceHistoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  vehicleId: string;

  @ApiPropertyOptional()
  scheduleId?: string;

  @ApiPropertyOptional()
  serviceOrderId?: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: MaintenanceCategory })
  category: MaintenanceCategory;

  @ApiProperty()
  performedAt: Date;

  @ApiPropertyOptional()
  mileageAtService?: number;

  @ApiPropertyOptional()
  laborCost?: number;

  @ApiPropertyOptional()
  partsCost?: number;

  @ApiPropertyOptional()
  totalCost?: number;

  @ApiPropertyOptional()
  partsUsed?: unknown[];

  @ApiPropertyOptional()
  servicesPerformed?: unknown[];

  @ApiPropertyOptional()
  nextDueKm?: number;

  @ApiPropertyOptional()
  nextDueDate?: Date;

  @ApiPropertyOptional()
  performedById?: string;

  @ApiPropertyOptional()
  performedByName?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  // Relações
  @ApiPropertyOptional()
  vehicle?: {
    id: string;
    make?: string;
    model?: string;
    year?: number;
    placa?: string;
  };

  @ApiPropertyOptional()
  serviceOrder?: {
    id: string;
    number: string;
  };
}

// Maintenance Alert Response
export class MaintenanceAlertDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  vehicleId: string;

  @ApiProperty()
  maintenanceName: string;

  @ApiProperty({ enum: MaintenanceCategory })
  category: MaintenanceCategory;

  @ApiProperty({ enum: MaintenancePriority })
  priority: MaintenancePriority;

  @ApiPropertyOptional()
  dueKm?: number;

  @ApiPropertyOptional()
  dueDate?: Date;

  @ApiProperty()
  isOverdue: boolean;

  @ApiProperty()
  daysUntilDue: number;

  @ApiPropertyOptional()
  kmUntilDue?: number;

  @ApiPropertyOptional()
  estimatedCost?: number;

  @ApiProperty()
  vehicle: {
    id: string;
    make?: string;
    model?: string;
    year?: number;
    placa?: string;
    mileage?: number;
  };

  @ApiPropertyOptional()
  customer?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
}
