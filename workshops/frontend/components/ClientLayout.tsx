'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from './Sidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import {
  BellIcon,
  ElevatorIcon,
  SettingsIcon,
  WrenchIcon,
  ClockIcon,
} from './icons/MechanicIcons';
import { notificationsApi } from '@/lib/api/notifications';
import { elevatorsApi, ElevatorStatus, type Elevator } from '@/lib/api/elevators';
import { serviceOrdersApi, ServiceOrderStatus } from '@/lib/api/service-orders';
import { appointmentsApi, AppointmentStatus } from '@/lib/api/appointments';
import { logger } from '@/lib/utils/logger';
import { authStorage, uiStorage } from '@/lib/utils/localStorage';

interface ClientLayoutProps {
  readonly children: React.ReactNode;
}

// Rotas que não devem ter sidebar e header
const publicRoutes = ['/login', '/register', '/onboarding', '/', '/quotes/view'];

// Interface para estatísticas do header
interface HeaderStats {
  elevators: {
    total: number;
    free: number;
    occupied: number;
    maintenance: number;
  };
  serviceOrders: {
    inProgress: number;
    scheduled: number;
  };
  appointments: {
    today: number;
    pending: number;
  };
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<HeaderStats>({
    elevators: { total: 0, free: 0, occupied: 0, maintenance: 0 },
    serviceOrders: { inProgress: 0, scheduled: 0 },
    appointments: { today: 0, pending: 0 },
  });
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Verificar se é rota pública
  const isPublicRoute = publicRoutes.some(route => {
    if (!pathname) return false;
    if (pathname === route) return true;
    if (route === '/quotes/view' && pathname.startsWith('/quotes/view')) return true;
    // Permitir todas as subrotas de /onboarding (incluindo /onboarding/success)
    if (route === '/onboarding' && pathname.startsWith('/onboarding')) return true;
    return false;
  });

