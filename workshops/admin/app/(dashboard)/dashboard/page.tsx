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
import { tenantsApi, Tenant, jobsApi, Job, auditApi, AuditLog } from '@/lib/api';

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
          <p className="text-[#8B8B9E] text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-[#6B6B7E] text-sm mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// Status Badge
function StatusBadge({ status }: Readonly<{ status: string }>) {
  const config: Record<string, { color: string; label: string }> = {
    active: { color: 'bg-[#4ADE80]/20 text-[#4ADE80]', label: 'Ativo' },
    pending: { color: 'bg-[#FBBF24]/20 text-[#FBBF24]', label: 'Pendente' },
    suspended: { color: 'bg-[#FF6B6B]/20 text-[#FF6B6B]', label: 'Suspenso' },
    cancelled: { color: 'bg-[#6B6B7E]/20 text-[#6B6B7E]', label: 'Cancelado' },
    completed: { color: 'bg-[#4ADE80]/20 text-[#4ADE80]', label: 'Concluído' },
    processing: { color: 'bg-[#3B82F6]/20 text-[#3B82F6]', label: 'Processando' },
    failed: { color: 'bg-[#FF6B6B]/20 text-[#FF6B6B]', label: 'Falhou' },
  };
  const c = config[status] || { color: 'bg-[#6B6B7E]/20 text-[#6B6B7E]', label: status };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.color}`}>{c.label}</span>;
}

export default function DashboardPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [tenantsRes, jobsRes, logsRes] = await Promise.allSettled([
        tenantsApi.findAll(),
        jobsApi.findAll({ limit: 100 }),
        auditApi.findAll({ limit: 5 }),
      ]);

      if (tenantsRes.status === 'fulfilled') setTenants(tenantsRes.value);
      if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value.data || []);
      if (logsRes.status === 'fulfilled') setLogs(logsRes.value.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'active').length,
    pending: tenants.filter(t => t.status === 'pending').length,
    suspended: tenants.filter(t => t.status === 'suspended').length,
    jobsProcessing: jobs.filter(j => j.status === 'processing').length,
    jobsCompleted: jobs.filter(j => j.status === 'completed').length,
  };

  if (isLoading) {
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
        <p className="text-[#8B8B9E]">Visão geral do sistema Mecânica365</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Tenants"
          value={stats.total}
          subtitle={`${stats.active} ativos`}
          icon={LayersIcon}
          color="bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8]"
        />
        <StatCard
          title="Tenants Ativos"
          value={stats.active}
          subtitle={`${Math.round((stats.active / (stats.total || 1)) * 100)}% do total`}
          icon={CheckCircledIcon}
          color="bg-gradient-to-br from-[#4ADE80] to-[#22C55E]"
        />
        <StatCard
          title="Pendentes"
          value={stats.pending}
          subtitle="Aguardando ativação"
          icon={ClockIcon}
          color="bg-gradient-to-br from-[#FBBF24] to-[#F59E0B]"
        />
        <StatCard
          title="Jobs Ativos"
          value={stats.jobsProcessing}
          subtitle={`${stats.jobsCompleted} concluídos`}
          icon={LightningBoltIcon}
          color="bg-gradient-to-br from-[#A855F7] to-[#7C3AED]"
        />
      </div>

      {/* Distribution & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenants by Plan */}
        <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Distribuição por Plano</h3>
          <div className="space-y-4">
            {['starter', 'professional', 'enterprise'].map((plan, i) => {
              const count = tenants.filter(t => t.plan?.includes(plan)).length;
              const pct = stats.total ? (count / stats.total) * 100 : 0;
              const colors = ['bg-[#3B82F6]', 'bg-[#A855F7]', 'bg-[#FF6B6B]'];
              return (
                <div key={plan}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#8B8B9E] capitalize">{plan}</span>
                    <span className="text-white">{count}</span>
                  </div>
                  <div className="h-2 bg-[#1F1F28] rounded-full overflow-hidden">
                    <div className={`h-full ${colors[i]} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Grid */}
        <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Status dos Tenants</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#4ADE80]/10 rounded-lg">
              <CheckCircledIcon className="w-6 h-6 text-[#4ADE80] mb-2" />
              <p className="text-2xl font-bold text-white">{stats.active}</p>
              <p className="text-[#8B8B9E] text-sm">Ativos</p>
            </div>
            <div className="p-4 bg-[#FBBF24]/10 rounded-lg">
              <ClockIcon className="w-6 h-6 text-[#FBBF24] mb-2" />
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
              <p className="text-[#8B8B9E] text-sm">Pendentes</p>
            </div>
            <div className="p-4 bg-[#FF6B6B]/10 rounded-lg">
              <CrossCircledIcon className="w-6 h-6 text-[#FF6B6B] mb-2" />
              <p className="text-2xl font-bold text-white">{stats.suspended}</p>
              <p className="text-[#8B8B9E] text-sm">Suspensos</p>
            </div>
            <div className="p-4 bg-[#6B6B7E]/10 rounded-lg">
              <CrossCircledIcon className="w-6 h-6 text-[#6B6B7E] mb-2" />
              <p className="text-2xl font-bold text-white">{tenants.filter(t => t.status === 'cancelled').length}</p>
              <p className="text-[#8B8B9E] text-sm">Cancelados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tenants */}
        <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Tenants Recentes</h3>
            <a href="/tenants" className="text-[#FF6B6B] text-sm hover:underline">Ver todos →</a>
          </div>
          <div className="space-y-3">
            {tenants.slice(0, 5).map((tenant) => (
              <div key={tenant.id} className="flex items-center justify-between p-3 bg-[#1A1A24] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">{tenant.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{tenant.name}</p>
                    <p className="text-[#6B6B7E] text-sm">{tenant.subdomain}.mecanica365.com</p>
                  </div>
                </div>
                <StatusBadge status={tenant.status} />
              </div>
            ))}
            {tenants.length === 0 && (
              <p className="text-[#6B6B7E] text-center py-4">Nenhum tenant</p>
            )}
          </div>
        </div>

        {/* Recent Logs */}
        <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Atividade Recente</h3>
            <a href="/audit" className="text-[#FF6B6B] text-sm hover:underline">Ver todos →</a>
          </div>
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-[#1A1A24] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#2A2A38] rounded-lg flex items-center justify-center">
                    <ActivityLogIcon className="w-5 h-5 text-[#8B8B9E]" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{log.action}</p>
                    <p className="text-[#6B6B7E] text-sm">{log.resource}</p>
                  </div>
                </div>
                <p className="text-[#6B6B7E] text-sm">
                  {new Date(log.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-[#6B6B7E] text-center py-4">Nenhuma atividade</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

