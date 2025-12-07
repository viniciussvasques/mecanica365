import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MaintenancePredictionDto {
  @ApiProperty({ description: 'ID da previsão' })
  id: string;

  @ApiProperty({ description: 'ID do veículo' })
  vehicleId: string;

  @ApiProperty({ description: 'Nome da manutenção prevista' })
  maintenanceName: string;

  @ApiProperty({ description: 'Categoria da manutenção' })
  category: string;

  @ApiProperty({ description: 'Tipo de intervalo (km, months, years)' })
  intervalType: 'km' | 'months' | 'years';

  @ApiProperty({ description: 'Valor do intervalo' })
  intervalValue: number;

  @ApiProperty({ description: 'Quilometragem atual do veículo' })
  currentKm: number;

  @ApiProperty({ description: 'Data atual' })
  currentDate: Date;

  @ApiPropertyOptional({
    description: 'Quilometragem prevista para a manutenção',
  })
  predictedKm?: number;

  @ApiPropertyOptional({ description: 'Data prevista para a manutenção' })
  predictedDate?: Date;

  @ApiProperty({ description: 'Quilometragem até a manutenção' })
  kmUntilMaintenance: number;

  @ApiProperty({ description: 'Dias até a manutenção' })
  daysUntilMaintenance: number;

  @ApiProperty({ description: 'Nível de urgência (low, medium, high, urgent)' })
  urgency: 'low' | 'medium' | 'high' | 'urgent';

  @ApiProperty({ description: 'Confiança da previsão (0-100%)' })
  confidence: number;

  @ApiPropertyOptional({
    description: 'Baseado em quantos registros históricos',
  })
  basedOnHistoryCount?: number;

  @ApiPropertyOptional({ description: 'Custo estimado' })
  estimatedCost?: number;

  @ApiPropertyOptional({ description: 'Tempo estimado (horas)' })
  estimatedTime?: number;

  @ApiProperty({ description: 'Recomendações para a manutenção' })
  recommendations: string[];
}

export class VehiclePredictionDto {
  @ApiProperty({ description: 'ID do veículo' })
  vehicleId: string;

  @ApiProperty({ description: 'Informações básicas do veículo' })
  vehicle: {
    placa: string;
    make: string;
    model: string;
    year: number;
    currentKm: number;
  };

  @ApiProperty({ description: 'Lista de previsões de manutenção' })
  predictions: MaintenancePredictionDto[];

  @ApiProperty({ description: 'Resumo das previsões' })
  summary: {
    totalPredictions: number;
    urgentPredictions: number;
    nextMaintenanceKm?: number;
    nextMaintenanceDate?: Date;
    totalEstimatedCost: number;
  };
}

export class PredictionAlertDto {
  @ApiProperty({ description: 'ID do alerta' })
  alertId: string;

  @ApiProperty({ description: 'ID do veículo' })
  vehicleId: string;

  @ApiProperty({ description: 'Placa do veículo' })
  placa: string;

  @ApiProperty({ description: 'Tipo de alerta' })
  alertType:
    | 'upcoming_maintenance'
    | 'overdue_maintenance'
    | 'critical_maintenance';

  @ApiProperty({ description: 'Severidade' })
  severity: 'low' | 'medium' | 'high' | 'urgent';

  @ApiProperty({ description: 'Título do alerta' })
  title: string;

  @ApiProperty({ description: 'Mensagem detalhada' })
  message: string;

  @ApiProperty({ description: 'Nome da manutenção' })
  maintenanceName: string;

  @ApiPropertyOptional({ description: 'Quilometragem recomendada' })
  recommendedKm?: number;

  @ApiPropertyOptional({ description: 'Data recomendada' })
  recommendedDate?: Date;

  @ApiProperty({ description: 'Dias restantes' })
  daysRemaining: number;

  @ApiProperty({ description: 'Quilômetros restantes' })
  kmRemaining: number;

  @ApiProperty({ description: 'Ações recomendadas' })
  recommendedActions: string[];

  @ApiProperty({ description: 'Data de criação do alerta' })
  createdAt: Date;
}

export class PredictiveInsightsDto {
  @ApiProperty({ description: 'Previsões por veículo' })
  vehiclePredictions: VehiclePredictionDto[];

  @ApiProperty({ description: 'Alertas ativos' })
  alerts: PredictionAlertDto[];

  @ApiProperty({ description: 'Estatísticas gerais' })
  statistics: {
    totalVehicles: number;
    vehiclesWithPredictions: number;
    totalPredictions: number;
    urgentAlerts: number;
    totalEstimatedCost: number;
  };

  @ApiProperty({ description: 'Tendências identificadas' })
  trends: {
    mostCommonMaintenances: Array<{
      name: string;
      count: number;
      avgCost: number;
    }>;
    maintenanceByAge: Array<{ ageRange: string; maintenanceCount: number }>;
    seasonalPatterns: Array<{ month: string; maintenanceCount: number }>;
  };
}
