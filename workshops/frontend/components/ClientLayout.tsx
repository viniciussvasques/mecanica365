'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from './Sidebar';
import {
  BellIcon,
  ElevatorIcon,
  GearIcon,
} from './icons/MechanicIcons';
import { notificationsApi } from '@/lib/api/notifications';

interface ClientLayoutProps {
  children: React.ReactNode;
}

// Rotas que não devem ter sidebar e header
const publicRoutes = ['/login', '/register', '/onboarding', '/', '/quotes/view'];

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Verificar se é rota pública
  const isPublicRoute = publicRoutes.some(route => {
    if (!pathname) return false;
    if (pathname === route) return true;
    if (route === '/quotes/view' && pathname.startsWith('/quotes/view')) return true;
    return false;
  });

  useEffect(() => {
    setMounted(true);
    // Verificar estado do sidebar no localStorage
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setSidebarCollapsed(savedState === 'true');
    }

    // Carregar informações do usuário
    const loadUserInfo = () => {
      if (typeof window !== 'undefined') {
        const userName = localStorage.getItem('userName') || 'Usuário';
        const userEmail = localStorage.getItem('userEmail') || 'usuario@oficina.com';
        const userRole = localStorage.getItem('userRole') || 'admin';
        setUser({ name: userName, email: userEmail, role: userRole });
      }
    };

    loadUserInfo();

    // Carregar notificações
    const loadNotifications = async () => {
      try {
        const count = await notificationsApi.getUnreadCount();
        setUnreadNotifications(count);
      } catch (err) {
        console.error('Erro ao carregar notificações:', err);
      }
    };

    if (!isPublicRoute) {
      loadNotifications();
      // Polling de notificações a cada 30 segundos
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isPublicRoute]);

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
    localStorage.setItem('sidebarCollapsed', String(collapsed));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('subdomain');
    router.push('/login');
  };

  // Funções disponíveis por role
  const getAvailableFeatures = () => {
    if (!user) return [];
    
    const role = user.role;
    const features: Array<{ label: string; href: string }> = [];

    switch (role) {
      case 'admin':
      case 'manager':
        features.push(
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Clientes', href: '/customers' },
          { label: 'Ordens de Serviço', href: '/service-orders' },
          { label: 'Orçamentos', href: '/quotes' },
          { label: 'Agendamentos', href: '/appointments' },
          { label: 'Veículos', href: '/vehicles' },
          { label: 'Elevadores', href: '/elevators' },
          { label: 'Usuários', href: '/users' },
          { label: 'Configurações', href: '/settings' }
        );
        break;
      case 'mechanic':
        features.push(
          { label: 'Meu Dashboard', href: '/mechanic/dashboard' },
          { label: 'Meus Orçamentos', href: '/mechanic/quotes' },
          { label: 'Ordens de Serviço', href: '/service-orders' },
          { label: 'Agendamentos', href: '/appointments' },
          { label: 'Elevadores', href: '/elevators' },
          { label: 'Notificações', href: '/mechanic/notifications' }
        );
        break;
      case 'receptionist':
        features.push(
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Clientes', href: '/customers' },
          { label: 'Ordens de Serviço', href: '/service-orders' },
          { label: 'Orçamentos', href: '/quotes' },
          { label: 'Agendamentos', href: '/appointments' },
          { label: 'Veículos', href: '/vehicles' },
          { label: 'Elevadores', href: '/elevators' }
        );
        break;
      case 'accountant':
        features.push(
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Ordens de Serviço', href: '/service-orders' },
          { label: 'Orçamentos', href: '/quotes' }
        );
        break;
    }

    return features;
  };

  const availableFeatures = getAvailableFeatures();
  const isActive = (href: string) => pathname?.startsWith(href);

  // Durante SSR, não renderizar
  if (!mounted) {
    return <>{children}</>;
  }

  if (isPublicRoute) {
    return <>{children}</>;
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
    return 'Mecânica365';
  };

  return (
    <div className="flex min-h-screen bg-[#0F1115]">
      <Sidebar onToggle={handleSidebarToggle} />
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Header Fixo */}
        <header
          className={`
            fixed top-0 right-0 h-16 bg-[#1A1E23] border-b border-[#2A3038] z-40
            transition-all duration-300
            ${sidebarCollapsed ? 'left-20' : 'left-64'}
            flex items-center justify-between px-6
          `}
        >
          {/* Título da Página */}
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-[#D0D6DE]">
              {getPageTitle()}
            </h1>
          </div>

          {/* Ações do Header */}
          <div className="flex items-center space-x-4">
            {/* Status de Elevadores */}
            {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'receptionist' || user?.role === 'mechanic') && (
              <div className="hidden sm:flex items-center space-x-3 px-4 py-2 bg-[#2A3038] rounded-lg">
                <ElevatorIcon className="text-[#00E0B8]" size={18} />
                <span className="text-sm text-[#D0D6DE]">
                  <span className="text-[#00E0B8]">Elevador 3</span> ocupado / <span className="text-[#00E0B8]">2</span> livres
                </span>
              </div>
            )}

            {/* Notificações */}
            {(user?.role === 'mechanic' || user?.role === 'admin' || user?.role === 'manager') && (
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-[#7E8691] hover:text-[#00E0B8] transition-colors"
                >
                  <BellIcon size={20} />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF4E3D] rounded-full"></span>
                  )}
                </button>

                {/* Dropdown de Notificações */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-[#1A1E23] border border-[#2A3038] rounded-lg shadow-xl z-50">
                    <div className="p-4 border-b border-[#2A3038]">
                      <h3 className="text-sm font-semibold text-[#D0D6DE]">Notificações</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {unreadNotifications > 0 ? (
                        <div className="p-4 text-center text-sm text-[#7E8691]">
                          {unreadNotifications} notificação{unreadNotifications > 1 ? 'ões' : ''} não lida{unreadNotifications > 1 ? 's' : ''}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-sm text-[#7E8691]">
                          Nenhuma notificação
                        </div>
                      )}
                    </div>
                    <div className="p-2 border-t border-[#2A3038]">
                      <Link
                        href={user?.role === 'mechanic' ? '/mechanic/notifications' : '/notifications'}
                        className="block text-center text-sm text-[#00E0B8] hover:text-[#3ABFF8] py-2"
                        onClick={() => setShowNotifications(false)}
                      >
                        Ver todas as notificações
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Menu de Usuário */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-[#D0D6DE]">{user?.name || 'Usuário'}</p>
                <p className="text-xs text-[#7E8691] capitalize">{user?.role || 'admin'}</p>
              </div>
              
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00E0B8] to-[#3ABFF8] flex items-center justify-center hover:ring-2 hover:ring-[#00E0B8] transition-all"
                >
                  <span className="text-sm font-bold text-[#0F1115]">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </button>

                {/* Dropdown Menu do Usuário */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-[#1A1E23] border border-[#2A3038] rounded-lg shadow-xl z-50">
                    {/* Informações do Usuário */}
                    <div className="p-4 border-b border-[#2A3038]">
                      <p className="text-sm font-medium text-[#D0D6DE]">{user?.name || 'Usuário'}</p>
                      <p className="text-xs text-[#7E8691] truncate">{user?.email || 'usuario@oficina.com'}</p>
                      <p className="text-xs text-[#00E0B8] mt-1 capitalize">{user?.role || 'admin'}</p>
                    </div>

                    {/* Funções Disponíveis */}
                    {availableFeatures.length > 0 && (
                      <div className="p-2 border-b border-[#2A3038]">
                        <p className="text-xs font-semibold text-[#7E8691] uppercase px-2 py-1 mb-2">
                          Acesso Rápido
                        </p>
                        <div className="space-y-1 max-h-64 overflow-y-auto">
                          {availableFeatures.map((feature) => (
                            <Link
                              key={feature.href}
                              href={feature.href}
                              onClick={() => setShowUserMenu(false)}
                              className={`
                                block px-3 py-2 rounded-lg text-sm transition-colors
                                ${
                                  isActive(feature.href)
                                    ? 'bg-[#00E0B8]/20 text-[#00E0B8]'
                                    : 'text-[#D0D6DE] hover:bg-[#2A3038]'
                                }
                              `}
                            >
                              {feature.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Configurações e Logout */}
                    <div className="p-2">
                      {(user?.role === 'admin' || user?.role === 'manager') && (
                        <Link
                          href="/settings"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-3 py-2 rounded-lg text-sm text-[#D0D6DE] hover:bg-[#2A3038] transition-colors flex items-center space-x-2 mb-1"
                        >
                          <GearIcon className="w-4 h-4" />
                          <span>Configurações</span>
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full px-3 py-2 rounded-lg text-sm text-[#FF4E3D] hover:bg-[#2A3038] transition-colors flex items-center space-x-2"
                      >
                        <svg
                          className="w-4 h-4"
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
        <main className="pt-16 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}

