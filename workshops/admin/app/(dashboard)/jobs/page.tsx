'use client';

import { useState, useEffect } from 'react';
import { ReloadIcon, LightningBoltIcon, CheckCircledIcon, CrossCircledIcon, ClockIcon, GearIcon } from '@radix-ui/react-icons';
import { jobsApi, Job } from '@/lib/api';

function StatusBadge({ status }: Readonly<{ status: string }>) {
  const config: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    pending: { color: 'bg-[#FBBF24]/20 text-[#FBBF24]', label: 'Pendente', icon: <ClockIcon className="w-3 h-3" /> },
    processing: { color: 'bg-[#3B82F6]/20 text-[#3B82F6]', label: 'Processando', icon: <GearIcon className="w-3 h-3 animate-spin" /> },
    completed: { color: 'bg-[#4ADE80]/20 text-[#4ADE80]', label: 'Concluído', icon: <CheckCircledIcon className="w-3 h-3" /> },
    failed: { color: 'bg-[#FF6B6B]/20 text-[#FF6B6B]', label: 'Falhou', icon: <CrossCircledIcon className="w-3 h-3" /> },
  };
  const c = config[status] || { color: 'bg-[#6B6B7E]/20 text-[#6B6B7E]', label: status, icon: null };
  return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${c.color}`}>{c.icon}{c.label}</span>;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<{ type?: string; status?: string; page: number; limit: number }>({ page: 1, limit: 20 });
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<Job | null>(null);

  useEffect(() => { loadJobs(); }, [filters]);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const res = await jobsApi.findAll(filters);
      setJobs(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (error) {
      console.error('Erro:', error);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = {
    pending: jobs.filter(j => j.status === 'pending').length,
    processing: jobs.filter(j => j.status === 'processing').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-white">Jobs</h1><p className="text-[#8B8B9E] mt-1">Monitoramento de tarefas em background</p></div>
        <button onClick={loadJobs} className="flex items-center gap-2 px-4 py-2 bg-[#12121A] border border-[#1F1F28] rounded-lg text-[#8B8B9E] hover:text-white"><ReloadIcon className="w-4 h-4" />Atualizar</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-4"><div className="flex items-center gap-3"><div className="p-2 bg-[#FBBF24]/20 rounded-lg"><ClockIcon className="w-5 h-5 text-[#FBBF24]" /></div><div><p className="text-2xl font-bold text-white">{stats.pending}</p><p className="text-[#6B6B7E] text-sm">Pendentes</p></div></div></div>
        <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-4"><div className="flex items-center gap-3"><div className="p-2 bg-[#3B82F6]/20 rounded-lg"><GearIcon className="w-5 h-5 text-[#3B82F6] animate-spin" /></div><div><p className="text-2xl font-bold text-white">{stats.processing}</p><p className="text-[#6B6B7E] text-sm">Processando</p></div></div></div>
        <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-4"><div className="flex items-center gap-3"><div className="p-2 bg-[#4ADE80]/20 rounded-lg"><CheckCircledIcon className="w-5 h-5 text-[#4ADE80]" /></div><div><p className="text-2xl font-bold text-white">{stats.completed}</p><p className="text-[#6B6B7E] text-sm">Concluídos</p></div></div></div>
        <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-4"><div className="flex items-center gap-3"><div className="p-2 bg-[#FF6B6B]/20 rounded-lg"><CrossCircledIcon className="w-5 h-5 text-[#FF6B6B]" /></div><div><p className="text-2xl font-bold text-white">{stats.failed}</p><p className="text-[#6B6B7E] text-sm">Falhos</p></div></div></div>
      </div>

      <div className="flex gap-4">
        <select value={filters.type || ''} onChange={(e) => setFilters({ ...filters, type: e.target.value || undefined, page: 1 })} className="px-4 py-2 bg-[#12121A] border border-[#1F1F28] rounded-lg text-white focus:border-[#FF6B6B] focus:outline-none">
          <option value="">Todos os Tipos</option>
          {['email', 'report', 'import', 'export', 'notification', 'cleanup', 'sync'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filters.status || ''} onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined, page: 1 })} className="px-4 py-2 bg-[#12121A] border border-[#1F1F28] rounded-lg text-white focus:border-[#FF6B6B] focus:outline-none">
          <option value="">Todos os Status</option>
          {['pending', 'processing', 'completed', 'failed'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl overflow-hidden">
        {isLoading ? <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-[#FF6B6B]/20 border-t-[#FF6B6B] rounded-full animate-spin" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-[#1F1F28]">
                <th className="px-6 py-4 text-left text-sm font-medium text-[#8B8B9E]">Tipo</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#8B8B9E]">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#8B8B9E]">Prioridade</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#8B8B9E]">Tentativas</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#8B8B9E]">Criado</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-[#8B8B9E]">Ações</th>
              </tr></thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-[#1F1F28] hover:bg-[#1A1A24]">
                    <td className="px-6 py-4 text-white capitalize">{job.type}</td>
                    <td className="px-6 py-4"><StatusBadge status={job.status} /></td>
                    <td className="px-6 py-4 text-white">{job.priority}</td>
                    <td className="px-6 py-4 text-[#8B8B9E]">{job.attempts} / {job.maxAttempts}</td>
                    <td className="px-6 py-4 text-[#8B8B9E]">{new Date(job.createdAt).toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4 text-right"><button onClick={() => setSelected(job)} className="text-[#FF6B6B] hover:underline text-sm">Ver</button></td>
                  </tr>
                ))}
                {jobs.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center"><LightningBoltIcon className="w-12 h-12 text-[#2A2A38] mx-auto mb-4" /><p className="text-[#6B6B7E]">Nenhum job</p></td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-[#1F1F28]">
            <p className="text-[#6B6B7E] text-sm">Página {filters.page} de {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setFilters({ ...filters, page: filters.page - 1 })} disabled={filters.page === 1} className="px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-[#8B8B9E] disabled:opacity-50">Anterior</button>
              <button onClick={() => setFilters({ ...filters, page: filters.page + 1 })} disabled={filters.page === totalPages} className="px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-[#8B8B9E] disabled:opacity-50">Próxima</button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
          onClick={() => setSelected(null)}
          onKeyDown={(e) => { if (e.key === 'Escape') setSelected(null); }}
          role="button"
          tabIndex={0}
        >
          <div 
            className="bg-[#12121A] border border-[#1F1F28] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="dialog"
            tabIndex={-1}
          >
            <div className="p-6 border-b border-[#1F1F28]"><h2 className="text-xl font-bold text-white">Detalhes do Job</h2></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[#6B6B7E] text-sm">Tipo</p><p className="text-white capitalize">{selected.type}</p></div>
                <div><p className="text-[#6B6B7E] text-sm">Status</p><StatusBadge status={selected.status} /></div>
                <div><p className="text-[#6B6B7E] text-sm">Prioridade</p><p className="text-white">{selected.priority}</p></div>
                <div><p className="text-[#6B6B7E] text-sm">Tentativas</p><p className="text-white">{selected.attempts} / {selected.maxAttempts}</p></div>
              </div>
              {selected.data && Object.keys(selected.data).length > 0 && <div><p className="text-[#6B6B7E] text-sm mb-2">Dados</p><pre className="bg-[#1A1A24] p-4 rounded-lg text-xs text-[#8B8B9E] overflow-x-auto">{JSON.stringify(selected.data, null, 2)}</pre></div>}
              {selected.result && Object.keys(selected.result).length > 0 && <div><p className="text-[#6B6B7E] text-sm mb-2">Resultado</p><pre className="bg-[#1A1A24] p-4 rounded-lg text-xs text-[#8B8B9E] overflow-x-auto">{JSON.stringify(selected.result, null, 2)}</pre></div>}
              {selected.error && <div><p className="text-[#FF6B6B] text-sm mb-2">Erro</p><pre className="bg-[#FF6B6B]/10 p-4 rounded-lg text-xs text-[#FF6B6B] overflow-x-auto">{selected.error}</pre></div>}
            </div>
            <div className="p-6 border-t border-[#1F1F28]"><button onClick={() => setSelected(null)} className="w-full px-4 py-2 border border-[#2A2A38] rounded-lg text-[#8B8B9E] hover:bg-[#1A1A24]">Fechar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

