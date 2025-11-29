'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { vehiclesApi, Vehicle, VehicleFilters } from '@/lib/api/vehicles';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function VehiclesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<VehicleFilters>({
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

    // Carregar filtros da URL
    const page = searchParams.get('page');
    const placa = searchParams.get('placa');
    const vin = searchParams.get('vin');
    const renavan = searchParams.get('renavan');
    const make = searchParams.get('make');
    const model = searchParams.get('model');
    const customerId = searchParams.get('customerId');

    if (page || placa || vin || renavan || make || model || customerId) {
      setFilters({
        page: page ? parseInt(page, 10) : 1,
        limit: 20,
        placa: placa || undefined,
        vin: vin || undefined,
        renavan: renavan || undefined,
        make: make || undefined,
        model: model || undefined,
        customerId: customerId || undefined,
      });
    }

    loadVehicles();
  }, [searchParams, router]);

  const loadVehicles = async () => {
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

      const response = await vehiclesApi.findAll(filters);
      setVehicles(response.data);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar veículos';
      setError(errorMessage);
      console.error('Erro ao carregar veículos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof VehicleFilters, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined, page: 1 };
    setFilters(newFilters);
    
    // Atualizar URL
    const params = new URLSearchParams();
    if (newFilters.placa) params.set('placa', newFilters.placa);
    if (newFilters.vin) params.set('vin', newFilters.vin);
    if (newFilters.renavan) params.set('renavan', newFilters.renavan);
    if (newFilters.make) params.set('make', newFilters.make);
    if (newFilters.model) params.set('model', newFilters.model);
    if (newFilters.customerId) params.set('customerId', newFilters.customerId);
    if (newFilters.page && newFilters.page > 1) params.set('page', newFilters.page.toString());
    
    router.push(`/vehicles?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/vehicles?${params.toString()}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este veículo?')) {
      return;
    }

    try {
      await vehiclesApi.remove(id);
      await loadVehicles();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir veículo';
      alert(errorMessage);
      console.error('Erro ao excluir veículo:', err);
    }
  };

  if (loading && vehicles.length === 0) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto"></div>
            <p className="mt-4 text-[#7E8691]">Carregando veículos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#D0D6DE]">Veículos</h1>
              <p className="text-[#7E8691] mt-2">Gerencie os veículos cadastrados</p>
            </div>
            <Link href="/vehicles/new">
              <Button variant="primary">+ Novo Veículo</Button>
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Placa"
              placeholder="ABC1234"
              value={filters.placa || ''}
              onChange={(e) => handleFilterChange('placa', e.target.value.toUpperCase())}
            />
            <Input
              label="VIN"
              placeholder="1HGBH41JXMN109186"
              value={filters.vin || ''}
              onChange={(e) => handleFilterChange('vin', e.target.value.toUpperCase())}
            />
            <Input
              label="RENAVAN"
              placeholder="12345678901"
              value={filters.renavan || ''}
              onChange={(e) => handleFilterChange('renavan', e.target.value.replace(/\D/g, ''))}
              maxLength={11}
            />
            <Input
              label="Marca"
              placeholder="Honda"
              value={filters.make || ''}
              onChange={(e) => handleFilterChange('make', e.target.value)}
            />
            <Input
              label="Modelo"
              placeholder="Civic"
              value={filters.model || ''}
              onChange={(e) => handleFilterChange('model', e.target.value)}
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#2A3038]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#D0D6DE]">Placa</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#D0D6DE]">VIN</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#D0D6DE]">RENAVAN</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#D0D6DE]">Marca/Modelo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#D0D6DE]">Ano</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#D0D6DE]">Quilometragem</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#D0D6DE]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A3038]">
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#7E8691]">
                      Nenhum veículo encontrado
                    </td>
                  </tr>
                ) : (
                  vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-[#2A3038]/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-[#D0D6DE]">
                        {vehicle.placa || '-'}
                        {vehicle.isDefault && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-[#00E0B8]/20 text-[#00E0B8] rounded">
                            Padrão
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#D0D6DE] font-mono">
                        {vehicle.vin || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#D0D6DE] font-mono">
                        {vehicle.renavan || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#D0D6DE]">
                        {vehicle.make && vehicle.model
                          ? `${vehicle.make} ${vehicle.model}`
                          : vehicle.make || vehicle.model || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#D0D6DE]">
                        {vehicle.year || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#D0D6DE]">
                        {vehicle.mileage ? `${vehicle.mileage.toLocaleString('pt-BR')} km` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <Link href={`/vehicles/${vehicle.id}`}>
                            <button className="text-[#3ABFF8] hover:text-[#00E0B8] transition-colors">
                              Ver
                            </button>
                          </Link>
                          <Link href={`/vehicles/${vehicle.id}/edit`}>
                            <button className="text-[#3ABFF8] hover:text-[#00E0B8] transition-colors">
                              Editar
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(vehicle.id)}
                            className="text-[#FF4E3D] hover:text-[#FF6B5A] transition-colors"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {pagination.totalPages > 1 && (
            <div className="px-4 py-4 border-t border-[#2A3038] flex items-center justify-between">
              <div className="text-sm text-[#7E8691]">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} veículos
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-[#D0D6DE] px-4">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

