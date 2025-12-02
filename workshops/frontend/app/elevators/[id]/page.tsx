'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { elevatorsApi, Elevator, ElevatorUsage, ElevatorStatus, ElevatorType } from '@/lib/api/elevators';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default function ElevatorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [elevator, setElevator] = useState<Elevator | null>(null);
  const [usageHistory, setUsageHistory] = useState<ElevatorUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadElevator();
    loadUsageHistory();
  }, [id]);

  const loadElevator = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await elevatorsApi.findOne(id);
      setElevator(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar elevador';
      setError(errorMessage);
      console.error('Erro ao carregar elevador:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsageHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await elevatorsApi.getUsageHistory(id, { limit: 50 });
      setUsageHistory(response.data);
    } catch (err: unknown) {
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setLoadingHistory(false);
    }
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
      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${config.className}`}>
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

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8]"></div>
      </div>
    );
  }

  if (error || !elevator) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#FF4E3D]/10 border border-[#FF4E3D] rounded-lg p-6">
            <p className="text-[#FF4E3D]">{error || 'Elevador não encontrado'}</p>
            <Link href="/elevators" className="mt-4 inline-block">
              <Button variant="outline">Voltar para Elevadores</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/elevators" className="text-[#00E0B8] hover:text-[#3ABFF8] mb-4 inline-block">
            ← Voltar para Elevadores
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#D0D6DE]">{elevator.name}</h1>
              <p className="text-[#7E8691] mt-2">Número: {elevator.number}</p>
            </div>
            <div className="flex items-center gap-4">
              {getStatusBadge(elevator.status)}
              <Link href={`/elevators/${id}/edit`}>
                <Button variant="outline">Editar</Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Principais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações do Elevador */}
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
              <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Informações do Elevador</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#7E8691]">Tipo</p>
                  <p className="text-[#D0D6DE] font-medium">{getTypeLabel(elevator.type)}</p>
                </div>
                <div>
                  <p className="text-sm text-[#7E8691]">Capacidade</p>
                  <p className="text-[#D0D6DE] font-medium">{elevator.capacity} ton</p>
                </div>
                <div>
                  <p className="text-sm text-[#7E8691]">Status</p>
                  <div className="mt-1">{getStatusBadge(elevator.status)}</div>
                </div>
                {elevator.location && (
                  <div>
                    <p className="text-sm text-[#7E8691]">Localização</p>
                    <p className="text-[#D0D6DE]">{elevator.location}</p>
                  </div>
                )}
              </div>
              {elevator.notes && (
                <div className="mt-4 pt-4 border-t border-[#2A3038]">
                  <p className="text-sm text-[#7E8691]">Observações</p>
                  <p className="text-[#D0D6DE] mt-1">{elevator.notes}</p>
                </div>
              )}
            </div>

            {/* Histórico de Uso */}
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
              <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Histórico de Uso</h2>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00E0B8]"></div>
                </div>
              ) : usageHistory.length === 0 ? (
                <p className="text-[#7E8691]">Nenhum uso registrado</p>
              ) : (
                <div className="space-y-3">
                  {usageHistory.map((usage) => (
                    <div key={usage.id} className="bg-[#0F1115] p-4 rounded-lg border border-[#2A3038]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {usage.serviceOrder && (
                              <Link
                                href={`/service-orders/${usage.serviceOrder.id}`}
                                className="text-[#00E0B8] hover:text-[#3ABFF8] font-medium"
                              >
                                OS: {usage.serviceOrder.number}
                              </Link>
                            )}
                            {usage.vehicle && (
                              <span className="text-sm text-[#7E8691]">
                                • {usage.vehicle.placa || `${usage.vehicle.make} ${usage.vehicle.model}`.trim()}
                              </span>
                            )}
                          </div>
                          {usage.technician && (
                            <p className="text-sm text-[#7E8691] mb-1">Técnico: {usage.technician.name}</p>
                          )}
                          <div className="text-sm text-[#7E8691]">
                            <p>Início: {formatDate(usage.startTime)}</p>
                            {usage.endTime && <p>Fim: {formatDate(usage.endTime)}</p>}
                          </div>
                          {usage.notes && (
                            <p className="text-sm text-[#D0D6DE] mt-2">{usage.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Estatísticas */}
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
              <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Estatísticas</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-[#7E8691]">Total de Usos</p>
                  <p className="text-2xl font-bold text-[#00E0B8]">{usageHistory.length}</p>
                </div>
                <div>
                  <p className="text-sm text-[#7E8691]">Usos Concluídos</p>
                  <p className="text-xl font-semibold text-[#D0D6DE]">
                    {usageHistory.filter(u => u.endTime).length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#7E8691]">Em Uso Atual</p>
                  <p className="text-xl font-semibold text-[#D0D6DE]">
                    {usageHistory.filter(u => !u.endTime).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

