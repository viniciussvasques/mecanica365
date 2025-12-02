'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { elevatorsApi, Elevator, ElevatorFilters, ElevatorStatus, ElevatorType } from '@/lib/api/elevators';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export const dynamic = 'force-dynamic';

export default function ElevatorsPage() {
  const router = useRouter();
  const [elevators, setElevators] = useState<Elevator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ElevatorFilters>({
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

    loadElevators();
  }, [filters]);

  const loadElevators = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const subdomain = localStorage.getItem('subdomain');
      
      if (!token || !subdomain) {
        setError('Token ou subdomain não encontrado. Faça login novamente.');
        router.push('/login');
        return;
      }
      
      const response = await elevatorsApi.findAll(filters);
      setElevators(response.data);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      });
    } catch (err: unknown) {
      console.error('[ElevatorsPage] Erro ao carregar elevadores:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar elevadores';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ElevatorFilters, value: string) => {
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

  const getStatusBadge = (status: ElevatorStatus) => {
    const statusConfig: Record<ElevatorStatus, { label: string; className: string }> = {
      [ElevatorStatus.FREE]: { label: 'Livre', className: 'bg-[#00E0B8] text-[#0F1115]' },
      [ElevatorStatus.OCCUPIED]: { label: 'Ocupado', className: 'bg-[#FF4E3D] text-white' },
      [ElevatorStatus.MAINTENANCE]: { label: 'Manutenção', className: 'bg-[#7E8691] text-white' },
      [ElevatorStatus.SCHEDULED]: { label: 'Agendado', className: 'bg-[#3ABFF8] text-white' },
    };

    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getTypeLabel = (type: ElevatorType) => {
    const typeLabels: Record<ElevatorType, string> = {
      [ElevatorType.HYDRAULIC]: 'Hidráulico',
      [ElevatorType.PNEUMATIC]: 'Pneumático',
      [ElevatorType.SCISSOR]: 'Tesoura',
    };
    return typeLabels[type];
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-[#D0D6DE]">Elevadores</h1>
            <Link href="/elevators/new">
              <Button variant="primary">
                + Novo Elevador
              </Button>
            </Link>
          </div>
          <p className="text-[#7E8691]">Gerencie seus elevadores</p>
        </div>

        {/* Filtros */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Nome"
              placeholder="Buscar por nome..."
              value={filters.name || ''}
              onChange={(e) => handleFilterChange('name', e.target.value)}
            />
            <Input
              label="Número"
              placeholder="Buscar por número..."
              value={filters.number || ''}
              onChange={(e) => handleFilterChange('number', e.target.value)}
            />
            <Select
              label="Tipo"
              value={filters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              options={[
                { value: '', label: 'Todos' },
                { value: ElevatorType.HYDRAULIC, label: 'Hidráulico' },
                { value: ElevatorType.PNEUMATIC, label: 'Pneumático' },
                { value: ElevatorType.SCISSOR, label: 'Tesoura' },
              ]}
            />
            <Select
              label="Status"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              options={[
                { value: '', label: 'Todos' },
                { value: ElevatorStatus.FREE, label: 'Livre' },
                { value: ElevatorStatus.OCCUPIED, label: 'Ocupado' },
                { value: ElevatorStatus.MAINTENANCE, label: 'Manutenção' },
                { value: ElevatorStatus.SCHEDULED, label: 'Agendado' },
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
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto"></div>
              <p className="mt-4 text-[#7E8691]">Carregando elevadores...</p>
            </div>
          ) : elevators.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[#7E8691]">Nenhum elevador encontrado</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#2A3038]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Nome</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Número</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Tipo</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Capacidade</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Localização</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A3038]">
                    {elevators.map((elevator) => (
                      <tr key={elevator.id} className="hover:bg-[#2A3038]/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-[#D0D6DE] font-medium">{elevator.name}</td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">{elevator.number}</td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">
                          {getTypeLabel(elevator.type)}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">
                          {elevator.capacity} ton
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {getStatusBadge(elevator.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">
                          {elevator.location || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Link href={`/elevators/${elevator.id}`}>
                              <Button variant="outline" size="sm">
                                Ver
                              </Button>
                            </Link>
                            <Link href={`/elevators/${elevator.id}/edit`}>
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
                    {pagination.total} elevadores
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

