'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { partsApi, Part, PartFilters } from '@/lib/api/parts';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ImportPartsModal } from '@/components/ImportPartsModal';
import { logger } from '@/lib/utils/logger';

export default function PartsPage() {
  const router = useRouter();
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PartFilters>({
    page: 1,
    limit: 20,
    isActive: true,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadParts();
  }, [filters]);

  const loadParts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = authStorage.getToken();
      const subdomain = authStorage.getSubdomain();
      
      if (!token) {
        setError('Token de autenticação não encontrado. Faça login novamente.');
        router.push('/login');
        return;
      }
      
      if (!subdomain) {
        setError('Subdomain não encontrado. Faça login novamente.');
        router.push('/login');
        return;
      }
      
      logger.log('[PartsPage] Carregando peças com subdomain:', subdomain);
      const response = await partsApi.findAll(filters);
      setParts(response.data);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      });
    } catch (err: unknown) {
      logger.error('[PartsPage] Erro ao carregar peças:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar peças';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof PartFilters, value: string | boolean | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : value,
      page: 1, // Reset para primeira página ao filtrar
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta peça?')) {
      return;
    }

    try {
      await partsApi.remove(id);
      await loadParts();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir peça';
      alert(errorMessage);
      logger.error('Erro ao excluir peça:', err);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStockStatus = (quantity: number, minQuantity: number): { text: string; color: string } => {
    if (quantity <= 0) {
      return { text: 'Sem estoque', color: 'text-[#FF4E3D]' };
    }
    if (quantity <= minQuantity) {
      return { text: 'Estoque baixo', color: 'text-[#FFA500]' };
    }
    return { text: 'Em estoque', color: 'text-[#00E0B8]' };
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-[#D0D6DE]">Peças</h1>
            <div className="flex items-center space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowImportModal(true)}
              >
                📥 Importar Planilha
              </Button>
              <Link href="/parts/new">
                <Button variant="primary">
                  + Nova Peça
                </Button>
              </Link>
            </div>
          </div>
          <p className="text-[#7E8691]">Gerencie seu estoque de peças</p>
        </div>

        {/* Filtros */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Input
              label="Buscar"
              placeholder="Nome, número ou descrição..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <Input
              label="Categoria"
              placeholder="Filtrar por categoria..."
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            />
            <Input
              label="Marca"
              placeholder="Filtrar por marca..."
              value={filters.brand || ''}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
            />
            <Select
              label="Status"
              value={filters.isActive === undefined ? '' : filters.isActive ? 'true' : 'false'}
              onChange={(e) => handleFilterChange('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}
              options={[
                { value: '', label: 'Todos' },
                { value: 'true', label: 'Ativas' },
                { value: 'false', label: 'Inativas' },
              ]}
            />
            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.lowStock || false}
                  onChange={(e) => handleFilterChange('lowStock', e.target.checked || undefined)}
                  className="w-4 h-4 rounded border-[#2A3038] bg-[#1A1E23] text-[#00E0B8] focus:ring-[#00E0B8] focus:ring-offset-[#0F1115]"
                />
                <span className="text-sm text-[#D0D6DE]">Estoque baixo</span>
              </label>
            </div>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="bg-[#FF4E3D]/10 border border-[#FF4E3D] rounded-lg p-4 mb-6">
            <p className="text-[#FF4E3D]">{error}</p>
          </div>
        )}

        {/* Tabela */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto"></div>
              <p className="mt-4 text-[#7E8691]">Carregando peças...</p>
            </div>
          ) : parts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[#7E8691]">Nenhuma peça encontrada</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#2A3038]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Código</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Nome</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Categoria</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Marca</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Estoque</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Preço Custo</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Preço Venda</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A3038]">
                    {parts.map((part) => {
                      const stockStatus = getStockStatus(part.quantity, part.minQuantity);
                      return (
                        <tr key={part.id} className="hover:bg-[#2A3038]/50 transition-colors">
                          <td className="px-6 py-4 text-sm text-[#D0D6DE] font-mono">
                            {part.partNumber || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-[#D0D6DE]">{part.name}</td>
                          <td className="px-6 py-4 text-sm text-[#7E8691]">{part.category || '-'}</td>
                          <td className="px-6 py-4 text-sm text-[#7E8691]">{part.brand || '-'}</td>
                          <td className="px-6 py-4 text-sm">
                            <div>
                              <span className={`font-semibold ${stockStatus.color}`}>
                                {part.quantity}
                              </span>
                              {part.minQuantity > 0 && (
                                <span className="text-[#7E8691] text-xs ml-1">
                                  / min: {part.minQuantity}
                                </span>
                              )}
                            </div>
                            <div className={`text-xs ${stockStatus.color}`}>
                              {stockStatus.text}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-[#7E8691]">
                            {formatCurrency(part.costPrice)}
                          </td>
                          <td className="px-6 py-4 text-sm text-[#D0D6DE] font-semibold">
                            {formatCurrency(part.sellPrice)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                part.isActive
                                  ? 'bg-[#00E0B8]/20 text-[#00E0B8]'
                                  : 'bg-[#7E8691]/20 text-[#7E8691]'
                              }`}
                            >
                              {part.isActive ? 'Ativa' : 'Inativa'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Link href={`/parts/${part.id}`}>
                                <Button variant="outline" size="sm">
                                  Ver
                                </Button>
                              </Link>
                              <Link href={`/parts/${part.id}/edit`}>
                                <Button variant="secondary" size="sm">
                                  Editar
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(part.id)}
                                className="text-[#FF4E3D] border-[#FF4E3D] hover:bg-[#FF4E3D]/10"
                              >
                                Excluir
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 bg-[#2A3038] flex items-center justify-between">
                  <p className="text-sm text-[#7E8691]">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                    {pagination.total} peças
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-[#D0D6DE]">
                      Página {pagination.page} de {pagination.totalPages}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Import Modal */}
      <ImportPartsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          loadParts();
        }}
      />
    </div>
  );
}

