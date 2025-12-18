'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { vehiclesApi, Vehicle, VehicleFilters } from '@/lib/api/vehicles';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authStorage } from '@/lib/utils/localStorage';
import { logger } from '@/lib/utils/logger';

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
  // Estados locais para os inputs (não atualizam URL imediatamente)
  const [localFilters, setLocalFilters] = useState({
    placa: '',
    vin: '',
    renavan: '',
    make: '',
    model: '',
  });
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
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
      const newFilters = {
        page: page ? parseInt(page, 10) : 1,
        limit: 20,
        placa: placa || undefined,
        vin: vin || undefined,
        renavan: renavan || undefined,
        make: make || undefined,
        model: model || undefined,
        customerId: customerId || undefined,
      };
      setFilters(newFilters);
      // Sincronizar estados locais com URL
      setLocalFilters({
        placa: placa || '',
        vin: vin || '',
        renavan: renavan || '',
        make: make || '',
        model: model || '',
      });
    }

    loadVehicles();

    // Cleanup do timer ao desmontar
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchParams, router]);

  // Carregar veículos quando os filtros mudarem (após debounce)
  useEffect(() => {
    loadVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadVehicles = async () => {
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
      logger.error('Erro ao carregar veículos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Atualizar filtro local (não atualiza URL imediatamente)
  const handleLocalFilterChange = (key: 'placa' | 'vin' | 'renavan' | 'make' | 'model', value: string) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
    
    // Limpar timer anterior
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Definir mínimo de caracteres antes de buscar
    const minLengths: Record<string, number> = {
      placa: 3, // Mínimo 3 caracteres para placa
      vin: 3,   // Mínimo 3 caracteres para VIN
      renavan: 3, // Mínimo 3 dígitos para RENAVAN
      make: 2,  // Mínimo 2 caracteres para marca
      model: 2, // Mínimo 2 caracteres para modelo
    };
    
    const minLength = minLengths[key] || 0;
    
    // Sempre aplicar debounce, mas só atualizar filtro se:
    // 1. O campo estiver vazio (para limpar o filtro)
    // 2. Ou tiver o número mínimo de caracteres
    if (value.length === 0 || value.length >= minLength) {
      debounceTimer.current = setTimeout(() => {
        const newFilters = { ...filters, [key]: value.length >= minLength ? value : undefined, page: 1 };
        setFilters(newFilters);
        
        // Atualizar URL apenas após debounce
        const params = new URLSearchParams();
        if (newFilters.placa && newFilters.placa.length >= minLengths.placa) params.set('placa', newFilters.placa);
        if (newFilters.vin && newFilters.vin.length >= minLengths.vin) params.set('vin', newFilters.vin);
        if (newFilters.renavan && newFilters.renavan.length >= minLengths.renavan) params.set('renavan', newFilters.renavan);
        if (newFilters.make && newFilters.make.length >= minLengths.make) params.set('make', newFilters.make);
        if (newFilters.model && newFilters.model.length >= minLengths.model) params.set('model', newFilters.model);
        if (newFilters.customerId) params.set('customerId', newFilters.customerId);
        if (newFilters.page && newFilters.page > 1) params.set('page', newFilters.page.toString());
        
        // Usar replace ao invés de push para não adicionar ao histórico e não perder foco
        router.replace(`/vehicles?${params.toString()}`);
      }, 500); // Debounce de 500ms
    }
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
      logger.error('Erro ao excluir veículo:', err);
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
              value={localFilters.placa}
              onChange={(e) => handleLocalFilterChange('placa', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            />
            <Input
              label="VIN"
              placeholder="1HGBH41JXMN109186"
              value={localFilters.vin}
              onChange={(e) => handleLocalFilterChange('vin', e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, ''))}
              maxLength={17}
            />
            <Input
              label="RENAVAN"
              placeholder="12345678901"
              value={localFilters.renavan}
              onChange={(e) => handleLocalFilterChange('renavan', e.target.value.replace(/\D/g, ''))}
              maxLength={11}
            />
            <Input
              label="Marca"
              placeholder="Honda"
              value={localFilters.make}
              onChange={(e) => handleLocalFilterChange('make', e.target.value)}
            />
            <Input
              label="Modelo"
              placeholder="Civic"
              value={localFilters.model}
              onChange={(e) => handleLocalFilterChange('model', e.target.value)}
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

