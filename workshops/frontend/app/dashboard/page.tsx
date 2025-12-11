'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChangePasswordModal } from '@/components/ChangePasswordModal';
import { serviceOrdersApi, ServiceOrderStatus } from '@/lib/api/service-orders';
import { quotesApi, QuoteStatus } from '@/lib/api/quotes';
import { usersApi } from '@/lib/api/users';
import { invoicingApi } from '@/lib/api/invoicing';
import { paymentsApi } from '@/lib/api/payments';
import { appointmentsApi } from '@/lib/api/appointments';
import { elevatorsApi } from '@/lib/api/elevators';
import { inventoryApi } from '@/lib/api/inventory';
import { useNotification } from '@/components/NotificationProvider';
import { authStorage } from '@/lib/utils/localStorage';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
import {
  CarIcon,
  PistonIcon,
  WrenchIcon,
  GearIcon,
  BrakePadIcon,
  OilIcon,
  FilterIcon,
  EngineIcon,
  ElevatorIcon,
  ScannerIcon,
  BellIcon,
} from '@/components/icons/MechanicIcons';

interface DashboardStats {
  serviceOrders: {
    total: number;
    awaitingDiagnosis: number;
    inService: number;
    readyForDelivery: number;
  };
  quotes: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
  };
  team: {
    total: number;
    active: number;
  };
  billing: {
    today: number;
    thisMonth: number;
  };
  appointments: Array<{
    id: string;
    time: string;
    service: string;
    car: string;
    color: string;
    icon: typeof CarIcon;
  }>;
  elevators: Array<{
    id: string;
    status: string;
    label: string;
  }>;
  inventory: {
    critical: Array<{
      name: string;
      stock: number;
      status: string;
      icon: typeof BrakePadIcon;
    }>;
    stockPercentage: number;
  };
  diagnostics: {
    errors: string[];
    warnings: string[];
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showNotification } = useNotification();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    const subdomain = searchParams.get('subdomain') || localStorage.getItem('subdomain');
    const userRole = localStorage.getItem('userRole');

    if (!token) {
      router.push('/login');
      return;
    }

    // Se for mecânico, redirecionar para dashboard do mecânico
    if (userRole === 'mechanic') {
      router.push('/mechanic/dashboard');
      return;
    }

    // Verificar se é primeiro login ou se deve mostrar modal
    const isFirstLogin = localStorage.getItem('isFirstLogin') === 'true' || 
                         searchParams.get('firstLogin') === 'true' ||
                         localStorage.getItem('showPasswordModal') === 'true';
    
    const userId = localStorage.getItem('userId');
    const passwordChangedKey = userId ? `passwordChanged_${userId}` : null;
    const alreadyChanged = passwordChangedKey ? localStorage.getItem(passwordChangedKey) : null;
    
    if (isFirstLogin && !alreadyChanged) {
      setShowChangePasswordModal(true);
      authStorage.removeIsFirstLogin();
      authStorage.removeShowPasswordModal();
    }

    setTimeout(() => {
      setUser({
        name: 'Admin',
        email: 'admin@oficina.com',
        role: userRole || 'admin',
      });
      setLoading(false);
    }, 1000);

    loadDashboardData();
  }, [router, searchParams]);

  const loadDashboardData = async () => {
    try {
      setLoadingData(true);

      // Buscar dados em paralelo
      const [
        serviceOrdersResponse,
        quotesResponse,
        usersResponse,
        invoicesResponse,
        paymentsResponse,
        appointmentsResponse,
        elevatorsResponse,
        inventoryResponse,
      ] = await Promise.allSettled([
        serviceOrdersApi.findAll({ page: 1, limit: 100 }),
        quotesApi.findAll({ page: 1, limit: 100 }),
        usersApi.findAll({ role: 'mechanic', isActive: true }),
        invoicingApi.findAll({ page: 1, limit: 100 }),
        paymentsApi.findAll({ page: 1, limit: 100 }),
        appointmentsApi.findAll({ page: 1, limit: 20 }),
        elevatorsApi.findAll(),
        inventoryApi.findAll({ page: 1, limit: 100 }),
      ]);

      // Processar Service Orders
      const serviceOrders = serviceOrdersResponse.status === 'fulfilled' 
        ? serviceOrdersResponse.value.data || []
        : [];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const serviceOrdersToday = serviceOrders.filter((so: any) => {
        const soDate = new Date(so.createdAt);
        soDate.setHours(0, 0, 0, 0);
        return soDate.getTime() === today.getTime();
      });

      const awaitingDiagnosis = serviceOrdersToday.filter(
        (so: any) => so.status === ServiceOrderStatus.SCHEDULED || so.status === 'awaiting_diagnosis'
      ).length;
      const inService = serviceOrdersToday.filter(
        (so: any) => so.status === ServiceOrderStatus.IN_PROGRESS
      ).length;
      const readyForDelivery = serviceOrdersToday.filter(
        (so: any) => so.status === ServiceOrderStatus.COMPLETED
      ).length;

      // Processar Quotes
      const quotes = quotesResponse.status === 'fulfilled'
        ? quotesResponse.value.data || []
        : [];

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const quotesThisMonth = quotes.filter((q: any) => {
        const qDate = new Date(q.createdAt);
        return qDate >= thisMonth;
      });

      const approved = quotesThisMonth.filter(
        (q: any) => q.status === QuoteStatus.ACCEPTED
      ).length;
      const rejected = quotesThisMonth.filter(
        (q: any) => q.status === QuoteStatus.REJECTED
      ).length;
      const pending = quotesThisMonth.filter(
        (q: any) => q.status === QuoteStatus.SENT || q.status === QuoteStatus.VIEWED || q.status === QuoteStatus.DRAFT
      ).length;

      // Processar Users (Equipe)
      const users = usersResponse.status === 'fulfilled'
        ? usersResponse.value || []
        : [];
      
      const activeMechanics = users.filter((u: any) => u.isActive && u.role === 'mechanic');

      // Processar Billing
      const invoices = invoicesResponse.status === 'fulfilled'
        ? invoicesResponse.value.data || []
        : [];
      
      const payments = paymentsResponse.status === 'fulfilled'
        ? paymentsResponse.value.data || []
        : [];

      const invoicesToday = invoices.filter((inv: any) => {
        const invDate = new Date(inv.createdAt);
        invDate.setHours(0, 0, 0, 0);
        return invDate.getTime() === today.getTime();
      });

      const paymentsToday = payments.filter((pay: any) => {
        const payDate = new Date(pay.createdAt);
        payDate.setHours(0, 0, 0, 0);
        return payDate.getTime() === today.getTime();
      });

      const billingToday = invoicesToday.reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0) +
        paymentsToday.reduce((sum: number, pay: any) => sum + Number(pay.amount || 0), 0);

      const invoicesThisMonth = invoices.filter((inv: any) => {
        const invDate = new Date(inv.createdAt);
        return invDate >= thisMonth;
      });

      const paymentsThisMonth = payments.filter((pay: any) => {
        const payDate = new Date(pay.createdAt);
        return payDate >= thisMonth;
      });

      const billingThisMonth = invoicesThisMonth.reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0) +
        paymentsThisMonth.reduce((sum: number, pay: any) => sum + Number(pay.amount || 0), 0);

      // Processar Appointments
      const appointments = appointmentsResponse.status === 'fulfilled'
        ? appointmentsResponse.value.data || []
        : [];

      const todayAppointments = appointments
        .filter((apt: any) => {
          const aptDate = new Date(apt.date);
          aptDate.setHours(0, 0, 0, 0);
          return aptDate.getTime() === today.getTime();
        })
        .slice(0, 4)
        .map((apt: any, idx: number) => {
          const date = new Date(apt.date);
          const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          const colors = ['turquoise', 'red', 'blue', 'yellow'];
          const icons = [OilIcon, BrakePadIcon, EngineIcon, FilterIcon];
          
          return {
            id: apt.id,
            time,
            service: apt.serviceType || 'Serviço',
            car: apt.customer?.name || apt.vehicle?.make || 'Veículo',
            color: colors[idx % colors.length],
            icon: icons[idx % icons.length],
          };
        });

      // Processar Elevators
      const elevators = elevatorsResponse.status === 'fulfilled'
        ? elevatorsResponse.value.data || []
        : [];

      const elevatorStatuses = elevators.map((elev: any) => ({
        id: elev.id,
        status: elev.status,
        label: elev.name || `Elevador ${elev.number}`,
      }));

      // Processar Inventory
      const inventory = inventoryResponse.status === 'fulfilled'
        ? inventoryResponse.value.data || []
        : [];

      const criticalParts = inventory
        .filter((item: any) => {
          const status = item.stockStatus;
          return status === 'low_stock' || status === 'out_of_stock';
        })
        .slice(0, 4)
        .map((item: any) => {
          const icons = [BrakePadIcon, OilIcon, FilterIcon, GearIcon];
          const iconIndex = Math.floor(Math.random() * icons.length);
          
          return {
            name: item.name,
            stock: item.quantity || 0,
            status: item.stockStatus === 'out_of_stock' ? 'low' : item.stockStatus === 'low_stock' ? 'alert' : 'ok',
            icon: icons[iconIndex],
          };
        });

      const totalItems = inventory.length;
      const inStockItems = inventory.filter((item: any) => item.stockStatus === 'in_stock').length;
      const stockPercentage = totalItems > 0 ? Math.round((inStockItems / totalItems) * 100) : 0;

      // Processar Diagnostics (quotes com diagnóstico pendente)
      const diagnosticsErrors: string[] = [];
      const diagnosticsWarnings: string[] = [];

      const pendingDiagnosis = quotes.filter(
        (q: any) => q.status === QuoteStatus.AWAITING_DIAGNOSIS || q.status === QuoteStatus.DIAGNOSED
      );

      if (pendingDiagnosis.length > 0) {
        diagnosticsWarnings.push(`${pendingDiagnosis.length} orçamentos aguardando diagnóstico`);
      }

      setStats({
        serviceOrders: {
          total: serviceOrdersToday.length,
          awaitingDiagnosis,
          inService,
          readyForDelivery,
        },
        quotes: {
          total: quotesThisMonth.length,
          approved,
          rejected,
          pending,
        },
        team: {
          total: users.length,
          active: activeMechanics.length,
        },
        billing: {
          today: billingToday,
          thisMonth: billingThisMonth,
        },
        appointments: todayAppointments,
        elevators: elevatorStatuses,
        inventory: {
          critical: criticalParts,
          stockPercentage,
        },
        diagnostics: {
          errors: diagnosticsErrors,
          warnings: diagnosticsWarnings,
        },
      });
    } catch (error: unknown) {
      logger.error('[DashboardPage] Erro ao carregar dados do dashboard:', error);
      showNotification('Erro ao carregar dados do dashboard', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = () => {
    authStorage.clearAuthData();
    authStorage.removeIsFirstLogin();
    router.push('/login');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#2A3038] border-t-[#00E0B8] mx-auto"></div>
          <p className="mt-4 text-[#7E8691]">Carregando...</p>
        </div>
      </div>
    );
  }

  const statusMap = {
    free: { bg: 'bg-[#00E0B8]/10 border-[#00E0B8]', icon: '🟢', text: 'Livre' },
    occupied: { bg: 'bg-[#FF4E3D]/10 border-[#FF4E3D]', icon: '🔴', text: 'Ocupado' },
    maintenance: { bg: 'bg-[#FFCB2B]/10 border-[#FFCB2B]', icon: '🟡', text: 'Manutenção' },
    scheduled: { bg: 'bg-[#3ABFF8]/10 border-[#3ABFF8]', icon: '🔵', text: 'Agendado' },
  };

  return (
    <div className="min-h-screen bg-[#0F1115]">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className={`mb-8 transform transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 className="text-3xl font-bold text-[#D0D6DE] mb-2">
            Bem-vindo, {user?.name}! 👋
          </h2>
          <p className="text-[#7E8691]">
            Visão geral da sua oficina hoje
          </p>
        </div>

        {loadingData ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2A3038] border-t-[#00E0B8] mx-auto"></div>
            <p className="mt-4 text-[#7E8691]">Carregando dados...</p>
          </div>
        ) : (
          <>
            {/* SEÇÃO 1 - VISÃO RÁPIDA (CARDS GRANDES) */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 transform transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {/* Card 1: Carros no pátio */}
              <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 shadow-lg hover:shadow-xl hover:border-[#00E0B8]/50 transition-all duration-300 group relative overflow-hidden">
                <div className="hud-line"></div>
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-gradient-to-br from-[#00E0B8]/20 to-[#00E0B8]/5 p-3 rounded-lg">
                    <CarIcon className="text-[#00E0B8]" size={28} />
                  </div>
                  <span className="text-xs text-[#7E8691] bg-[#2A3038] px-2 py-1 rounded">Hoje</span>
                </div>
                <h3 className="text-lg font-semibold text-[#D0D6DE] mb-1">Carros no Pátio</h3>
                <p className="text-3xl font-bold text-[#00E0B8] mb-2">{stats?.serviceOrders.total || 0}</p>
                <div className="space-y-1 text-xs text-[#7E8691]">
                  <div className="flex justify-between">
                    <span>Aguardando diagnóstico</span>
                    <span className="text-[#FFCB2B]">{stats?.serviceOrders.awaitingDiagnosis || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Em serviço</span>
                    <span className="text-[#3ABFF8]">{stats?.serviceOrders.inService || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prontos para entrega</span>
                    <span className="text-[#00E0B8]">{stats?.serviceOrders.readyForDelivery || 0}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Orçamentos */}
              <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 shadow-lg hover:shadow-xl hover:border-[#3ABFF8]/50 transition-all duration-300 group relative overflow-hidden">
                <div className="hud-line"></div>
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-gradient-to-br from-[#3ABFF8]/20 to-[#3ABFF8]/5 p-3 rounded-lg">
                    <PistonIcon className="text-[#3ABFF8]" size={28} />
                  </div>
                  <span className="text-xs text-[#7E8691] bg-[#2A3038] px-2 py-1 rounded">Este mês</span>
                </div>
                <h3 className="text-lg font-semibold text-[#D0D6DE] mb-1">Orçamentos</h3>
                <p className="text-3xl font-bold text-[#3ABFF8] mb-2">{stats?.quotes.total || 0}</p>
                <div className="space-y-1 text-xs text-[#7E8691]">
                  <div className="flex justify-between">
                    <span>Aprovados</span>
                    <span className="text-[#00E0B8]">{stats?.quotes.approved || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recusados</span>
                    <span className="text-[#FF4E3D]">{stats?.quotes.rejected || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pendentes</span>
                    <span className="text-[#FFCB2B]">{stats?.quotes.pending || 0}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Horários / Equipe */}
              <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 shadow-lg hover:shadow-xl hover:border-[#FFCB2B]/50 transition-all duration-300 group relative overflow-hidden">
                <div className="hud-line"></div>
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-gradient-to-br from-[#FFCB2B]/20 to-[#FFCB2B]/5 p-3 rounded-lg">
                    <WrenchIcon className="text-[#FFCB2B]" size={28} />
                  </div>
                  <span className="text-xs text-[#7E8691] bg-[#2A3038] px-2 py-1 rounded">Agora</span>
                </div>
                <h3 className="text-lg font-semibold text-[#D0D6DE] mb-1">Equipe</h3>
                <p className="text-3xl font-bold text-[#FFCB2B] mb-2">{stats?.team.active || 0}</p>
                <div className="space-y-1 text-xs text-[#7E8691]">
                  <div className="flex justify-between">
                    <span>Mecânicos ativos</span>
                    <span className="text-[#00E0B8]">{stats?.team.active || 0}</span>
                  </div>
                  {stats?.appointments && stats.appointments.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#2A3038]">
                      <span className="text-[#7E8691]">Próxima:</span>
                      <p className="text-[#D0D6DE] font-medium">{stats.appointments[0].car} às {stats.appointments[0].time}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 4: Faturamento */}
              <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 shadow-lg hover:shadow-xl hover:border-[#00E0B8]/50 transition-all duration-300 group relative overflow-hidden">
                <div className="hud-line"></div>
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-gradient-to-br from-[#00E0B8]/20 to-[#00E0B8]/5 p-3 rounded-lg">
                    <GearIcon className="text-[#00E0B8]" size={28} />
                  </div>
                  <span className="text-xs text-[#7E8691] bg-[#2A3038] px-2 py-1 rounded">
                    {new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[#D0D6DE] mb-1">Faturamento</h3>
                <p className="text-3xl font-bold text-[#00E0B8] mb-2">{formatCurrency(stats?.billing.today || 0)}</p>
                <div className="space-y-1 text-xs text-[#7E8691]">
                  <div className="flex justify-between">
                    <span>Hoje</span>
                    <span className="text-[#00E0B8]">{formatCurrency(stats?.billing.today || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Este mês</span>
                    <span className="text-[#00E0B8]">{formatCurrency(stats?.billing.thisMonth || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO 2 - AGENDA DO DIA */}
            <div className={`bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 shadow-lg mb-8 transform transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-[#D0D6DE] flex items-center space-x-2">
                  <GearIcon className="text-[#00E0B8]" size={20} />
                  <span>Agenda do Dia</span>
                </h3>
                <span className="text-sm text-[#7E8691]">
                  {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              {stats?.appointments && stats.appointments.length > 0 ? (
                <div className="flex space-x-4 overflow-x-auto pb-4">
                  {stats.appointments.map((item, idx) => {
                    const Icon = item.icon;
                    const colorMap = {
                      turquoise: 'bg-[#00E0B8]/10 border-[#00E0B8] text-[#00E0B8]',
                      red: 'bg-[#FF4E3D]/10 border-[#FF4E3D] text-[#FF4E3D]',
                      blue: 'bg-[#3ABFF8]/10 border-[#3ABFF8] text-[#3ABFF8]',
                      yellow: 'bg-[#FFCB2B]/10 border-[#FFCB2B] text-[#FFCB2B]',
                    };
                    return (
                      <div key={item.id || idx} className={`flex-shrink-0 w-64 p-4 rounded-lg border-2 ${colorMap[item.color as keyof typeof colorMap]} animate-scale-in`} style={{ animationDelay: `${idx * 0.1}s` }}>
                        <div className="flex items-center space-x-3 mb-3">
                          <Icon size={24} />
                          <div>
                            <p className="font-semibold text-sm">{item.time}</p>
                            <p className="text-xs opacity-80">{item.service}</p>
                          </div>
                        </div>
                        <p className="text-sm font-medium">{item.car}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[#7E8691] text-center py-8">Nenhum agendamento para hoje</p>
              )}
            </div>

            {/* SEÇÃO 3 - STATUS DOS ELEVADORES */}
            <div className={`bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 shadow-lg mb-8 transform transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <h3 className="text-xl font-semibold text-[#D0D6DE] mb-6 flex items-center space-x-2">
                <ElevatorIcon className="text-[#00E0B8]" size={20} />
                <span>Status dos Elevadores</span>
              </h3>
              {stats?.elevators && stats.elevators.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.elevators.map((elevator) => {
                    const status = statusMap[elevator.status as keyof typeof statusMap] || statusMap.free;
                    return (
                      <div key={elevator.id} className={`${status.bg} border-2 rounded-lg p-4 text-center animate-scale-in`}>
                        <ElevatorIcon className="mx-auto mb-2" size={32} />
                        <p className="text-lg font-bold text-[#D0D6DE] mb-1">{elevator.label}</p>
                        <p className="text-sm font-medium">{status.text}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[#7E8691] text-center py-8">Nenhum elevador cadastrado</p>
              )}
            </div>

            {/* SEÇÃO 4 - PEÇAS / ESTOQUE */}
            <div className={`bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 shadow-lg mb-8 transform transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <h3 className="text-xl font-semibold text-[#D0D6DE] mb-6 flex items-center space-x-2">
                <GearIcon className="text-[#00E0B8]" size={20} />
                <span>Inventário Mecânico</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-[#7E8691] uppercase tracking-wide">Peças Críticas</h4>
                  {stats?.inventory.critical && stats.inventory.critical.length > 0 ? (
                    stats.inventory.critical.map((part, idx) => {
                      const Icon = part.icon;
                      const statusColor = part.status === 'low' ? 'text-[#FF4E3D]' : part.status === 'alert' ? 'text-[#FFCB2B]' : 'text-[#00E0B8]';
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 bg-[#2A3038] rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Icon className={statusColor} size={20} />
                            <span className="text-[#D0D6DE] text-sm">{part.name}</span>
                          </div>
                          <span className={`font-semibold ${statusColor}`}>{part.stock} unidades</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-[#7E8691] text-sm">Nenhuma peça crítica no momento</p>
                  )}
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    <svg className="transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#2A3038" strokeWidth="8" />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        fill="none" 
                        stroke="#00E0B8" 
                        strokeWidth="8" 
                        strokeDasharray={`${(stats?.inventory.stockPercentage || 0) * 2 * Math.PI * 40 / 100} ${2 * Math.PI * 40}`} 
                        strokeLinecap="round" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-3xl font-bold text-[#00E0B8]">{stats?.inventory.stockPercentage || 0}%</p>
                      <p className="text-xs text-[#7E8691]">Em Estoque</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO 5 - ALERTAS / DIAGNÓSTICOS */}
            <div className={`bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 shadow-lg transform transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <h3 className="text-xl font-semibold text-[#D0D6DE] mb-6 flex items-center space-x-2">
                <ScannerIcon className="text-[#00E0B8]" size={20} />
                <span>Computador de Bordo</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#2A3038] rounded-lg p-4 border border-[#FF4E3D]/30">
                  <div className="flex items-center space-x-2 mb-3">
                    <ScannerIcon className="text-[#FF4E3D]" size={18} />
                    <h4 className="text-sm font-semibold text-[#FF4E3D]">Erros OBD2 Recentes</h4>
                  </div>
                  {stats?.diagnostics.errors && stats.diagnostics.errors.length > 0 ? (
                    <div className="space-y-2 text-xs font-mono">
                      {stats.diagnostics.errors.map((error, idx) => (
                        <div key={idx} className="text-[#D0D6DE]">{error}</div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#7E8691]">Nenhum erro detectado</p>
                  )}
                </div>
                <div className="bg-[#2A3038] rounded-lg p-4 border border-[#FFCB2B]/30">
                  <div className="flex items-center space-x-2 mb-3">
                    <BellIcon className="text-[#FFCB2B]" size={18} />
                    <h4 className="text-sm font-semibold text-[#FFCB2B]">Avisos de Manutenção</h4>
                  </div>
                  {stats?.diagnostics.warnings && stats.diagnostics.warnings.length > 0 ? (
                    <div className="space-y-2 text-xs">
                      {stats.diagnostics.warnings.map((warning, idx) => (
                        <div key={idx} className="text-[#D0D6DE]">{warning}</div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#7E8691]">Nenhum aviso no momento</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => {
          setShowChangePasswordModal(false);
          authStorage.removeIsFirstLogin();
        }}
        onSuccess={() => {
          setShowChangePasswordModal(false);
        }}
      />
    </div>
  );
}
