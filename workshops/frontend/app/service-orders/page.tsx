'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { serviceOrdersApi, ServiceOrder, ServiceOrderFilters, ServiceOrderStatus } from '@/lib/api/service-orders';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export default function ServiceOrdersPage() {
  const router = useRouter();
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ServiceOrderFilters>({
    page: 1,
    limit: 20,
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

    loadServiceOrders();
  }, [filters]);

  const loadServiceOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = authStorage.getToken();
      const subdomain = authStorage.getSubdomain();
      
      if (!token || !subdomain) {
        setError('Token ou subdomain não encontrado. Faça login novamente.');
        router.push('/login');
        return;
      }
      
      const response = await serviceOrdersApi.findAll(filters);
      setServiceOrders(response.data);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      });
    } catch (err: unknown) {
      logger.error('[ServiceOrdersPage] Erro ao carregar ordens de serviço:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar ordens de serviço';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ServiceOrderFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const getStatusBadge = (status: ServiceOrderStatus) => {
    const statusConfig: Record<ServiceOrderStatus, { label: string; className: string }> = {
      [ServiceOrderStatus.SCHEDULED]: { label: 'Agendada', className: 'bg-[#3ABFF8] text-white' },
      [ServiceOrderStatus.IN_PROGRESS]: { label: 'Em Andamento', className: 'bg-[#00E0B8] text-[#0F1115]' },
      [ServiceOrderStatus.COMPLETED]: { label: 'Concluída', className: 'bg-[#00E0B8] text-[#0F1115]' },
      [ServiceOrderStatus.CANCELLED]: { label: 'Cancelada', className: 'bg-[#FF4E3D] text-white' },
      [ServiceOrderStatus.ON_HOLD]: { label: 'Em Espera', className: 'bg-[#7E8691] text-white' },
    };

    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || Number.isNaN(value)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-[#D0D6DE]">Ordens de Serviço</h1>
            <Link href="/service-orders/new">
              <Button variant="primary">
                + Nova Ordem de Serviço
              </Button>
            </Link>
          </div>
          <p className="text-[#7E8691]">Gerencie suas ordens de serviço</p>
        </div>

        {/* Filtros */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Número"
              placeholder="Buscar por número..."
              value={filters.number || ''}
              onChange={(e) => handleFilterChange('number', e.target.value)}
            />
            <Select
              label="Status"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              options={[
                { value: '', label: 'Todos' },
                { value: ServiceOrderStatus.SCHEDULED, label: 'Agendada' },
                { value: ServiceOrderStatus.IN_PROGRESS, label: 'Em Andamento' },
                { value: ServiceOrderStatus.COMPLETED, label: 'Concluída' },
                { value: ServiceOrderStatus.CANCELLED, label: 'Cancelada' },
                { value: ServiceOrderStatus.ON_HOLD, label: 'Em Espera' },
              ]}
            />
            <Input
              label="Data Inicial"
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
            <Input
              label="Data Final"
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
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
          {(() => {
            if (loading) {
              return (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto"></div>
                  <p className="mt-4 text-[#7E8691]">Carregando ordens de serviço...</p>
                </div>
              );
            }
            if (serviceOrders.length === 0) {
              return (
                <div className="p-8 text-center">
                  <p className="text-[#7E8691]">Nenhuma ordem de serviço encontrada</p>
                </div>
              );
            }
            return (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#2A3038]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Número</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Cliente</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Veículo</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Técnico</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Total</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Data</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A3038]">
                    {serviceOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#2A3038]/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-[#D0D6DE] font-medium">{order.number}</td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">
                          {order.customer?.name || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">
                          {order.vehicle?.placa || order.vehicle?.make || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">
                          {order.technician?.name || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#D0D6DE] font-medium">
                          {formatCurrency(order.totalCost)}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">
                          {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Link href={`/service-orders/${order.id}`}>
                              <Button variant="outline" size="sm">
                                Ver
                              </Button>
                            </Link>
                            <Link href={`/service-orders/${order.id}/edit`}>
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
                    {pagination.total} ordens de serviço
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
            );
          })()}
        </div>
      </div>
    </div>
  );
}