  // Carregar estatísticas do header
  const loadHeaderStats = useCallback(async () => {
    try {
      // Carregar elevadores
      const elevatorsData = await elevatorsApi.findAll({ limit: 100 });
      const elevatorStats = {
        total: elevatorsData.data.length,
        free: elevatorsData.data.filter((e: Elevator) => e.status === ElevatorStatus.FREE).length,
        occupied: elevatorsData.data.filter((e: Elevator) => e.status === ElevatorStatus.OCCUPIED).length,
        maintenance: elevatorsData.data.filter((e: Elevator) => e.status === ElevatorStatus.MAINTENANCE).length,
      };

      // Carregar OS em andamento
      const osInProgress = await serviceOrdersApi.findAll({ status: ServiceOrderStatus.IN_PROGRESS, limit: 1 });
      const osScheduled = await serviceOrdersApi.findAll({ status: ServiceOrderStatus.SCHEDULED, limit: 1 });

      // Carregar agendamentos do dia
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      const appointmentsToday = await appointmentsApi.findAll({
        startDate: startOfDay,
        endDate: endOfDay,
        limit: 1
      });
      const appointmentsPending = await appointmentsApi.findAll({
        status: AppointmentStatus.SCHEDULED,
        limit: 1
      });

      setStats({
        elevators: elevatorStats,
        serviceOrders: {
          inProgress: osInProgress.total,
          scheduled: osScheduled.total,
        },
        appointments: {
          today: appointmentsToday.total,
          pending: appointmentsPending.total,
        },
      });
    } catch (err: unknown) {
      logger.error('Erro ao carregar estatísticas do header:', err);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    // Verificar estado do sidebar no localStorage
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setSidebarCollapsed(savedState === 'true');
    }

    // Carregar informações do usuário
    const loadUserInfo = () => {
      if (globalThis.window !== undefined) {
        const userName = authStorage.getUserName() || 'Usuário';
        const userEmail = authStorage.getUserEmail() || 'usuario@oficina.com';
        const userRole = authStorage.getUserRole() || 'admin';
        setUser({ name: userName, email: userEmail, role: userRole });
      }
    };

    loadUserInfo();

    // Carregar notificações
    const loadNotifications = async () => {
      try {
        const count = await notificationsApi.getUnreadCount();
        setUnreadNotifications(count);
      } catch (err: unknown) {
        logger.error('Erro ao carregar notificações:', err);
      }
    };

    if (!isPublicRoute) {
      loadNotifications();
      loadHeaderStats();

      // Atualizar relógio a cada minuto
      const clockInterval = setInterval(() => setCurrentTime(new Date()), 60000);

      // Polling de notificações a cada 30 segundos
      const notificationInterval = setInterval(loadNotifications, 30000);

      // Polling de estatísticas a cada 2 minutos
      const statsInterval = setInterval(loadHeaderStats, 120000);

      return () => {
        clearInterval(clockInterval);
        clearInterval(notificationInterval);
        clearInterval(statsInterval);
      };
    }
  }, [isPublicRoute, loadHeaderStats]);

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showUserMenu || showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showNotifications]);

  const handleSidebarToggle = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    uiStorage.setSidebarCollapsed(collapsed);
  };

  const handleLogout = () => {
    authStorage.clearAllAuthData();
    router.push('/login');
  };


  // Durante SSR, não renderizar
  if (!mounted) {
    return <>{children}</>;
  }

  if (isPublicRoute) {
    return (
      <AuthGuard publicRoutes={publicRoutes}>
        {children}
      </AuthGuard>
    );
  }

  // Obter título da página
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname === '/mechanic/dashboard') return 'Dashboard do Mecânico';
    if (pathname?.startsWith('/customers')) return 'Clientes';
    if (pathname?.startsWith('/service-orders')) return 'Ordens de Serviço';
    if (pathname?.startsWith('/quotes')) return 'Orçamentos';
    if (pathname?.startsWith('/appointments')) return 'Agendamentos';
    if (pathname?.startsWith('/vehicles')) return 'Veículos';
    if (pathname?.startsWith('/elevators')) return 'Elevadores';
    if (pathname?.startsWith('/users')) return 'Usuários';
    if (pathname?.startsWith('/settings')) return 'Configurações';
    if (pathname?.startsWith('/mechanic/notifications')) return 'Notificações';
    if (pathname?.startsWith('/mechanic/quotes')) return 'Meus Orçamentos';
    if (pathname?.startsWith('/invoicing')) return 'Faturas';
    if (pathname?.startsWith('/payments')) return 'Pagamentos';
    if (pathname?.startsWith('/reports')) return 'Relatórios';
    if (pathname?.startsWith('/inventory')) return 'Estoque';
    if (pathname?.startsWith('/parts')) return 'Peças';
    if (pathname?.startsWith('/suppliers')) return 'Fornecedores';
    if (pathname?.startsWith('/subscription')) return 'Minha Assinatura';
    if (pathname?.startsWith('/support')) return 'Suporte';
    if (pathname?.startsWith('/diagnostics')) return 'Diagnóstico';
    return 'Mecânica365';
  };

  // Formatar data e hora
  const formatDateTime = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    };
    return currentTime.toLocaleDateString('pt-BR', options);
  };

  return (
    <AuthGuard publicRoutes={publicRoutes}>
      <div className="flex min-h-screen bg-[#0F1115]">
        <Sidebar onToggle={handleSidebarToggle} />
        <div
          className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-52'
            }`}
        >
          {/* Header Fixo */}
          <header
            className={`
            fixed top-0 right-0 h-12 bg-[#1A1E23] border-b border-[#2A3038] z-40
            transition-all duration-300
            ${sidebarCollapsed ? 'left-16' : 'left-52'}
            flex items-center justify-between px-3 lg:px-4
          `}
          >
            {/* Título da Página e Data/Hora */}
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-semibold text-[#D0D6DE]">
                {getPageTitle()}
              </h1>
              <div className="hidden lg:flex items-center text-xs text-[#7E8691] bg-[#2A3038]/50 px-2 py-1 rounded">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDateTime()}
              </div>
            </div>

            {/* Estatísticas e Ações */}
            <div className="flex items-center gap-1.5 lg:gap-2">
              {/* Status de Elevadores */}
              {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'receptionist' || user?.role === 'mechanic') && stats.elevators.total > 0 && (
                <Link
                  href="/elevators"
                  className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-[#2A3038] hover:bg-[#343B46] rounded transition-colors group"
                  title="Ver elevadores"
                >
                  <ElevatorIcon className="text-[#00E0B8] group-hover:scale-110 transition-transform" size={14} />
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-[#00E0B8] font-semibold">{stats.elevators.free}</span>
                    <span className="text-[#7E8691]">liv</span>
                    <span className="text-[#FFAA00] font-semibold">{stats.elevators.occupied}</span>
                    <span className="text-[#7E8691]">oc</span>
                  </div>
                </Link>
              )}

              {/* OS em Andamento */}
              {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'receptionist') && (
                <Link
                  href="/service-orders"
                  className="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-[#2A3038] hover:bg-[#343B46] rounded transition-colors group"
                  title="Ver ordens de serviço"
                >
                  <WrenchIcon className="text-[#3ABFF8] group-hover:scale-110 transition-transform" size={14} />
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-[#3ABFF8] font-semibold">{stats.serviceOrders.inProgress}</span>
                    <span className="text-[#7E8691]">OS</span>
                  </div>
                </Link>
              )}

              {/* Agendamentos do Dia */}
              {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'receptionist') && (
                <Link
                  href="/appointments"
                  className="hidden xl:flex items-center gap-1.5 px-2 py-1 bg-[#2A3038] hover:bg-[#343B46] rounded transition-colors group"
                  title="Ver agendamentos"
                >
                  <ClockIcon className="text-[#A855F7] group-hover:scale-110 transition-transform" size={14} />
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-[#A855F7] font-semibold">{stats.appointments.today}</span>
                    <span className="text-[#7E8691]">hoje</span>
                  </div>
                </Link>
              )}

              {/* Configurações (apenas para admin/manager) */}
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <Link
                  href="/settings"
                  className="p-1.5 text-[#7E8691] hover:text-[#00E0B8] transition-colors"
                  title="Configurações"
                >
                  <SettingsIcon size={16} />
                </Link>
              )}

              {/* Notificações */}
              {(user?.role === 'mechanic' || user?.role === 'admin' || user?.role === 'manager') && (
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-1.5 text-[#7E8691] hover:text-[#00E0B8] transition-colors"
                  >
                    <BellIcon size={16} />
                    {unreadNotifications > 0 && (
                      <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-[#FF4E3D] rounded-full"></span>
                    )}
                  </button>

                  {/* Dropdown de Notificações */}
                  {showNotifications && (
                    <div className="absolute right-0 top-full mt-1 w-72 bg-[#1A1E23] border border-[#2A3038] rounded-lg shadow-xl z-50">
                      <div className="p-3 border-b border-[#2A3038]">
                        <h3 className="text-xs font-semibold text-[#D0D6DE]">Notificações</h3>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {unreadNotifications > 0 ? (
                          <div className="p-3 text-center text-xs text-[#7E8691]">
                            {unreadNotifications} notificação{unreadNotifications > 1 ? 'ões' : ''} não lida{unreadNotifications > 1 ? 's' : ''}
                          </div>
                        ) : (
                          <div className="p-3 text-center text-xs text-[#7E8691]">
                            Nenhuma notificação
                          </div>
                        )}
                      </div>
                      <div className="p-1.5 border-t border-[#2A3038]">
                        <Link
                          href="/mechanic/notifications"
                          className="block text-center text-xs text-[#00E0B8] hover:text-[#3ABFF8] py-1.5"
                          onClick={() => setShowNotifications(false)}
                        >
                          Ver todas
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Menu de Usuário */}
              <div className="flex items-center space-x-2">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-medium text-[#D0D6DE]">{user?.name || 'Usuário'}</p>
                  <p className="text-[10px] text-[#7E8691] capitalize">{user?.role || 'admin'}</p>
                </div>

                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00E0B8] to-[#3ABFF8] flex items-center justify-center hover:ring-2 hover:ring-[#00E0B8] transition-all"
                  >
                    <span className="text-xs font-bold text-[#0F1115]">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </button>

                  {/* Dropdown Menu do Usuário */}
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-1 w-56 bg-[#1A1E23] border border-[#2A3038] rounded-lg shadow-xl z-50">
                      {/* Informações do Usuário */}
                      <div className="p-3 border-b border-[#2A3038]">
                        <p className="text-xs font-medium text-[#D0D6DE]">{user?.name || 'Usuário'}</p>
                        <p className="text-[10px] text-[#7E8691] truncate">{user?.email || 'usuario@oficina.com'}</p>
                        <p className="text-[10px] text-[#00E0B8] mt-0.5 capitalize">{user?.role || 'admin'}</p>
                      </div>

                      {/* Logout */}
                      <div className="p-1.5">
                        <button
                          onClick={handleLogout}
                          className="w-full px-2 py-1.5 rounded text-xs text-[#FF4E3D] hover:bg-[#2A3038] transition-colors flex items-center space-x-1.5"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          <span>Sair</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content com padding para o header */}
          <main className="pt-12 min-h-screen">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

