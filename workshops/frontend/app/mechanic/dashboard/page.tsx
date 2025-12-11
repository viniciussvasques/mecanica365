'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { quotesApi, Quote, QuoteStatus } from '@/lib/api/quotes';
import { serviceOrdersApi, ServiceOrder, ServiceOrderStatus } from '@/lib/api/service-orders';
import { appointmentsApi, Appointment, AppointmentStatus } from '@/lib/api/appointments';
import { notificationsApi } from '@/lib/api/notifications';
import { Button } from '@/components/ui/Button';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export default function MechanicDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    awaitingDiagnosis: 0,
    diagnosedToday: 0,
    inProgress: 0,
    unreadNotifications: 0,
  });
  const [recentQuotes, setRecentQuotes] = useState<Quote[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [inProgressOrders, setInProgressOrders] = useState<ServiceOrder[]>([]);

  useEffect(() => {
    const token = authStorage.getToken();
    const userRole = authStorage.getUserRole();
    
    if (!token) {
      router.push('/login');
      return;
    }

    // Se não for mecânico, redirecionar para dashboard do sistema
    if (userRole && userRole !== 'mechanic') {
      router.push('/dashboard');
      return;
    }

    loadDashboard();
    
    // Polling de dashboard e notificações a cada 15 segundos
    const interval = setInterval(() => {
      loadDashboard();
      loadNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      // Buscar orçamentos aguardando diagnóstico atribuídos ao mecânico atual
      const userId = authStorage.getUserId();
      if (!userId) {
        router.push('/login');
        return;
      }

      logger.log('[MechanicDashboard] Buscando orçamentos para userId:', userId);

      // Buscar orçamentos aguardando diagnóstico
      const awaitingResponse = await quotesApi.findAll({ 
        status: QuoteStatus.AWAITING_DIAGNOSIS,
        limit: 100 
      });
      
      logger.log('[MechanicDashboard] Orçamentos encontrados:', awaitingResponse.data.length);
      logger.log('[MechanicDashboard] Primeiro orçamento:', awaitingResponse.data[0] ? {
        id: awaitingResponse.data[0].id,
        number: awaitingResponse.data[0].number,
        assignedMechanicId: awaitingResponse.data[0].assignedMechanicId,
        status: awaitingResponse.data[0].status,
      } : 'Nenhum');
      
      // Filtrar orçamentos que:
      // 1. Não têm mecânico atribuído (aparecem para todos) OU
      // 2. Estão atribuídos ao mecânico atual
      const awaitingQuotes = awaitingResponse.data.filter(
        (q: Quote) => !q.assignedMechanicId || q.assignedMechanicId === userId
      );

      logger.log('[MechanicDashboard] Orçamentos disponíveis para o mecânico:', awaitingQuotes.length);

      // Buscar orçamentos diagnosticados hoje
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const diagnosedResponse = await quotesApi.findAll({ 
        status: QuoteStatus.DIAGNOSED,
        limit: 100 
      });
      const diagnosedToday = diagnosedResponse.data.filter((q: Quote) => {
        if (q.assignedMechanicId !== userId) return false;
        const diagnosedDate = new Date(q.updatedAt);
        return diagnosedDate >= todayStart;
      });

      // Buscar ordens de serviço em andamento
      const inProgressResponse = await serviceOrdersApi.findAll({
        status: ServiceOrderStatus.IN_PROGRESS,
        limit: 100,
      });
      const myInProgressOrders = inProgressResponse.data.filter(
        (so: ServiceOrder) => so.technicianId === userId,
      );

      // Buscar próximos agendamentos (próximos 7 dias)
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);
      
      const appointmentsResponse = await appointmentsApi.findAll({
        assignedToId: userId,
        status: AppointmentStatus.SCHEDULED,
        startDate: now.toISOString(),
        endDate: nextWeek.toISOString(),
        limit: 10,
      });
      const upcoming = appointmentsResponse.data
        .filter((apt: Appointment) => {
          const aptDate = new Date(apt.date);
          return aptDate >= now && apt.status === AppointmentStatus.SCHEDULED;
        })
        .sort((a: Appointment, b: Appointment) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

      // Buscar notificações não lidas
      await loadNotifications();

      setStats({
        awaitingDiagnosis: awaitingQuotes.length,
        diagnosedToday: diagnosedToday.length,
        inProgress: myInProgressOrders.length,
        unreadNotifications: stats.unreadNotifications,
      });

      // Orçamentos recentes (últimos 5)
      setRecentQuotes(awaitingQuotes.slice(0, 5));
      
      // Próximos agendamentos (próximos 5)
      setUpcomingAppointments(upcoming.slice(0, 5));
      
      // Ordens de serviço em andamento
      setInProgressOrders(myInProgressOrders.slice(0, 5));
    } catch (err: unknown) {
      logger.error('Erro ao carregar dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const result = await notificationsApi.getUnreadCount();
      setStats(prev => ({ ...prev, unreadNotifications: result }));
    } catch (err: unknown) {
      logger.error('Erro ao carregar notificações:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Subtitle */}
        <div className="mb-8">
          <p className="text-[#7E8691] mt-2">Visão geral dos seus orçamentos e atividades</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#7E8691]">Aguardando Diagnóstico</p>
              <span className="text-2xl">🔧</span>
            </div>
            <p className="text-3xl font-bold text-[#00E0B8]">{stats.awaitingDiagnosis}</p>
            <Link href="/mechanic/quotes" className="text-sm text-[#00E0B8] hover:text-[#3ABFF8] mt-2 inline-block">
              Ver todos →
            </Link>
          </div>

          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#7E8691]">Diagnosticados Hoje</p>
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-3xl font-bold text-[#3ABFF8]">{stats.diagnosedToday}</p>
          </div>

          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#7E8691]">Em Andamento</p>
              <span className="text-2xl">⚙️</span>
            </div>
            <p className="text-3xl font-bold text-[#FFCB2B]">{stats.inProgress}</p>
            <Link href="/service-orders?status=in_progress" className="text-sm text-[#00E0B8] hover:text-[#3ABFF8] mt-2 inline-block">
              Ver todas →
            </Link>
          </div>

          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#7E8691]">Notificações</p>
              <span className="text-2xl">🔔</span>
            </div>
            <p className="text-3xl font-bold text-[#FF4E3D]">{stats.unreadNotifications}</p>
            <Link href="/mechanic/notifications" className="text-sm text-[#00E0B8] hover:text-[#3ABFF8] mt-2 inline-block">
              Ver todas →
            </Link>
          </div>
        </div>

        {/* Grid com duas colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Quotes */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#D0D6DE]">Orçamentos Recentes</h2>
              <Link href="/mechanic/quotes">
                <Button variant="outline" size="sm">Ver todos</Button>
              </Link>
            </div>

            {recentQuotes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#7E8691]">Nenhum orçamento aguardando diagnóstico</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentQuotes.map((quote) => {
                  const isUnassigned = !quote.assignedMechanicId;
                  return (
                    <div
                      key={quote.id}
                      className={`bg-[#0F1115] border-2 rounded-lg p-4 hover:border-[#00E0B8] transition-all ${
                        isUnassigned 
                          ? 'border-[#FFCB2B] animate-blink shadow-lg shadow-[#FFCB2B]/30 ring-2 ring-[#FFCB2B]/20' 
                          : 'border-[#2A3038]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-[#D0D6DE]">{quote.number}</h3>
                            {isUnassigned ? (
                              <span className="px-2 py-1 bg-[#FFCB2B]/20 text-[#FFCB2B] text-xs font-semibold rounded animate-pulse">
                                ⚡ Disponível
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-[#FFA500]/20 text-[#FFA500] text-xs font-semibold rounded">
                                Aguardando
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-[#7E8691]">Cliente</p>
                              <p className="text-[#D0D6DE]">{quote.customer?.name || 'Não informado'}</p>
                            </div>
                            <div>
                              <p className="text-[#7E8691]">Veículo</p>
                              <p className="text-[#D0D6DE]">
                                {quote.vehicle 
                                  ? `${quote.vehicle.placa || 'Sem placa'} - ${quote.vehicle.make || ''} ${quote.vehicle.model || ''}`.trim() || 'Veículo'
                                  : 'Não informado'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          {isUnassigned ? (
                            <Button 
                              variant="primary"
                              onClick={async (e) => {
                                e.preventDefault();
                                try {
                                  await quotesApi.claimQuote(quote.id);
                                  await loadDashboard();
                                } catch (err: unknown) {
                                  logger.error('Erro ao pegar orçamento:', err);
                                  const errorMessage = err instanceof Error ? err.message : 'Erro ao pegar orçamento. Tente novamente.';
                                  alert(errorMessage);
                                }
                              }}
                            >
                              ⚡ Pegar
                            </Button>
                          ) : (
                            <Link href={`/quotes/${quote.id}/diagnose`}>
                              <Button variant="primary">Diagnosticar</Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Próximos Agendamentos */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#D0D6DE]">📅 Próximos Agendamentos</h2>
              <Link href="/appointments">
                <Button variant="outline" size="sm">Ver todos</Button>
              </Link>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#7E8691]">Nenhum agendamento nos próximos dias</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => {
                  const appointmentDate = new Date(appointment.date);
                  const isToday = appointmentDate.toDateString() === new Date().toDateString();
                  const isTomorrow = appointmentDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
                  
                  return (
                    <div
                      key={appointment.id}
                      className={`bg-[#0F1115] border-2 rounded-lg p-4 hover:border-[#00E0B8] transition-all ${
                        isToday 
                          ? 'border-[#00E0B8] shadow-lg shadow-[#00E0B8]/30' 
                          : 'border-[#2A3038]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-[#D0D6DE]">
                              {isToday ? 'Hoje' : isTomorrow ? 'Amanhã' : appointmentDate.toLocaleDateString('pt-BR')}
                            </h3>
                            <span className="text-sm text-[#7E8691]">
                              {appointmentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isToday && (
                              <span className="px-2 py-1 bg-[#00E0B8]/20 text-[#00E0B8] text-xs font-semibold rounded animate-pulse">
                                Hoje
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
                        </div>
                        <div className="ml-4">
                          {appointment.serviceOrderId ? (
                            <Link href={`/service-orders/${appointment.serviceOrderId}`}>
                              <Button variant="primary">Ver OS</Button>
                            </Link>
                          ) : (
                            <span className="text-xs text-[#7E8691]">Sem OS</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Ordens de Serviço em Andamento */}
        {inProgressOrders.length > 0 && (
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#D0D6DE]">⚙️ Ordens de Serviço em Andamento</h2>
              <Link href="/service-orders?status=in_progress">
                <Button variant="outline" size="sm">Ver todas</Button>
              </Link>
            </div>

            <div className="space-y-4">
              {inProgressOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-[#0F1115] border-2 border-[#FFCB2B] rounded-lg p-4 hover:border-[#00E0B8] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-[#D0D6DE]">{order.number}</h3>
                        <span className="px-2 py-1 bg-[#FFCB2B]/20 text-[#FFCB2B] text-xs font-semibold rounded">
                          Em Andamento
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-[#7E8691]">Cliente</p>
                          <p className="text-[#D0D6DE]">{order.customer?.name || 'Não informado'}</p>
                        </div>
                        <div>
                          <p className="text-[#7E8691]">Veículo</p>
                          <p className="text-[#D0D6DE]">
                            {order.vehicle 
                              ? `${order.vehicle.placa || 'Sem placa'} - ${order.vehicle.make || ''} ${order.vehicle.model || ''}`.trim() || 'Veículo'
                              : 'Não informado'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <Link href={`/service-orders/${order.id}`}>
                        <Button variant="primary">Ver OS</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

