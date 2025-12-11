'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CarIcon,
  PistonIcon,
  WrenchIcon,
  GearIcon,
  BrakePadIcon,
  OilIcon,
  FilterIcon,
  EngineIcon,
  ElevatorIcon,
  ScannerIcon,
  BellIcon,
  ClockIcon,
  CreditCardIcon,
  HelpIcon,
} from '@/components/icons/MechanicIcons';
import { analyticsApi, DashboardAnalytics } from '@/lib/api/analytics';
import { Button } from '@/components/ui/Button';
import { logger } from '@/lib/utils/logger';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};

// Componentes para os gráficos simples
const SimpleChart = ({ data, title }: { data: Array<{ label: string; value: number }>; title: string }) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-4">
      <h3 className="text-sm font-semibold text-[#D0D6DE] mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-[#7E8691] mb-1">
                <span>{item.label}</span>
                <span>{formatNumber(item.value)}</span>
              </div>
              <div className="w-full bg-[#0F1115] rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-[#00E0B8] to-[#3ABFF8] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatusBadge = ({ status, count }: { status: string; count: number }) => {
  const statusConfig = {
    scheduled: { label: 'Agendadas', color: 'bg-[#FFA500]/20 text-[#FFA500]' },
    awaiting_diagnosis: { label: 'Aguardando Diagnóstico', color: 'bg-[#3ABFF8]/20 text-[#3ABFF8]' },
    diagnosed: { label: 'Diagnosticadas', color: 'bg-[#00E0B8]/20 text-[#00E0B8]' },
    in_progress: { label: 'Em Andamento', color: 'bg-[#FFA500]/20 text-[#FFA500]' },
    waiting_parts: { label: 'Aguardando Peças', color: 'bg-[#FF4E3D]/20 text-[#FF4E3D]' },
    ready_for_delivery: { label: 'Pronto para Entrega', color: 'bg-[#00E0B8]/20 text-[#00E0B8]' },
    completed: { label: 'Concluídas', color: 'bg-[#00E0B8]/20 text-[#00E0B8]' },
    cancelled: { label: 'Canceladas', color: 'bg-[#7E8691]/20 text-[#7E8691]' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    color: 'bg-[#7E8691]/20 text-[#7E8691]'
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
      <span className="text-sm text-[#D0D6DE]">{count}</span>
    </div>
  );
};

