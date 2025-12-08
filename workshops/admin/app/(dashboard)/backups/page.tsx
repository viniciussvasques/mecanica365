'use client';

import { useState, useEffect } from 'react';
import {
  ReloadIcon,
  PlusIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  ClockIcon,
  TrashIcon,
  DownloadIcon,
  UploadIcon,
  FileTextIcon,
  LockClosedIcon,
} from '@radix-ui/react-icons';
import { backupApi, Backup, BackupStatus } from '@/lib/api';

function StatusBadge({ status }: Readonly<{ status: string }>) {
  const config: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    in_progress: { color: 'bg-[#3B82F6]/20 text-[#3B82F6]', label: 'Em Progresso', icon: <ClockIcon className="w-3 h-3 animate-pulse" /> },
    success: { color: 'bg-[#4ADE80]/20 text-[#4ADE80]', label: 'Sucesso', icon: <CheckCircledIcon className="w-3 h-3" /> },
    failed: { color: 'bg-[#FF6B6B]/20 text-[#FF6B6B]', label: 'Falhou', icon: <CrossCircledIcon className="w-3 h-3" /> },
  };
  const c = config[status] || { color: 'bg-[#6B6B7E]/20 text-[#6B6B7E]', label: status, icon: null };
  return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${c.color}`}>{c.icon}{c.label}</span>;
}

function TypeBadge({ type }: Readonly<{ type: string }>) {
  const isFull = type === 'full';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isFull ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]' : 'bg-[#06B6D4]/20 text-[#06B6D4]'}`}>
      {isFull ? 'Completo' : 'Incremental'}
    </span>
  );
}

