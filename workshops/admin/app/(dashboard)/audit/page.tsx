'use client';

import { useState, useEffect } from 'react';
import { ReloadIcon, CalendarIcon, ActivityLogIcon } from '@radix-ui/react-icons';
import { auditApi, AuditLog, AuditFilters } from '@/lib/api';

function ActionBadge({ action }: Readonly<{ action: string }>) {
  const config: Record<string, { color: string }> = {
    CREATE: { color: 'bg-[#4ADE80]/20 text-[#4ADE80]' },
    UPDATE: { color: 'bg-[#3B82F6]/20 text-[#3B82F6]' },
    DELETE: { color: 'bg-[#FF6B6B]/20 text-[#FF6B6B]' },
    LOGIN: { color: 'bg-[#A855F7]/20 text-[#A855F7]' },
  };
  const c = config[action] || { color: 'bg-[#6B6B7E]/20 text-[#6B6B7E]' };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.color}`}>{action}</span>;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<AuditFilters>({ page: 1, limit: 20 });
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<AuditLog | null>(null);

  useEffect(() => { loadLogs(); }, [filters]);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const res = await auditApi.findAll(filters);
      setLogs(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (error) {
      console.error('Erro:', error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-white">Auditoria</h1><p className="text-[#8B8B9E] mt-1">Logs de atividade do sistema</p></div>
        <button onClick={loadLogs} className="flex items-center gap-2 px-4 py-2 bg-[#12121A] border border-[#1F1F28] rounded-lg text-[#8B8B9E] hover:text-white"><ReloadIcon className="w-4 h-4" />Atualizar</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select value={filters.action || ''} onChange={(e) => setFilters({ ...filters, action: e.target.value || undefined, page: 1 })} className="px-4 py-2 bg-[#12121A] border border-[#1F1F28] rounded-lg text-white focus:border-[#FF6B6B] focus:outline-none">
          <option value="">Todas as Ações</option>
          {['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW'].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filters.resourceType || filters.resource || ''} onChange={(e) => setFilters({ ...filters, resourceType: e.target.value || undefined, resource: undefined, page: 1 })} className="px-4 py-2 bg-[#12121A] border border-[#1F1F28] rounded-lg text-white focus:border-[#FF6B6B] focus:outline-none">
          <option value="">Todos os Recursos</option>
          {['customers', 'vehicles', 'service-orders', 'quotes', 'parts', 'users'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <div className="relative">
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B7E]" />
          <input type="date" value={filters.startDate || ''} onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined, page: 1 })} className="w-full pl-10 pr-4 py-2 bg-[#12121A] border border-[#1F1F28] rounded-lg text-white focus:border-[#FF6B6B] focus:outline-none" />
        </div>
        <div className="relative">
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B7E]" />
          <input type="date" value={filters.endDate || ''} onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined, page: 1 })} className="w-full pl-10 pr-4 py-2 bg-[#12121A] border border-[#1F1F28] rounded-lg text-white focus:border-[#FF6B6B] focus:outline-none" />
        </div>
      </div>

      <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl overflow-hidden">
        {isLoading ? <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-[#FF6B6B]/20 border-t-[#FF6B6B] rounded-full animate-spin" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-[#1F1F28]">
                <th className="px-6 py-4 text-left text-sm font-medium text-[#8B8B9E]">Data</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#8B8B9E]">Ação</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#8B8B9E]">Recurso</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#8B8B9E]">Usuário</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#8B8B9E]">IP</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-[#8B8B9E]">Detalhes</th>
              </tr></thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-[#1F1F28] hover:bg-[#1A1A24]">
                    <td className="px-6 py-4 text-white">{new Date(log.createdAt).toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4"><ActionBadge action={log.action} /></td>
                    <td className="px-6 py-4"><p className="text-white">{log.resource}</p>{log.resourceId && <p className="text-[#6B6B7E] text-xs">#{log.resourceId.substring(0, 8)}...</p>}</td>
                    <td className="px-6 py-4 text-[#8B8B9E]">{log.user?.name || log.userId?.substring(0, 8) || '-'}</td>
                    <td className="px-6 py-4 text-[#8B8B9E] font-mono text-sm">{log.ipAddress || '-'}</td>
                    <td className="px-6 py-4 text-right"><button onClick={() => setSelected(log)} className="text-[#FF6B6B] hover:underline text-sm">Ver</button></td>
                  </tr>
                ))}
                {logs.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center"><ActivityLogIcon className="w-12 h-12 text-[#2A2A38] mx-auto mb-4" /><p className="text-[#6B6B7E]">Nenhum log</p></td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-[#1F1F28]">
            <p className="text-[#6B6B7E] text-sm">Página {filters.page} de {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })} disabled={filters.page === 1} className="px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-[#8B8B9E] disabled:opacity-50">Anterior</button>
              <button onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })} disabled={filters.page === totalPages} className="px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-[#8B8B9E] disabled:opacity-50">Próxima</button>
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
            <div className="p-6 border-b border-[#1F1F28]"><h2 className="text-xl font-bold text-white">Detalhes do Log</h2></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[#6B6B7E] text-sm">Ação</p><ActionBadge action={selected.action} /></div>
                <div><p className="text-[#6B6B7E] text-sm">Recurso</p><p className="text-white">{selected.resource}</p></div>
                <div><p className="text-[#6B6B7E] text-sm">ID do Recurso</p><p className="text-white font-mono text-sm">{selected.resourceId || '-'}</p></div>
                <div><p className="text-[#6B6B7E] text-sm">Data</p><p className="text-white">{new Date(selected.createdAt).toLocaleString('pt-BR')}</p></div>
              </div>
              {selected.oldData && Object.keys(selected.oldData).length > 0 && (
                <div><p className="text-[#6B6B7E] text-sm mb-2">Dados Anteriores</p><pre className="bg-[#1A1A24] p-4 rounded-lg text-xs text-[#8B8B9E] overflow-x-auto">{JSON.stringify(selected.oldData, null, 2)}</pre></div>
              )}
              {selected.newData && Object.keys(selected.newData).length > 0 && (
                <div><p className="text-[#6B6B7E] text-sm mb-2">Dados Novos</p><pre className="bg-[#1A1A24] p-4 rounded-lg text-xs text-[#8B8B9E] overflow-x-auto">{JSON.stringify(selected.newData, null, 2)}</pre></div>
              )}
            </div>
            <div className="p-6 border-t border-[#1F1F28]"><button onClick={() => setSelected(null)} className="w-full px-4 py-2 border border-[#2A2A38] rounded-lg text-[#8B8B9E] hover:bg-[#1A1A24]">Fechar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

