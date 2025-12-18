'use client';

import { useState, useEffect } from 'react';
import {
  LayersIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  ClockIcon,
  LightningBoltIcon,
  ActivityLogIcon,
} from '@radix-ui/react-icons';
import { dashboardApi, DashboardSummary } from '@/lib/api';

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color,
}: Readonly<{ 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}>) {
  return (
    <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6 hover:border-[#2A2A38] transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await dashboardApi.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#FF6B6B]/20 border-t-[#FF6B6B] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard Admin</h1>
        <p className="text-gray-400">Visão geral do sistema Mecânica365</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Oficinas"
          value={summary.tenants.total}
          subtitle={`${summary.tenants.active} ativas`}
          icon={LayersIcon}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Novas (30 dias)"
          value={summary.tenants.newLast30Days}
          subtitle="Últimos 30 dias"
          icon={CheckCircledIcon}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          title="Usuários Ativos"
          value={summary.users.active}
          subtitle={`${summary.users.total} total`}
          icon={ActivityLogIcon}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatCard
          title="Receita (30d)"
          value={`R$ ${summary.revenue.last30Days.toLocaleString('pt-BR')}`}
          subtitle={`Total: R$ ${summary.revenue.total.toLocaleString('pt-BR')}`}
          icon={LightningBoltIcon}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
        />
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <LayersIcon className="mr-2" />
            Status das Oficinas
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 flex items-center">
                <CheckCircledIcon className="mr-2 text-green-500" />
                Ativas
              </span>
              <span className="text-white font-semibold">{summary.tenants.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 flex items-center">
                <ClockIcon className="mr-2 text-yellow-500" />
                Suspensas
              </span>
              <span className="text-white font-semibold">{summary.tenants.suspended}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 flex items-center">
                <CrossCircledIcon className="mr-2 text-red-500" />
                Canceladas
              </span>
              <span className="text-white font-semibold">{summary.tenants.canceled}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <LightningBoltIcon className="mr-2" />
            Suporte
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total de Tickets</span>
              <span className="text-white font-semibold">{summary.support.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 flex items-center">
                <ClockIcon className="mr-2 text-yellow-500" />
                Abertos
              </span>
              <span className="text-white font-semibold">{summary.support.open}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <ActivityLogIcon className="mr-2" />
            Jobs do Sistema
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total de Jobs</span>
              <span className="text-white font-semibold">{summary.jobs.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 flex items-center">
                <CrossCircledIcon className="mr-2 text-red-500" />
                Falhados
              </span>
              <span className="text-white font-semibold">{summary.jobs.failed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {summary.recentActivity.length > 0 && (
        <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <ActivityLogIcon className="mr-2" />
            Atividade Recente
          </h3>
          <div className="space-y-2">
            {summary.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 bg-[#1A1A24] rounded-lg hover:bg-[#1F1F28] transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <ActivityLogIcon className="text-gray-400" />
                  <div>
                    <p className="text-sm text-white">{activity.action}</p>
                    <p className="text-xs text-gray-500">
                      {activity.user?.email || 'Sistema'}
                      {activity.tenant && ` • ${activity.tenant.name}`}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(activity.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