function CreateModal({ isOpen, onClose, onSubmit }: Readonly<{ isOpen: boolean; onClose: () => void; onSubmit: (data: { type: 'full' | 'incremental'; encrypted: boolean; retentionDays: number }) => Promise<void> }>) {
  const [type, setType] = useState<'full' | 'incremental'>('full');
  const [encrypted, setEncrypted] = useState(true);
  const [retentionDays, setRetentionDays] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ type, encrypted, retentionDays });
      onClose();
      setType('full');
      setEncrypted(true);
      setRetentionDays(30);
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      alert('Erro ao criar backup');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Criar Backup</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#E0E0E0] mb-2">Tipo de Backup</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('full')}
                className={`flex-1 px-4 py-2 rounded-lg border ${type === 'full' ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#8B5CF6]' : 'border-[#2A3038] text-[#E0E0E0]'}`}
              >
                Completo
              </button>
              <button
                type="button"
                onClick={() => setType('incremental')}
                className={`flex-1 px-4 py-2 rounded-lg border ${type === 'incremental' ? 'bg-[#06B6D4]/20 border-[#06B6D4] text-[#06B6D4]' : 'border-[#2A3038] text-[#E0E0E0]'}`}
              >
                Incremental
              </button>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={encrypted}
                onChange={(e) => setEncrypted(e.target.checked)}
                className="w-4 h-4 rounded border-[#2A3038] bg-[#1A1E23] text-[#8B5CF6] focus:ring-[#8B5CF6]"
              />
              <span className="text-sm text-[#E0E0E0]">Criptografar backup</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#E0E0E0] mb-2">Retenção (dias)</label>
            <input
              type="number"
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number.parseInt(e.target.value, 10))}
              min={1}
              max={365}
              className="w-full px-4 py-2 bg-[#12121A] border border-[#2A3038] rounded-lg text-white"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#2A3038] text-[#E0E0E0] rounded-lg hover:bg-[#3A3A48] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-lg hover:from-[#9B6CF6] hover:to-[#8C4AED] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Criando...' : 'Criar Backup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<{ type?: 'full' | 'incremental'; status?: 'in_progress' | 'success' | 'failed'; page: number; limit: number }>({
    page: 1,
    limit: 20,
  });
  const [total, setTotal] = useState(0);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [backupsRes, statusRes] = await Promise.allSettled([
        backupApi.findAll({ ...filters, page: String(filters.page), limit: String(filters.limit) }),
        backupApi.getStatus(),
      ]);

      if (backupsRes.status === 'fulfilled') {
        setBackups(backupsRes.value.backups);
        setTotal(backupsRes.value.total);
      }
      if (statusRes.status === 'fulfilled') {
        setStatus(statusRes.value);
      }
    } catch (error) {
      console.error('Erro ao carregar backups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data: { type: 'full' | 'incremental'; encrypted: boolean; retentionDays: number }) => {
    setIsCreating(true);
    try {
      await backupApi.create(data);
      await loadData();
      alert('✅ Backup criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      alert('❌ Erro ao criar backup');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = async (id: string) => {
    if (!confirm('⚠️ Tem certeza que deseja restaurar este backup? Esta ação irá sobrescrever os dados atuais.')) {
      return;
    }
    setRestoring(id);
    try {
      await backupApi.restore(id);
      alert('✅ Restauração iniciada com sucesso!');
      await loadData();
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      alert('❌ Erro ao restaurar backup');
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('⚠️ Tem certeza que deseja deletar este backup?')) {
      return;
    }
    setDeleting(id);
    try {
      await backupApi.remove(id);
      await loadData();
      alert('✅ Backup deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar backup:', error);
      alert('❌ Erro ao deletar backup');
    } finally {
      setDeleting(null);
    }
  };

  const formatSize = (bytes?: bigint): string => {
    if (!bytes) return '-';
    const size = Number(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (date?: string): string => {
    if (!date) return '-';
    return new Date(date).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Backups</h1>
          <p className="text-[#8B8B9E] mt-1">Gerenciamento de backups do sistema</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={isCreating}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] rounded-lg text-white font-medium hover:from-[#9B6CF6] hover:to-[#8C4AED] transition-colors disabled:opacity-50"
        >
          {isCreating ? <ReloadIcon className="w-4 h-4 animate-spin" /> : <PlusIcon className="w-4 h-4" />}
          {isCreating ? 'Criando...' : 'Criar Backup'}
        </button>
      </div>

      {/* Estatísticas */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-4">
            <div className="text-[#8B8B9E] text-sm">Total</div>
            <div className="text-2xl font-bold text-white mt-1">{status.total}</div>
          </div>
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-4">
            <div className="text-[#8B8B9E] text-sm">Sucesso</div>
            <div className="text-2xl font-bold text-[#4ADE80] mt-1">{status.success}</div>
          </div>
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-4">
            <div className="text-[#8B8B9E] text-sm">Falhou</div>
            <div className="text-2xl font-bold text-[#FF6B6B] mt-1">{status.failed}</div>
          </div>
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-4">
            <div className="text-[#8B8B9E] text-sm">Em Progresso</div>
            <div className="text-2xl font-bold text-[#3B82F6] mt-1">{status.inProgress}</div>
          </div>
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-4">
            <div className="text-[#8B8B9E] text-sm">Expirados</div>
            <div className="text-2xl font-bold text-[#FBBF24] mt-1">{status.expired}</div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.type || ''}
            onChange={(e) => setFilters({ ...filters, type: e.target.value as 'full' | 'incremental' | undefined, page: 1 })}
            className="px-4 py-2 bg-[#12121A] border border-[#2A3038] rounded-lg text-white"
          >
            <option value="">Todos os tipos</option>
            <option value="full">Completo</option>
            <option value="incremental">Incremental</option>
          </select>
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as 'in_progress' | 'success' | 'failed' | undefined, page: 1 })}
            className="px-4 py-2 bg-[#12121A] border border-[#2A3038] rounded-lg text-white"
          >
            <option value="">Todos os status</option>
            <option value="in_progress">Em Progresso</option>
            <option value="success">Sucesso</option>
            <option value="failed">Falhou</option>
          </select>
          <button
            onClick={() => loadData()}
            className="px-4 py-2 bg-[#2A3038] text-[#E0E0E0] rounded-lg hover:bg-[#3A3A48] transition-colors flex items-center gap-2"
          >
            <ReloadIcon className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Lista de Backups */}
      <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6] mx-auto"></div>
            <p className="mt-4 text-[#7E8691]">Carregando backups...</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="p-8 text-center">
            <FileTextIcon className="w-12 h-12 text-[#7E8691] mx-auto mb-4" />
            <p className="text-[#7E8691]">Nenhum backup encontrado</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#12121A] border-b border-[#2A3038]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#8B8B9E] uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#8B8B9E] uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#8B8B9E] uppercase">Tamanho</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#8B8B9E] uppercase">Criptografado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#8B8B9E] uppercase">Criado em</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#8B8B9E] uppercase">Expira em</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#8B8B9E] uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A3038]">
                  {backups.map((backup) => (
                    <tr key={backup.id} className="hover:bg-[#12121A] transition-colors">
                      <td className="px-6 py-4">
                        <TypeBadge type={backup.type} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={backup.status} />
                      </td>
                      <td className="px-6 py-4 text-[#E0E0E0]">{formatSize(backup.size)}</td>
                      <td className="px-6 py-4">
                        {backup.encrypted ? (
                          <span className="inline-flex items-center gap-1 text-[#4ADE80]">
                            <LockClosedIcon className="w-4 h-4" />
                            Sim
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#8B8B9E]">
                            <LockClosedIcon className="w-4 h-4 opacity-30" />
                            Não
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#E0E0E0] text-sm">{formatDate(backup.startedAt)}</td>
                      <td className="px-6 py-4 text-[#E0E0E0] text-sm">{formatDate(backup.expiresAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {backup.status === 'success' && (
                            <button
                              onClick={() => handleRestore(backup.id)}
                              disabled={restoring === backup.id}
                              className="p-2 text-[#3B82F6] hover:bg-[#3B82F6]/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Restaurar backup"
                            >
                              {restoring === backup.id ? <ReloadIcon className="w-4 h-4 animate-spin" /> : <UploadIcon className="w-4 h-4" />}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(backup.id)}
                            disabled={deleting === backup.id}
                            className="p-2 text-[#FF6B6B] hover:bg-[#FF6B6B]/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Deletar backup"
                          >
                            {deleting === backup.id ? <ReloadIcon className="w-4 h-4 animate-spin" /> : <TrashIcon className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {Math.ceil(total / filters.limit) > 1 && (
              <div className="px-6 py-4 bg-[#12121A] flex items-center justify-between border-t border-[#2A3038]">
                <div className="text-sm text-[#8B8B9E]">
                  Mostrando {((filters.page - 1) * filters.limit) + 1} a {Math.min(filters.page * filters.limit, total)} de {total} backups
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                    className="px-4 py-2 bg-[#2A3038] text-[#E0E0E0] rounded-lg hover:bg-[#3A3A48] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page >= Math.ceil(total / filters.limit)}
                    className="px-4 py-2 bg-[#2A3038] text-[#E0E0E0] rounded-lg hover:bg-[#3A3A48] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CreateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreate} />
    </div>
  );
}

