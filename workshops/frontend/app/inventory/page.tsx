'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { inventoryApi, InventoryItem, InventoryFilters, InventoryStats, StockStatus } from '@/lib/api/inventory';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const getStockStatusBadge = (status: StockStatus) => {
  const badges = {
    in_stock: { label: 'Em Estoque', className: 'bg-[#00E0B8]/20 text-[#00E0B8]' },
    low_stock: { label: 'Estoque Baixo', className: 'bg-[#FFA500]/20 text-[#FFA500]' },
    out_of_stock: { label: 'Sem Estoque', className: 'bg-[#FF4E3D]/20 text-[#FF4E3D]' },
  };
  const badge = badges[status];
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
      {badge.label}
    </span>
  );
};

export default function InventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<InventoryFilters>({
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadInventory();
  }, [filters]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const subdomain = localStorage.getItem('subdomain');
      
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
      
      console.log('[InventoryPage] Carregando estoque com subdomain:', subdomain);
      const response = await inventoryApi.findAll(filters);
      setItems(response.data);
      setStats(response.stats || null);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      });
    } catch (err: unknown) {
      console.error('[InventoryPage] Erro ao carregar estoque:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar estoque';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof InventoryFilters, value: string | boolean | undefined) => {
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

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-[#D0D6DE]">Estoque</h1>
            <div className="flex gap-3">
              <Link href="/inventory/alerts">
                <Button variant="secondary">
                  ⚠️ Alertas
                  {stats && stats.lowStockItems + stats.outOfStockItems > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-[#FF4E3D] text-white rounded-full text-xs">
                      {stats.lowStockItems + stats.outOfStockItems}
                    </span>
                  )}
                </Button>
              </Link>
              <Link href="/parts/new">
                <Button variant="primary">
                  + Adicionar Peça
                </Button>
              </Link>
            </div>
          </div>
          <p className="text-[#7E8691]">Gerencie o estoque de peças e componentes</p>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-4">
              <p className="text-sm text-[#7E8691] mb-1">Total de Itens</p>
              <p className="text-2xl font-bold text-[#D0D6DE]">{stats.totalItems}</p>
            </div>
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-4">
              <p className="text-sm text-[#7E8691] mb-1">Valor Total</p>
              <p className="text-2xl font-bold text-[#00E0B8]">{formatCurrency(stats.totalValue)}</p>
            </div>
            <div className="bg-[#1A1E23] border border-[#FFA500] rounded-lg p-4">
              <p className="text-sm text-[#7E8691] mb-1">Estoque Baixo</p>
              <p className="text-2xl font-bold text-[#FFA500]">{stats.lowStockItems}</p>
            </div>
            <div className="bg-[#1A1E23] border border-[#FF4E3D] rounded-lg p-4">
              <p className="text-sm text-[#7E8691] mb-1">Sem Estoque</p>
              <p className="text-2xl font-bold text-[#FF4E3D]">{stats.outOfStockItems}</p>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Buscar"
              placeholder="Nome, código ou descrição..."
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
              label="Status do Estoque"
              value={filters.stockStatus || ''}
              onChange={(e) => handleFilterChange('stockStatus', e.target.value === '' ? undefined : e.target.value as StockStatus)}
              options={[
                { value: '', label: 'Todos' },
                { value: 'in_stock', label: 'Em Estoque' },
                { value: 'low_stock', label: 'Estoque Baixo' },
                { value: 'out_of_stock', label: 'Sem Estoque' },
              ]}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Select
              label="Estoque Baixo"
              value={filters.lowStock === undefined ? '' : filters.lowStock.toString()}
              onChange={(e) => handleFilterChange('lowStock', e.target.value === '' ? undefined : e.target.value === 'true')}
              options={[
                { value: '', label: 'Todos' },
                { value: 'true', label: 'Apenas Estoque Baixo' },
                { value: 'false', label: 'Sem Estoque Baixo' },
              ]}
            />
            <Select
              label="Status"
              value={filters.isActive === undefined ? '' : filters.isActive.toString()}
              onChange={(e) => handleFilterChange('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}
              options={[
                { value: '', label: 'Todos' },
                { value: 'true', label: 'Ativos' },
                { value: 'false', label: 'Inativos' },
              ]}
            />
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
          {loading && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto"></div>
              <p className="mt-4 text-[#7E8691]">Carregando estoque...</p>
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-[#7E8691]">Nenhum item encontrado</p>
            </div>
          )}
          {!loading && items.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#2A3038]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Código</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Nome</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Categoria</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Quantidade</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Mínimo</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Valor Estoque</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Margem</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A3038]">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-[#2A3038]/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-[#7E8691]">{item.partNumber || '-'}</td>
                        <td className="px-6 py-4 text-sm text-[#D0D6DE]">{item.name}</td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">{item.category || '-'}</td>
                        <td className="px-6 py-4 text-sm text-[#D0D6DE] font-medium">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">{item.minQuantity}</td>
                        <td className="px-6 py-4 text-sm">
                          {getStockStatusBadge(item.stockStatus)}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#D0D6DE]">
                          {formatCurrency(item.stockValue)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={item.profitMargin >= 0 ? 'text-[#00E0B8]' : 'text-[#FF4E3D]'}>
                            {item.profitMargin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Link href={`/parts/${item.id}`}>
                              <Button variant="outline" size="sm">
                                Ver
                              </Button>
                            </Link>
                            <Link href={`/parts/${item.id}/edit`}>
                              <Button variant="secondary" size="sm">
                                Editar
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 bg-[#2A3038] flex items-center justify-between">
                  <p className="text-sm text-[#7E8691]">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                    {pagination.total} itens
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
    </div>
  );
}

