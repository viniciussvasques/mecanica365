import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SymptomResponseDto {
  @ApiProperty()
  symptom: string;
}

class VehicleMakeResponseDto {
  @ApiProperty()
  make: string;
}

class VehicleModelResponseDto {
  @ApiProperty()
  model: string;
}

class SolutionStepResponseDto {
  @ApiProperty()
  step: number;

  @ApiProperty()
  description: string;
}

class PartNeededResponseDto {
  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  partNumber?: string;

  @ApiPropertyOptional()
  avgCost?: number;
}

export class KnowledgeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  problemTitle: string;

  @ApiProperty()
  problemDescription: string;

  @ApiProperty({ type: [SymptomResponseDto] })
  symptoms: SymptomResponseDto[];

  @ApiProperty()
  category: string;

  @ApiProperty({ type: [VehicleMakeResponseDto] })
  vehicleMakes: VehicleMakeResponseDto[];

  @ApiProperty({ type: [VehicleModelResponseDto] })
  vehicleModels: VehicleModelResponseDto[];

  @ApiProperty()
  solutionTitle: string;

  @ApiProperty()
  solutionDescription: string;

  @ApiProperty({ type: [SolutionStepResponseDto] })
  solutionSteps: SolutionStepResponseDto[];

  @ApiProperty({ type: [PartNeededResponseDto] })
  partsNeeded: PartNeededResponseDto[];

  @ApiPropertyOptional()
  estimatedCost?: number;

  @ApiPropertyOptional()
  estimatedTime?: number;

  @ApiProperty()
  successCount: number;

  @ApiProperty()
  failureCount: number;

  @ApiPropertyOptional()
  rating?: number;

  @ApiProperty()
  viewCount: number;

  @ApiProperty()
  createdById: string;

  @ApiProperty()
  createdByName: string;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class KnowledgeSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  problemTitle: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  solutionTitle: string;

  @ApiProperty()
  successCount: number;

  @ApiPropertyOptional()
  rating?: number;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty()
  createdByName: string;

  @ApiProperty()
  createdAt: Date;
}