const AlertCard = ({ alert }: { alert: any }) => {
  const severityColors = {
    low: 'border-[#7E8691] bg-[#7E8691]/10',
    medium: 'border-[#FFA500] bg-[#FFA500]/10',
    high: 'border-[#FF4E3D] bg-[#FF4E3D]/10',
    urgent: 'border-[#FF4E3D] bg-[#FF4E3D]/20',
  };

  const severityIcons = {
    low: <HelpIcon className="w-4 h-4 text-[#7E8691]" />,
    medium: <BellIcon className="w-4 h-4 text-[#FFA500]" />,
    high: <WrenchIcon className="w-4 h-4 text-[#FF4E3D]" />,
    urgent: <ScannerIcon className="w-4 h-4 text-[#FF4E3D]" />,
  };

  return (
    <div className={`p-3 rounded-lg border-l-4 ${severityColors[alert.severity as keyof typeof severityColors] || severityColors.low}`}>
      <div className="flex items-start gap-3">
        {severityIcons[alert.severity as keyof typeof severityIcons] || severityIcons.low}
        <div className="flex-1">
          <h4 className="text-sm font-medium text-[#D0D6DE]">{alert.title}</h4>
          <p className="text-xs text-[#7E8691] mt-1">{alert.description}</p>
        </div>
      </div>
    </div>
  );
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsApi.getDashboard();
      setData(response);
    } catch (err: unknown) {
      logger.error('[AnalyticsPage] Erro ao carregar analytics:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto mb-4"></div>
          <p className="text-[#7E8691]">Carregando dados inteligentes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-[#D0D6DE] mb-2">Erro ao carregar dados</h1>
          <p className="text-[#7E8691] mb-6">{error}</p>
          <Button onClick={loadAnalytics} variant="primary">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { overview, statusDistribution, revenueChart, commonProblems, topParts, mechanicPerformance, alerts } = data;

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-[#00E0B8] hover:text-[#3ABFF8] mb-2 inline-block text-sm">
              ← Voltar ao Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#D0D6DE]">Analytics Inteligente</h1>
            <p className="text-sm text-[#7E8691] mt-1">
              Insights e métricas para otimizar seu negócio
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#7E8691] bg-[#1A1E23] px-3 py-2 rounded-lg">
            <ScannerIcon className="w-4 h-4 text-[#00E0B8]" />
            <span>Atualizado em tempo real</span>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <WrenchIcon className="w-6 h-6 text-[#00E0B8]" />
              <span className="text-sm font-medium text-[#7E8691]">OS Hoje</span>
            </div>
            <p className="text-2xl font-bold text-[#D0D6DE]">{overview.todayServiceOrders}</p>
            <p className="text-xs text-[#7E8691] mt-1">
              {overview.todayVehicles} veículos atendidos
            </p>
          </div>

          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <CreditCardIcon className="w-6 h-6 text-[#00E0B8]" />
              <span className="text-sm font-medium text-[#7E8691]">Receita Hoje</span>
            </div>
            <p className="text-2xl font-bold text-[#D0D6DE]">
              {formatCurrency(overview.todayRevenue)}
            </p>
            <p className="text-xs text-[#7E8691] mt-1">
              {overview.revenueGrowth >= 0 ? '+' : ''}{formatPercentage(overview.revenueGrowth)} vs mês anterior
            </p>
          </div>

          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <ClockIcon className="w-6 h-6 text-[#3ABFF8]" />
              <span className="text-sm font-medium text-[#7E8691]">Tempo Médio</span>
            </div>
            <p className="text-2xl font-bold text-[#D0D6DE]">
              {overview.avgTimePerService.toFixed(1)}h
            </p>
            <p className="text-xs text-[#7E8691] mt-1">
              Por ordem de serviço
            </p>
          </div>

          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <CarIcon className="w-6 h-6 text-[#FFA500]" />
              <span className="text-sm font-medium text-[#7E8691]">Taxa Conclusão</span>
            </div>
            <p className="text-2xl font-bold text-[#D0D6DE]">
              {formatPercentage(overview.completionRate)}
            </p>
            <p className="text-xs text-[#7E8691] mt-1">
              Últimos 30 dias
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-4">
            <h3 className="text-lg font-semibold text-[#D0D6DE] mb-4 flex items-center gap-2">
              <PistonIcon className="w-5 h-5 text-[#00E0B8]" />
              Status das Ordens de Serviço
            </h3>
            <div className="space-y-3">
              {statusDistribution.map((status) => (
                <StatusBadge key={status.status} status={status.status} count={status.count} />
              ))}
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-4">
            <h3 className="text-lg font-semibold text-[#D0D6DE] mb-4 flex items-center gap-2">
              <CreditCardIcon className="w-5 h-5 text-[#00E0B8]" />
              Receita Mensal (6 meses)
            </h3>
            <SimpleChart
              data={revenueChart.map(item => ({
                label: new Date(item.month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
                value: item.revenue
              }))}
              title=""
            />
          </div>

          {/* Common Problems */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-4">
            <h3 className="text-lg font-semibold text-[#D0D6DE] mb-4 flex items-center gap-2">
              <HelpIcon className="w-5 h-5 text-[#FF4E3D]" />
              Problemas Mais Comuns (30 dias)
            </h3>
            <div className="space-y-3">
              {commonProblems.slice(0, 5).map((problem, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-[#D0D6DE] font-medium">{problem.problem}</p>
                    <p className="text-xs text-[#7E8691]">
                      {formatNumber(problem.count)} ocorrências ({formatPercentage(problem.percentage || 0)})
                    </p>
                  </div>
                  {problem.avgCost && (
                    <span className="text-xs text-[#00E0B8] font-medium">
                      {formatCurrency(problem.avgCost)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Top Parts */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-4">
            <h3 className="text-lg font-semibold text-[#D0D6DE] mb-4 flex items-center gap-2">
              <GearIcon className="w-5 h-5 text-[#FFA500]" />
              Peças Mais Utilizadas (30 dias)
            </h3>
            <div className="space-y-3">
              {topParts.map((part, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-[#D0D6DE] font-medium">{part.partName}</p>
                    <p className="text-xs text-[#7E8691]">
                      {formatNumber(part.quantity)} unidades
                    </p>
                  </div>
                  <span className="text-xs text-[#00E0B8] font-medium">
                    {formatCurrency(part.totalValue)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Section */}
        {mechanicPerformance.length > 0 && (
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-4">
            <h3 className="text-lg font-semibold text-[#D0D6DE] mb-4 flex items-center gap-2">
              <EngineIcon className="w-5 h-5 text-[#3ABFF8]" />
              Performance dos Mecânicos (30 dias)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-[#7E8691] border-b border-[#2A3038]">
                    <th className="pb-2">Mecânico</th>
                    <th className="pb-2 text-center">OS Concluídas</th>
                    <th className="pb-2 text-center">Tempo Médio</th>
                    <th className="pb-2 text-center">Receita</th>
                    <th className="pb-2 text-center">Avaliação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A3038]">
                  {mechanicPerformance.map((mechanic, index) => (
                    <tr key={index} className="text-sm">
                      <td className="py-3 text-[#D0D6DE] font-medium">
                        {mechanic.mechanicName}
                      </td>
                      <td className="py-3 text-center text-[#D0D6DE]">
                        {mechanic.completedOrders}
                      </td>
                      <td className="py-3 text-center text-[#D0D6DE]">
                        {mechanic.avgTimePerOrder.toFixed(1)}h
                      </td>
                      <td className="py-3 text-center text-[#00E0B8] font-medium">
                        {formatCurrency(mechanic.revenue)}
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-[#FFA500]">★</span>
                          <span className="text-sm text-[#D0D6DE]">{mechanic.rating.toFixed(1)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-4">
            <h3 className="text-lg font-semibold text-[#D0D6DE] mb-4 flex items-center gap-2">
              <BellIcon className="w-5 h-5 text-[#FF4E3D]" />
              Alertas Ativos ({alerts.length})
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {alerts.slice(0, 10).map((alert, index) => (
                <AlertCard key={index} alert={alert} />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-sm text-[#7E8691]">
            Dados atualizados automaticamente • Próxima atualização em alguns minutos
          </p>
        </div>
      </div>
    </div>
  );
}
