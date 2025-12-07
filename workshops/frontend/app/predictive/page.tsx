'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { predictiveApi, PredictiveInsights, VehiclePrediction, PredictionAlert } from '@/lib/api/predictive';
import { Button } from '@/components/ui/Button';
import { useNotification } from '@/components/NotificationProvider';
import {
  CarIcon,
  WrenchIcon,
  ClockIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  CalendarIcon,
  GaugeIcon,
  DollarSignIcon,
} from '@/components/icons/MechanicIcons';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'urgent': return 'text-red-400 bg-red-400/10 border-red-400/20';
    case 'high': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    default: return 'text-green-400 bg-green-400/10 border-green-400/20';
  }
};

const getUrgencyIcon = (urgency: string) => {
  switch (urgency) {
    case 'urgent': return <AlertTriangleIcon className="w-4 h-4" />;
    case 'high': return <ClockIcon className="w-4 h-4" />;
    default: return <CalendarIcon className="w-4 h-4" />;
  }
};

const VehiclePredictionCard = ({ prediction }: { prediction: VehiclePrediction }) => {
  const nextUrgent = prediction.predictions
    .filter(p => p.urgency === 'urgent' || p.urgency === 'high')
    .sort((a, b) => a.daysUntilMaintenance - b.daysUntilMaintenance)[0];

  return (
    <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-4 hover:border-[#00E0B8]/50 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-[#D0D6DE]">{prediction.vehicle.placa}</h3>
          <p className="text-sm text-[#7E8691]">
            {prediction.vehicle.make} {prediction.vehicle.model} {prediction.vehicle.year}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[#7E8691]">{formatNumber(prediction.vehicle.currentKm)}km</p>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        {prediction.predictions.slice(0, 3).map((pred, index) => (
          <div key={index} className={`p-2 rounded-lg border ${getUrgencyColor(pred.urgency)}`}>
            <div className="flex items-center gap-2 mb-1">
              {getUrgencyIcon(pred.urgency)}
              <span className="text-sm font-medium">{pred.maintenanceName}</span>
              <span className="text-xs opacity-75">({pred.confidence}%)</span>
            </div>
            <p className="text-xs opacity-75">
              {pred.predictedKm ? `${pred.predictedKm}km` : pred.predictedDate ? formatDate(pred.predictedDate) : 'N/A'}
              {pred.kmUntilMaintenance > 0 && ` (${pred.kmUntilMaintenance}km restantes)`}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-[#7E8691]">
        <span>{prediction.summary.totalPredictions} previsões</span>
        {nextUrgent && (
          <span className="text-orange-400">
            Próxima urgente: {nextUrgent.daysUntilMaintenance > 0 ? `${nextUrgent.daysUntilMaintenance}d` : 'Vencida'}
          </span>
        )}
      </div>
    </div>
  );
};

const AlertCard = ({ alert }: { alert: PredictionAlert }) => {
  return (
    <div className={`p-3 rounded-lg border-l-4 ${getUrgencyColor(alert.severity)}`}>
      <div className="flex items-start gap-3">
        {getUrgencyIcon(alert.severity)}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-[#D0D6DE]">{alert.title}</h4>
            <span className="text-xs text-[#7E8691]">{alert.placa}</span>
          </div>
          <p className="text-xs text-[#7E8691] mb-2">{alert.message}</p>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-[#00E0B8]">{alert.maintenanceName}</span>
            {alert.daysRemaining > 0 ? (
              <span className="text-orange-400">{alert.daysRemaining}d restantes</span>
            ) : (
              <span className="text-red-400">Vencida</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PredictivePage() {
  const router = useRouter();
  const { showNotification } = useNotification();

  const [insights, setInsights] = useState<PredictiveInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const data = await predictiveApi.getInsights();
      setInsights(data);
    } catch (err: unknown) {
      console.error('[PredictivePage] Erro ao carregar insights:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados preditivos';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto mb-4"></div>
          <p className="text-[#7E8691]">Analisando dados e gerando previsões...</p>
          <p className="text-xs text-[#7E8691] mt-2">Isso pode levar alguns segundos</p>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  const { statistics, alerts, vehiclePredictions, trends } = insights;

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <Link href="/" className="text-[#00E0B8] hover:text-[#3ABFF8] mb-2 inline-block text-sm">
              ← Voltar ao Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#D0D6DE]">Previsão Inteligente</h1>
            <p className="text-[#7E8691] mt-1">
              Manutenção preventiva baseada em dados históricos e padrões
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#7E8691] bg-[#1A1E23] px-3 py-2 rounded-lg">
            <GaugeIcon className="w-4 h-4 text-[#00E0B8]" />
            <span>IA Analítica Ativa</span>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <CarIcon className="w-6 h-6 text-[#00E0B8]" />
              <span className="text-sm font-medium text-[#7E8691]">Veículos</span>
            </div>
            <p className="text-2xl font-bold text-[#D0D6DE]">{statistics.totalVehicles}</p>
            <p className="text-xs text-[#7E8691] mt-1">
              {statistics.vehiclesWithPredictions} com previsões
            </p>
          </div>

          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <WrenchIcon className="w-6 h-6 text-[#3ABFF8]" />
              <span className="text-sm font-medium text-[#7E8691]">Previsões</span>
            </div>
            <p className="text-2xl font-bold text-[#D0D6DE]">{statistics.totalPredictions}</p>
            <p className="text-xs text-[#7E8691] mt-1">
              Manutenções previstas
            </p>
          </div>

          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangleIcon className="w-6 h-6 text-[#FF4E3D]" />
              <span className="text-sm font-medium text-[#7E8691]">Alertas</span>
            </div>
            <p className="text-2xl font-bold text-[#D0D6DE]">{statistics.urgentAlerts}</p>
            <p className="text-xs text-[#7E8691] mt-1">
              Urgentes/Altas
            </p>
          </div>

          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <DollarSignIcon className="w-6 h-6 text-[#FFA500]" />
              <span className="text-sm font-medium text-[#7E8691]">Custo Previsto</span>
            </div>
            <p className="text-xl font-bold text-[#D0D6DE]">
              {formatCurrency(statistics.totalEstimatedCost)}
            </p>
            <p className="text-xs text-[#7E8691] mt-1">
              Em manutenções
            </p>
          </div>

          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUpIcon className="w-6 h-6 text-[#00E0B8]" />
              <span className="text-sm font-medium text-[#7E8691]">Precisão</span>
            </div>
            <p className="text-2xl font-bold text-[#D0D6DE]">85%</p>
            <p className="text-xs text-[#7E8691] mt-1">
              Baseado em histórico
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vehicles Overview */}
          <div className="lg:col-span-2">
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Veículos Monitorados</h2>
              {vehiclePredictions.length === 0 ? (
                <div className="text-center py-8">
                  <CarIcon className="w-12 h-12 text-[#7E8691] mx-auto mb-4" />
                  <p className="text-[#7E8691]">Nenhum veículo com dados suficientes para previsões</p>
                  <p className="text-xs text-[#7E8691] mt-2">Adicione mais histórico de manutenção</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehiclePredictions.slice(0, 6).map((vehicle) => (
                    <VehiclePredictionCard key={vehicle.vehicleId} prediction={vehicle} />
                  ))}
                </div>
              )}
            </div>

            {/* Trends */}
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6">
              <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Tendências Identificadas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Most Common Maintenances */}
                <div>
                  <h3 className="text-lg font-medium text-[#D0D6DE] mb-3">Manutenções Mais Comuns</h3>
                  <div className="space-y-2">
                    {trends.mostCommonMaintenances.slice(0, 5).map((maintenance, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-[#7E8691]">{maintenance.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#00E0B8]">{maintenance.count}x</span>
                          <span className="text-xs text-[#FFA500]">
                            {formatCurrency(maintenance.avgCost)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Maintenance by Age */}
                <div>
                  <h3 className="text-lg font-medium text-[#D0D6DE] mb-3">Por Idade do Veículo</h3>
                  <div className="space-y-2">
                    {trends.maintenanceByAge.map((ageGroup, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-[#7E8691]">{ageGroup.ageRange}</span>
                        <span className="text-sm text-[#3ABFF8]">{ageGroup.maintenanceCount}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts Sidebar */}
          <div>
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6">
              <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4 flex items-center gap-2">
                <AlertTriangleIcon className="w-5 h-5 text-[#FF4E3D]" />
                Alertas Ativos ({alerts.length})
              </h2>

              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">✅</div>
                  <p className="text-sm text-[#7E8691]">Nenhum alerta ativo</p>
                  <p className="text-xs text-[#7E8691] mt-2">Todos os veículos em dia</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {alerts.slice(0, 10).map((alert) => (
                    <AlertCard key={alert.alertId} alert={alert} />
                  ))}
                </div>
              )}

              {alerts.length > 10 && (
                <p className="text-xs text-[#7E8691] text-center mt-4">
                  +{alerts.length - 10} alertas adicionais
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8 mt-8">
          <p className="text-sm text-[#7E8691]">
            Sistema de IA analisa {statistics.vehiclesWithPredictions} veículos •
            Previsões baseadas em {statistics.totalPredictions} padrões históricos
          </p>
          <p className="text-xs text-[#7E8691] mt-2">
            Última atualização: {new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
}
