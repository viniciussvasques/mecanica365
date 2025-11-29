'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { vehiclesApi, Vehicle } from '@/lib/api/vehicles';
import { customersApi, Customer } from '@/lib/api/customers';
import { Button } from '@/components/ui/Button';

export default function VehicleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadVehicle();
  }, [id]);

  const loadVehicle = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vehiclesApi.findOne(id);
      setVehicle(data);

      // Carregar informações do cliente
      if (data.customerId) {
        try {
          const customerData = await customersApi.findOne(data.customerId);
          setCustomer(customerData);
        } catch (err) {
          console.error('Erro ao carregar cliente:', err);
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar veículo';
      setError(errorMessage);
      console.error('Erro ao carregar veículo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este veículo?')) {
      return;
    }

    try {
      await vehiclesApi.remove(id);
      router.push('/vehicles');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir veículo';
      alert(errorMessage);
      console.error('Erro ao excluir veículo:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto"></div>
            <p className="mt-4 text-[#7E8691]">Carregando veículo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#FF4E3D]/10 border border-[#FF4E3D] rounded-lg p-6">
            <p className="text-[#FF4E3D]">{error || 'Veículo não encontrado'}</p>
            <Link href="/vehicles" className="mt-4 inline-block">
              <Button variant="secondary">Voltar para veículos</Button>
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
          <Link href="/vehicles" className="text-[#00E0B8] hover:text-[#3ABFF8] mb-4 inline-block">
            ← Voltar para veículos
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#D0D6DE]">
                {vehicle.placa || vehicle.vin || vehicle.renavan || 'Veículo'}
                {vehicle.isDefault && (
                  <span className="ml-2 px-2 py-1 text-sm bg-[#00E0B8]/20 text-[#00E0B8] rounded">
                    Padrão
                  </span>
                )}
              </h1>
              <p className="text-[#7E8691] mt-2">Detalhes do veículo</p>
            </div>
            <div className="flex items-center space-x-2">
              <Link href={`/vehicles/${vehicle.id}/edit`}>
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
          {/* Cliente */}
          {customer && (
            <div>
              <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Cliente</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-[#7E8691] mb-1">Nome</p>
                  <Link href={`/customers/${customer.id}`} className="text-[#00E0B8] hover:text-[#3ABFF8]">
                    {customer.name}
                  </Link>
                </div>
                {customer.phone && (
                  <div>
                    <p className="text-sm text-[#7E8691] mb-1">Telefone</p>
                    <p className="text-[#D0D6DE]">{customer.phone}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Identificadores */}
          <div>
            <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Identificadores</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {vehicle.vin && (
                <div>
                  <p className="text-sm text-[#7E8691] mb-1">VIN</p>
                  <p className="text-[#D0D6DE] font-mono">{vehicle.vin}</p>
                </div>
              )}
              {vehicle.renavan && (
                <div>
                  <p className="text-sm text-[#7E8691] mb-1">RENAVAN</p>
                  <p className="text-[#D0D6DE] font-mono">{vehicle.renavan}</p>
                </div>
              )}
              {vehicle.placa && (
                <div>
                  <p className="text-sm text-[#7E8691] mb-1">Placa</p>
                  <p className="text-[#D0D6DE] font-mono">{vehicle.placa}</p>
                </div>
              )}
            </div>
          </div>

          {/* Informações do Veículo */}
          <div>
            <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Informações do Veículo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {vehicle.make && (
                <div>
                  <p className="text-sm text-[#7E8691] mb-1">Marca</p>
                  <p className="text-[#D0D6DE]">{vehicle.make}</p>
                </div>
              )}
              {vehicle.model && (
                <div>
                  <p className="text-sm text-[#7E8691] mb-1">Modelo</p>
                  <p className="text-[#D0D6DE]">{vehicle.model}</p>
                </div>
              )}
              {vehicle.year && (
                <div>
                  <p className="text-sm text-[#7E8691] mb-1">Ano</p>
                  <p className="text-[#D0D6DE]">{vehicle.year}</p>
                </div>
              )}
              {vehicle.color && (
                <div>
                  <p className="text-sm text-[#7E8691] mb-1">Cor</p>
                  <p className="text-[#D0D6DE]">{vehicle.color}</p>
                </div>
              )}
              {vehicle.mileage !== null && (
                <div>
                  <p className="text-sm text-[#7E8691] mb-1">Quilometragem</p>
                  <p className="text-[#D0D6DE]">{vehicle.mileage.toLocaleString('pt-BR')} km</p>
                </div>
              )}
            </div>
          </div>

          {/* Metadados */}
          <div className="pt-6 border-t border-[#2A3038]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-[#7E8691] mb-1">Criado em</p>
                <p className="text-[#D0D6DE]">
                  {new Date(vehicle.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-[#7E8691] mb-1">Última atualização</p>
                <p className="text-[#D0D6DE]">
                  {new Date(vehicle.updatedAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

