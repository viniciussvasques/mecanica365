import api from '../api';

// Tipos baseados no backend
export interface OverviewMetrics {
  todayServiceOrders: number;
  todayRevenue: number;
  todayVehicles: number;
  avgTimePerService: number;
  completionRate: number;
  currentMonthRevenue: number;
  revenueGrowth: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface RevenueChart {
  month: string;
  revenue: number;
  serviceOrders: number;
}

export interface CommonProblem {
  problem: string;
  count: number;
  percentage: number;
  avgCost?: number;
}

export interface TopPart {
  partName: string;
  quantity: number;
  totalValue: number;
}

export interface MechanicPerformance {
  mechanicName: string;
  completedOrders: number;
  avgTimePerOrder: number;
  revenue: number;
  rating: number;
}

export interface Alert {
  type: 'overdue_service_order' | 'low_stock' | 'due_maintenance' | 'pending_quote';
  severity: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  data?: Record<string, any>;
}

export interface DashboardAnalytics {
  overview: OverviewMetrics;
  statusDistribution: StatusDistribution[];
  revenueChart: RevenueChart[];
  commonProblems: CommonProblem[];
  topParts: TopPart[];
  mechanicPerformance: MechanicPerformance[];
  alerts: Alert[];
}

export const analyticsApi = {
  /**
   * Busca dados completos do dashboard de analytics
   */
  getDashboard: async (): Promise<DashboardAnalytics> => {
    const response = await api.get<DashboardAnalytics>('/analytics/dashboard');
    return response.data;
  },
};
