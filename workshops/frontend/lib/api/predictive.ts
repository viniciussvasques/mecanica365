import api from '../api';

// Tipos baseados no backend
export interface MaintenancePrediction {
  id: string;
  vehicleId: string;
  maintenanceName: string;
  category: string;
  intervalType: 'km' | 'months' | 'years';
  intervalValue: number;
  currentKm: number;
  currentDate: Date;
  predictedKm?: number;
  predictedDate?: Date;
  kmUntilMaintenance: number;
  daysUntilMaintenance: number;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  confidence: number;
  basedOnHistoryCount?: number;
  estimatedCost?: number;
  estimatedTime?: number;
  recommendations: string[];
}

export interface VehiclePrediction {
  vehicleId: string;
  vehicle: {
    placa: string;
    make: string;
    model: string;
    year: number;
    currentKm: number;
  };
  predictions: MaintenancePrediction[];
  summary: {
    totalPredictions: number;
    urgentPredictions: number;
    nextMaintenanceKm?: number;
    nextMaintenanceDate?: Date;
    totalEstimatedCost: number;
  };
}

export interface PredictionAlert {
  alertId: string;
  vehicleId: string;
  placa: string;
  alertType: 'upcoming_maintenance' | 'overdue_maintenance' | 'critical_maintenance';
  severity: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  maintenanceName: string;
  recommendedKm?: number;
  recommendedDate?: Date;
  daysRemaining: number;
  kmRemaining: number;
  recommendedActions: string[];
  createdAt: Date;
}

export interface PredictiveInsights {
  vehiclePredictions: VehiclePrediction[];
  alerts: PredictionAlert[];
  statistics: {
    totalVehicles: number;
    vehiclesWithPredictions: number;
    totalPredictions: number;
    urgentAlerts: number;
    totalEstimatedCost: number;
  };
  trends: {
    mostCommonMaintenances: Array<{ name: string; count: number; avgCost: number }>;
    maintenanceByAge: Array<{ ageRange: string; maintenanceCount: number }>;
    seasonalPatterns: Array<{ month: string; maintenanceCount: number }>;
  };
}

export const predictiveApi = {
  /**
   * Busca insights preditivos para dashboard
   */
  getInsights: async (): Promise<PredictiveInsights> => {
    const response = await api.get<PredictiveInsights>('/predictive/insights');
    return response.data;
  },

  /**
   * Busca previsões para um veículo específico
   */
  getVehiclePredictions: async (vehicleId: string): Promise<VehiclePrediction> => {
    const response = await api.get<VehiclePrediction>(`/predictive/vehicle/${vehicleId}`);
    return response.data;
  },

  /**
   * Busca alertas de manutenção ativos
   */
  getAlerts: async (): Promise<PredictionAlert[]> => {
    const response = await api.get<PredictionAlert[]>('/predictive/alerts');
    return response.data;
  },
};
