'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { customersApi, Customer } from '@/lib/api/customers';
import { vehiclesApi, Vehicle } from '@/lib/api/vehicles';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transferringVehicleId, setTransferringVehicleId] = useState<string | null>(null);
  const [newOwnerId, setNewOwnerId] = useState<string>('');
  const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadCustomer();
    loadVehicles();
    loadAvailableCustomers();
  }, [id]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customersApi.findOne(id);
      setCustomer(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar cliente';
      setError(errorMessage);
      console.error('Erro ao carregar cliente:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const response = await vehiclesApi.findAll({ customerId: id, limit: 100 });
      setVehicles(response.data);
    } catch (err: unknown) {
      console.error('Erro ao carregar veículos:', err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const loadAvailableCustomers = async () => {
    try {
      const allCustomers: Customer[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await customersApi.findAll({ page, limit: 100 });
        allCustomers.push(...response.data);
        hasMore = response.data.length === 100;
        page++;
      }

      // Filtrar o cliente atual
      setAvailableCustomers(allCustomers.filter(c => c.id !== id));
    } catch (err: unknown) {
      console.error('Erro ao carregar clientes:', err);
    }
  };

  const handleTransferVehicle = async (vehicleId: string) => {
    if (!newOwnerId) {
      alert('Selecione o novo proprietário');
      return;
    }

    if (!confirm('Tem certeza que deseja transferir este veículo para outro cliente?')) {
      return;
    }

    try {
      await vehiclesApi.update(vehicleId, { customerId: newOwnerId, isDefault: true });
      alert('Veículo transferido com sucesso!');
      setTransferringVehicleId(null);
      setNewOwnerId('');
      await loadVehicles();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao transferir veículo';
      alert(errorMessage);
      console.error('Erro ao transferir veículo:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) {
      return;
    }

    try {
      await customersApi.remove(id);
      router.push('/customers');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir cliente';
      alert(errorMessage);
      console.error('Erro ao excluir cliente:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto"></div>
            <p className="mt-4 text-[#7E8691]">Carregando cliente...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#FF4E3D]/10 border border-[#FF4E3D] rounded-lg p-6">
            <p className="text-[#FF4E3D]">{error || 'Cliente não encontrado'}</p>
            <Link href="/customers" className="mt-4 inline-block">
              <Button variant="secondary">Voltar para clientes</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/customers" className="text-[#00E0B8] hover:text-[#3ABFF8] mb-4 inline-block">
            ← Voltar para clientes
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#D0D6DE]">{customer.name}</h1>
              <p className="text-[#7E8691] mt-2">Detalhes do cliente</p>
            </div>
            <div className="flex items-center space-x-2">
              <Link href={`/customers/${customer.id}/edit`}>
                <Button variant="primary">Editar</Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-[#FF4E3D] border-[#FF4E3D] hover:bg-[#FF4E3D]/10"
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>

        {/* Informações */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Informações Pessoais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-[#7E8691] mb-1">Nome</p>
                <p className="text-[#D0D6DE]">{customer.name}</p>
              </div>
              <div>
                <p className="text-sm text-[#7E8691] mb-1">Telefone</p>
                <p className="text-[#D0D6DE]">{customer.phone}</p>
              </div>
              {customer.email && (
                <div>
                  <p className="text-sm text-[#7E8691] mb-1">Email</p>
                  <p className="text-[#D0D6DE]">{customer.email}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-[#7E8691] mb-1">Tipo de Documento</p>
                <p className="text-[#D0D6DE]">
                  {customer.documentType === 'cpf' ? 'CPF (Pessoa Física)' : 'CNPJ (Pessoa Jurídica)'}
                </p>
              </div>
              {customer.documentType === 'cpf' && customer.cpf && (
                <div>
                  <p className="text-sm text-[#7E8691] mb-1">CPF</p>
                  <p className="text-[#D0D6DE]">{customer.cpf}</p>
                </div>
              )}
              {customer.documentType === 'cnpj' && customer.cnpj && (
                <div>
                  <p className="text-sm text-[#7E8691] mb-1">CNPJ</p>
                  <p className="text-[#D0D6DE]">{customer.cnpj}</p>
                </div>
              )}
            </div>
          </div>

          {customer.address && (
            <div>
              <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Endereço</h2>
              <p className="text-[#D0D6DE]">{customer.address}</p>
            </div>
          )}

          {customer.notes && (
            <div>
              <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Observações</h2>
              <p className="text-[#D0D6DE] whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}

          <div className="pt-6 border-t border-[#2A3038]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-[#7E8691] mb-1">Criado em</p>
                <p className="text-[#D0D6DE]">
                  {new Date(customer.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-[#7E8691] mb-1">Última atualização</p>
                <p className="text-[#D0D6DE]">
                  {new Date(customer.updatedAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Veículos do Cliente */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#D0D6DE]">Veículos</h2>
              <p className="text-sm text-[#7E8691] mt-1">
                {vehicles.length} {vehicles.length === 1 ? 'veículo cadastrado' : 'veículos cadastrados'}
              </p>
            </div>
            <Link href={`/vehicles/new?customerId=${id}`}>
              <Button variant="primary" size="sm">+ Adicionar Veículo</Button>
            </Link>
          </div>

          {loadingVehicles ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00E0B8] mx-auto"></div>
              <p className="mt-4 text-[#7E8691] text-sm">Carregando veículos...</p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#7E8691]">Nenhum veículo cadastrado para este cliente</p>
              <Link href={`/vehicles/new?customerId=${id}`} className="mt-4 inline-block">
                <Button variant="secondary" size="sm">Adicionar primeiro veículo</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="bg-[#0F1115] border border-[#2A3038] rounded-lg p-4 hover:border-[#00E0B8]/40 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-semibold text-[#D0D6DE]">
                          {vehicle.make && vehicle.model
                            ? `${vehicle.make} ${vehicle.model}`
                            : vehicle.make || vehicle.model || 'Veículo sem marca/modelo'}
                        </h3>
                        {vehicle.isDefault && (
                          <span className="px-2 py-0.5 text-xs bg-[#00E0B8]/20 text-[#00E0B8] rounded">
                            Padrão
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {vehicle.placa && (
                          <div>
                            <p className="text-[#7E8691] mb-1">Placa</p>
                            <p className="text-[#D0D6DE] font-mono">{vehicle.placa}</p>
                          </div>
                        )}
                        {vehicle.vin && (
                          <div>
                            <p className="text-[#7E8691] mb-1">VIN</p>
                            <p className="text-[#D0D6DE] font-mono text-xs">{vehicle.vin}</p>
                          </div>
                        )}
                        {vehicle.renavan && (
                          <div>
                            <p className="text-[#7E8691] mb-1">RENAVAN</p>
                            <p className="text-[#D0D6DE] font-mono">{vehicle.renavan}</p>
                          </div>
                        )}
                        {vehicle.year && (
                          <div>
                            <p className="text-[#7E8691] mb-1">Ano</p>
                            <p className="text-[#D0D6DE]">{vehicle.year}</p>
                          </div>
                        )}
                        {vehicle.color && (
                          <div>
                            <p className="text-[#7E8691] mb-1">Cor</p>
                            <p className="text-[#D0D6DE]">{vehicle.color}</p>
                          </div>
                        )}
                        {vehicle.mileage && (
                          <div>
                            <p className="text-[#7E8691] mb-1">Quilometragem</p>
                            <p className="text-[#D0D6DE]">{vehicle.mileage.toLocaleString('pt-BR')} km</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Link href={`/vehicles/${vehicle.id}`}>
                        <Button variant="outline" size="sm">Ver</Button>
                      </Link>
                      <Link href={`/vehicles/${vehicle.id}/edit`}>
                        <Button variant="secondary" size="sm">Editar</Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTransferringVehicleId(vehicle.id);
                          setNewOwnerId('');
                        }}
                        className="text-[#3ABFF8] border-[#3ABFF8] hover:bg-[#3ABFF8]/10"
                      >
                        Transferir
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Transferência */}
        {transferringVehicleId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold text-[#D0D6DE] mb-4">Transferir Veículo</h3>
              <p className="text-[#7E8691] mb-4">
                Selecione o novo proprietário para este veículo:
              </p>
              <Select
                label="Novo Proprietário *"
                value={newOwnerId}
                onChange={(e) => setNewOwnerId(e.target.value)}
                options={[
                  { value: '', label: 'Selecione um cliente...' },
                  ...availableCustomers.map(customer => ({
                    value: customer.id,
                    label: `${customer.name}${customer.phone ? ` - ${customer.phone}` : ''}`,
                  })),
                ]}
              />
              <div className="flex items-center justify-end gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setTransferringVehicleId(null);
                    setNewOwnerId('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleTransferVehicle(transferringVehicleId)}
                  disabled={!newOwnerId}
                >
                  Transferir
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

