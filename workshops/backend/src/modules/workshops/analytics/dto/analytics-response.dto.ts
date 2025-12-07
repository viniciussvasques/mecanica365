import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OverviewMetricsDto {
  @ApiProperty({ description: 'Total de ordens de serviço hoje' })
  todayServiceOrders: number;

  @ApiProperty({ description: 'Receita total hoje' })
  todayRevenue: number;

  @ApiProperty({ description: 'Veículos atendidos hoje' })
  todayVehicles: number;

  @ApiProperty({ description: 'Tempo médio por OS (horas)' })
  avgTimePerService: number;

  @ApiProperty({ description: 'Taxa de conclusão de OS (%)' })
  completionRate: number;

  @ApiProperty({ description: 'Receita mensal atual' })
  currentMonthRevenue: number;

  @ApiProperty({ description: 'Comparação com mês anterior (%)' })
  revenueGrowth: number;
}

export class StatusDistributionDto {
  @ApiProperty({ description: 'Status da OS' })
  status: string;

  @ApiProperty({ description: 'Quantidade' })
  count: number;

  @ApiProperty({ description: 'Percentual' })
  percentage: number;
}

export class RevenueChartDto {
  @ApiProperty({ description: 'Mês' })
  month: string;

  @ApiProperty({ description: 'Receita' })
  revenue: number;

  @ApiProperty({ description: 'Quantidade de OS' })
  serviceOrders: number;
}

export class CommonProblemDto {
  @ApiProperty({ description: 'Nome do problema' })
  problem: string;

  @ApiProperty({ description: 'Quantidade de ocorrências' })
  count: number;

  @ApiProperty({ description: 'Percentual' })
  percentage: number;

  @ApiPropertyOptional({ description: 'Custo médio' })
  avgCost?: number;
}

export class TopPartDto {
  @ApiProperty({ description: 'Nome da peça' })
  partName: string;

  @ApiProperty({ description: 'Quantidade utilizada' })
  quantity: number;

  @ApiProperty({ description: 'Valor total' })
  totalValue: number;
}

export class MechanicPerformanceDto {
  @ApiProperty({ description: 'Nome do mecânico' })
  mechanicName: string;

  @ApiProperty({ description: 'OS concluídas' })
  completedOrders: number;

  @ApiProperty({ description: 'Tempo médio por OS (horas)' })
  avgTimePerOrder: number;

  @ApiProperty({ description: 'Receita gerada' })
  revenue: number;

  @ApiProperty({ description: 'Nota média' })
  rating: number;
}

export class AlertDto {
  @ApiProperty({ description: 'Tipo do alerta' })
  type:
    | 'overdue_service_order'
    | 'low_stock'
    | 'due_maintenance'
    | 'pending_quote';

  @ApiProperty({ description: 'Severidade' })
  severity: 'low' | 'medium' | 'high' | 'urgent';

  @ApiProperty({ description: 'Título' })
  title: string;

  @ApiProperty({ description: 'Descrição' })
  description: string;

  @ApiPropertyOptional({ description: 'Dados relacionados' })
  data?: Record<string, unknown>;
}

export class DashboardAnalyticsDto {
  @ApiProperty({ description: 'Métricas de overview' })
  overview: OverviewMetricsDto;

  @ApiProperty({ description: 'Distribuição de status das OS' })
  statusDistribution: StatusDistributionDto[];

  @ApiProperty({ description: 'Dados de receita mensal (últimos 6 meses)' })
  revenueChart: RevenueChartDto[];

  @ApiProperty({ description: 'Problemas mais comuns (últimos 30 dias)' })
  commonProblems: CommonProblemDto[];

  @ApiProperty({ description: 'Peças mais utilizadas (últimos 30 dias)' })
  topParts: TopPartDto[];

  @ApiProperty({ description: 'Performance dos mecânicos (últimos 30 dias)' })
  mechanicPerformance: MechanicPerformanceDto[];

  @ApiProperty({ description: 'Alertas ativos' })
  alerts: AlertDto[];
}
