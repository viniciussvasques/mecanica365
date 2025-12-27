'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { appointmentsApi, Appointment, AppointmentStatus } from '@/lib/api/appointments';
import { Button } from '@/components/ui/Button';
import { AppointmentCalendar } from '@/components/AppointmentCalendar';
import { AppointmentModal } from '@/components/AppointmentModal';
import { logger } from '@/lib/utils/logger';
import { authStorage } from '@/lib/utils/localStorage';

export const dynamic = 'force-dynamic';

export default function AppointmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | ''>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const loadAppointments = async () => {
    try {
      setLoading(true);

      const userId = authStorage.getUserId();
      const userRole = authStorage.getUserRole();

      const filters: {
        assignedToId?: string;
        status?: AppointmentStatus;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
      } = {
        page: 1,
        limit: 100, // Buscar mais agendamentos
      };

      // Para mecânicos: mostrar TODOS os agendamentos (disponíveis + designados para ele)
      // Para admin/manager/receptionist: mostrar todos
      // NÃO filtrar por assignedToId aqui - vamos mostrar todos e destacar os disponíveis

      if (filterStatus) {
        filters.status = filterStatus;
      }

      // Remover filtro de data temporariamente para debug
      // Mostrar TODOS os agendamentos (sem filtro de data)
      // TODO: Depois ajustar para mostrar apenas próximos 90 dias
      // const startDate = new Date();
      // startDate.setDate(startDate.getDate() - 7); // Últimos 7 dias também
      // const endDate = new Date();
      // endDate.setDate(endDate.getDate() + 90); // Próximos 90 dias
      // filters.startDate = startDate.toISOString();
      // filters.endDate = endDate.toISOString();

      logger.log('[AppointmentsPage] Filtros:', filters);
      logger.log('[AppointmentsPage] userId:', userId);
      logger.log('[AppointmentsPage] userRole:', userRole);

      const response = await appointmentsApi.findAll(filters);

      logger.log('[AppointmentsPage] Resposta da API:', response);
      logger.log('[AppointmentsPage] Total de agendamentos:', response.total);
      logger.log('[AppointmentsPage] Agendamentos encontrados:', response.data.length);

      // Para mecânicos: mostrar todos, mas destacar os disponíveis (sem assignedToId)
      // Para outros roles: mostrar todos
      setAppointments(response.data);
    } catch (err: unknown) {
      logger.error('Erro ao carregar agendamentos:', err);
      // Mostrar erro para o usuário
      if (err instanceof Error) {
        alert(`Erro ao carregar agendamentos: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    const badges = {
      [AppointmentStatus.SCHEDULED]: 'bg-blue-500/20 text-blue-400',
      [AppointmentStatus.CONFIRMED]: 'bg-green-500/20 text-green-400',
      [AppointmentStatus.IN_PROGRESS]: 'bg-yellow-500/20 text-yellow-400',
      [AppointmentStatus.COMPLETED]: 'bg-gray-500/20 text-gray-400',
      [AppointmentStatus.CANCELLED]: 'bg-red-500/20 text-red-400',
      [AppointmentStatus.NO_SHOW]: 'bg-orange-500/20 text-orange-400',
    };
    return badges[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getStatusLabel = (status: AppointmentStatus) => {
    const labels = {
      [AppointmentStatus.SCHEDULED]: 'Agendado',
      [AppointmentStatus.CONFIRMED]: 'Confirmado',
      [AppointmentStatus.IN_PROGRESS]: 'Em Progresso',
      [AppointmentStatus.COMPLETED]: 'Completo',
      [AppointmentStatus.CANCELLED]: 'Cancelado',
      [AppointmentStatus.NO_SHOW]: 'Não Compareceu',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8]"></div>
      </div>
    );
  }

  const userRole = localStorage.getItem('userRole');
  const canCreate = userRole === 'admin' || userRole === 'manager' || userRole === 'receptionist';

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowModal(true);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedAppointment(null);
    setSelectedDate(null);
  };

  const handleModalSuccess = () => {
    loadAppointments();
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#D0D6DE]">Agendamentos</h1>
            <p className="text-[#7E8691] mt-2">Gerencie seus agendamentos e ordens de serviço</p>
          </div>
          {canCreate && (
            <Button
              variant="primary"
              onClick={() => {
                setSelectedAppointment(null);
                setSelectedDate(null);
                setShowModal(true);
              }}
            >
              + Novo Agendamento
            </Button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="text-sm text-[#7E8691]">Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as AppointmentStatus | '')}
                className="bg-[#0F1115] border border-[#2A3038] rounded-lg px-4 py-2 text-[#D0D6DE] focus:outline-none focus:border-[#00E0B8]"
              >
                <option value="">Todos</option>
                <option value={AppointmentStatus.SCHEDULED}>Agendado</option>
                <option value={AppointmentStatus.CONFIRMED}>Confirmado</option>
                <option value={AppointmentStatus.IN_PROGRESS}>Em Progresso</option>
                <option value={AppointmentStatus.COMPLETED}>Completo</option>
                <option value={AppointmentStatus.CANCELLED}>Cancelado</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'calendar'
                  ? 'bg-[#00E0B8]/20 text-[#00E0B8]'
                  : 'bg-[#0F1115] text-[#7E8691] hover:text-[#D0D6DE]'
                  }`}
              >
                Calendário
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'list'
                  ? 'bg-[#00E0B8]/20 text-[#00E0B8]'
                  : 'bg-[#0F1115] text-[#7E8691] hover:text-[#D0D6DE]'
                  }`}
              >
                Lista
              </button>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="mb-6">
            <AppointmentCalendar
              appointments={appointments}
              selectedDate={selectedDate || undefined}
              onDateSelect={handleDateSelect}
              onAppointmentClick={handleAppointmentClick}
            />
          </div>
        )}

        {/* Lista de Agendamentos */}
        {(viewMode === 'list' || viewMode === 'calendar') && (
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#7E8691]">Nenhum agendamento encontrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => {
                  const appointmentDate = new Date(appointment.date);
                  const isToday = appointmentDate.toDateString() === new Date().toDateString();
                  const isPast = appointmentDate < new Date();
                  const userId = authStorage.getUserId();
                  const userRole = authStorage.getUserRole();
                  const isAvailable = !appointment.assignedToId;
                  const isMine = appointment.assignedToId === userId;
                  const canClaim = userRole === 'mechanic' && isAvailable && !isPast && appointment.status === AppointmentStatus.SCHEDULED;

                  return (
                    <div
                      key={appointment.id}
                      className={`bg-[#0F1115] border-2 rounded-lg p-4 hover:border-[#00E0B8] transition-all ${isToday
                        ? 'border-[#00E0B8] shadow-lg shadow-[#00E0B8]/30'
                        : isAvailable && userRole === 'mechanic'
                          ? 'border-[#FFD700] shadow-lg shadow-[#FFD700]/20' // Dourado para disponíveis
                          : isPast
                            ? 'border-[#2A3038] opacity-60'
                            : 'border-[#2A3038]'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-[#D0D6DE]">
                              {formatDate(appointment.date)}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadge(appointment.status)}`}>
                              {getStatusLabel(appointment.status)}
                            </span>
                            {isToday && (
                              <span className="px-2 py-1 bg-[#00E0B8]/20 text-[#00E0B8] text-xs font-semibold rounded animate-pulse">
                                Hoje
                              </span>
                            )}
                            {isAvailable && userRole === 'mechanic' && (
                              <span className="px-2 py-1 bg-[#FFD700]/20 text-[#FFD700] text-xs font-semibold rounded animate-pulse">
                                ⚡ Disponível
                              </span>
                            )}
                            {isMine && (
                              <span className="px-2 py-1 bg-[#00E0B8]/20 text-[#00E0B8] text-xs font-semibold rounded">
                                Meu Agendamento
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-[#7E8691]">Cliente</p>
                              <p className="text-[#D0D6DE]">{appointment.customer?.name || 'Não informado'}</p>
                            </div>
                            <div>
                              <p className="text-[#7E8691]">OS</p>
                              <p className="text-[#D0D6DE]">
                                {appointment.serviceOrder?.number || 'Sem OS'}
                              </p>
                            </div>
                          </div>
                          {appointment.serviceType && (
                            <p className="text-sm text-[#7E8691] mt-2">
                              {appointment.serviceType}
                            </p>
                          )}
                          {appointment.notes && (
                            <p className="text-sm text-[#7E8691] mt-1">
                              {appointment.notes}
                            </p>
                          )}
                        </div>
                        <div className="ml-4 flex flex-col space-y-2">
                          {canClaim ? (
                            <Button
                              variant="primary"
                              onClick={async () => {
                                try {
                                  await appointmentsApi.claim(appointment.id);
                                  await loadAppointments();
                                  alert('Agendamento atribuído a você com sucesso!');
                                } catch (err: unknown) {
                                  logger.error('Erro ao pegar agendamento:', err);
                                  const errorMessage = err instanceof Error ? err.message : 'Erro ao pegar agendamento. Tente novamente.';
                                  alert(errorMessage);
                                }
                              }}
                            >
                              ⚡ Pegar
                            </Button>
                          ) : appointment.serviceOrderId ? (
                            <Link href={`/service-orders/${appointment.serviceOrderId}`}>
                              <Button variant="primary">Ver OS</Button>
                            </Link>
                          ) : (
                            <span className="text-xs text-[#7E8691]">Sem OS</span>
                          )}
                          {appointment.status === AppointmentStatus.SCHEDULED && !isPast && (isMine || userRole !== 'mechanic') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await appointmentsApi.cancel(appointment.id);
                                  await loadAppointments();
                                } catch (err: unknown) {
                                  logger.error('Erro ao cancelar agendamento:', err);
                                  alert('Erro ao cancelar agendamento');
                                }
                              }}
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Appointment Modal */}
        <AppointmentModal
          isOpen={showModal}
          onClose={handleModalClose}
          appointment={selectedAppointment}
          initialDate={selectedDate || undefined}
          onSuccess={handleModalSuccess}
        />
      </div>
    </div>
  );
}

