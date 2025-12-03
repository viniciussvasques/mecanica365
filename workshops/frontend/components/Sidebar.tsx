'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  GearIcon,
  CarIcon,
  WrenchIcon,
  BrakePadIcon,
  OilIcon,
  FilterIcon,
  EngineIcon,
  ElevatorIcon,
  ScannerIcon,
  BellIcon,
  ClockIcon,
} from './icons/MechanicIcons';

interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  roles?: string[]; // Roles que podem ver este item (undefined = todos)
}

const allMenuItems: MenuItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: GearIcon, roles: ['admin', 'manager', 'receptionist', 'accountant'] },
  { label: 'Meu Dashboard', href: '/mechanic/dashboard', icon: GearIcon, roles: ['mechanic'] },
  { label: 'Clientes', href: '/customers', icon: CarIcon, roles: ['admin', 'manager', 'receptionist'] },
  { label: 'Ordens de Serviço', href: '/service-orders', icon: WrenchIcon, roles: ['admin', 'manager', 'receptionist', 'mechanic'] },
  { label: 'Orçamentos', href: '/quotes', icon: BrakePadIcon, roles: ['admin', 'manager', 'receptionist'] },
  { label: 'Meus Orçamentos', href: '/mechanic/quotes', icon: BrakePadIcon, roles: ['mechanic'] },
  { label: 'Agendamentos', href: '/appointments', icon: ClockIcon, roles: ['admin', 'manager', 'receptionist', 'mechanic'] },
  { label: 'Usuários', href: '/users', icon: GearIcon, roles: ['admin', 'manager'] },
  { label: 'Estoque', href: '/inventory', icon: OilIcon, roles: ['admin', 'manager'] },
  { label: 'Peças', href: '/parts', icon: FilterIcon, roles: ['admin', 'manager'] },
  { label: 'Veículos', href: '/vehicles', icon: EngineIcon, roles: ['admin', 'manager', 'receptionist'] },
  { label: 'Elevadores', href: '/elevators', icon: ElevatorIcon, roles: ['admin', 'manager', 'receptionist', 'mechanic'] },
  { label: 'Diagnóstico', href: '/diagnostics', icon: ScannerIcon, roles: ['admin', 'manager'] },
  { label: 'Notificações', href: '/mechanic/notifications', icon: BellIcon, roles: ['mechanic'] },
  { label: 'Configurações', href: '/settings', icon: GearIcon, roles: ['admin', 'manager'] },
];

interface SidebarProps {
  onToggle?: (collapsed: boolean) => void;
}

export function Sidebar({ onToggle }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    // Função para decodificar JWT e extrair role
    const decodeJWT = (token: string): { role?: string } | null => {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join(''),
        );
        return JSON.parse(jsonPayload);
      } catch {
        return null;
      }
    };

    // Função para carregar role
    const loadUserRole = () => {
      if (typeof window !== 'undefined') {
        // Primeiro, tentar do localStorage
        let role = localStorage.getItem('userRole');
        console.log('[Sidebar] Role carregado do localStorage:', role);
        
        // Se não encontrar, tentar decodificar do token JWT
        if (!role) {
          const token = localStorage.getItem('token');
          if (token) {
            const payload = decodeJWT(token);
            if (payload?.role) {
              role = payload.role;
              // Salvar no localStorage para próxima vez
              localStorage.setItem('userRole', role);
              console.log('[Sidebar] Role extraído do token JWT:', role);
            }
          }
        }
        
        if (role) {
          setUserRole(role);
        } else {
          // Tentar novamente após um pequeno delay (pode estar sendo salvo ainda)
          setTimeout(() => {
            const retryRole = localStorage.getItem('userRole');
            console.log('[Sidebar] Retry - Role carregado:', retryRole);
            if (retryRole) {
              setUserRole(retryRole);
            } else {
              // Tentar decodificar do token novamente
              const token = localStorage.getItem('token');
              if (token) {
                const payload = decodeJWT(token);
                if (payload?.role) {
                  const extractedRole = payload.role;
                  localStorage.setItem('userRole', extractedRole);
                  setUserRole(extractedRole);
                  console.log('[Sidebar] Role extraído do token JWT no retry:', extractedRole);
                  return;
                }
              }
              console.warn('[Sidebar] Role não encontrado no localStorage após retry');
            }
          }, 500);
        }
      }
    };
    
    // Carregar role inicial
    loadUserRole();
    
    // Carregar informações do usuário
    const loadUserInfo = () => {
      if (typeof window !== 'undefined') {
        const userName = localStorage.getItem('userName') || 'Usuário';
        const userEmail = localStorage.getItem('userEmail') || 'usuario@oficina.com';
        setUser({ name: userName, email: userEmail });
      }
    };
    
    loadUserInfo();
    
    // Listener para mudanças no localStorage (caso o role seja atualizado em outra aba)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userRole') {
        console.log('[Sidebar] Role mudou no localStorage:', e.newValue);
        setUserRole(e.newValue);
      }
      if (e.key === 'userName' || e.key === 'userEmail') {
        loadUserInfo();
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }
    
    // Carregar estado do sidebar do localStorage
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState !== null) {
        const isCollapsed = savedState === 'true';
        setCollapsed(isCollapsed);
        onToggle?.(isCollapsed);
      }
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }, [onToggle]);
  
  // Verificar role periodicamente (para mudanças na mesma aba)
  useEffect(() => {
    if (!userRole && typeof window !== 'undefined') {
      const interval = setInterval(() => {
        const currentRole = localStorage.getItem('userRole');
        if (currentRole && currentRole !== userRole) {
          console.log('[Sidebar] Role atualizado via polling:', currentRole);
          setUserRole(currentRole);
        }
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [userRole]);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Função de logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('subdomain');
    router.push('/login');
  };

  // Filtrar itens do menu baseado no role
  const menuItems = allMenuItems.filter((item) => {
    // Se não tem roles definidos, todos podem ver
    if (!item.roles) return true;
    
    // Se não tem role, tentar carregar novamente
    if (!userRole) {
      const roleFromStorage = localStorage.getItem('userRole');
      if (roleFromStorage) {
        setUserRole(roleFromStorage);
        return item.roles.includes(roleFromStorage);
      }
      // Se ainda não tem role, mostrar itens padrão (admin/manager) como fallback
      // para evitar sidebar vazia durante carregamento
      return item.roles.includes('admin') || item.roles.includes('manager');
    }
    
    // Garantir que apenas itens do role atual sejam mostrados
    return item.roles.includes(userRole);
  });

  const isActive = (href: string) => {
    if (!mounted || !pathname) return false;
    if (href === '/dashboard' || href === '/mechanic/dashboard') {
      return pathname === '/dashboard' || pathname === '/mechanic/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen bg-[#1A1E23] border-r border-[#2A3038] z-50
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-20' : 'w-64'}
        flex flex-col
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-[#2A3038] flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#00E0B8] to-[#3ABFF8] rounded-lg flex items-center justify-center">
              <GearIcon className="w-5 h-5 text-[#0F1115]" />
            </div>
            <span className="text-lg font-bold text-[#D0D6DE]">Mecânica365</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-[#00E0B8] to-[#3ABFF8] rounded-lg flex items-center justify-center mx-auto">
            <GearIcon className="w-5 h-5 text-[#0F1115]" />
          </div>
        )}
        <button
          onClick={() => {
            const newState = !collapsed;
            setCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', String(newState));
            onToggle?.(newState);
          }}
          className="p-2 rounded-lg hover:bg-[#2A3038] text-[#7E8691] hover:text-[#D0D6DE] transition-colors"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <svg
            className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}
            />
          </svg>
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center space-x-3 px-4 py-3 rounded-lg
                transition-all duration-200
                group
                ${
                  active
                    ? 'bg-gradient-to-r from-[#00E0B8]/20 to-[#3ABFF8]/20 border border-[#00E0B8]/30 text-[#00E0B8]'
                    : 'text-[#7E8691] hover:bg-[#2A3038] hover:text-[#D0D6DE]'
                }
              `}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`
                  w-5 h-5 flex-shrink-0
                  ${active ? 'text-[#00E0B8]' : 'text-[#7E8691] group-hover:text-[#D0D6DE]'}
                  transition-colors
                `}
              />
              {!collapsed && (
                <>
                  <span className="flex-1 font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-1 text-xs font-bold rounded-full bg-[#FF4E3D] text-white">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer - Avatar com Menu */}
      <div className="p-4 border-t border-[#2A3038]">
        {!collapsed && (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-[#2A3038]/50 hover:bg-[#2A3038] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00E0B8] to-[#3ABFF8] flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#0F1115]">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-[#D0D6DE] truncate">
                  {user?.name || 'Usuário'}
                </p>
                <p className="text-xs text-[#7E8691] truncate">
                  {user?.email || 'usuario@oficina.com'}
                </p>
              </div>
              <svg
                className={`w-4 h-4 text-[#7E8691] transition-transform ${
                  showUserMenu ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1A1E23] border border-[#2A3038] rounded-lg shadow-xl overflow-hidden z-50">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left text-sm text-[#D0D6DE] hover:bg-[#2A3038] transition-colors flex items-center space-x-2"
                >
                  <svg
                    className="w-4 h-4 text-[#FF4E3D]"
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
                  <span className="text-[#FF4E3D]">Sair</span>
                </button>
              </div>
            )}
          </div>
        )}
        {collapsed && (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00E0B8] to-[#3ABFF8] flex items-center justify-center mx-auto hover:ring-2 hover:ring-[#00E0B8] transition-all"
            >
              <span className="text-sm font-bold text-[#0F1115]">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </button>
            
            {/* Dropdown Menu para collapsed */}
            {showUserMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-[#1A1E23] border border-[#2A3038] rounded-lg shadow-xl overflow-hidden z-50 min-w-[150px]">
                <div className="px-4 py-3 border-b border-[#2A3038]">
                  <p className="text-sm font-medium text-[#D0D6DE] truncate">
                    {user?.name || 'Usuário'}
                  </p>
                  <p className="text-xs text-[#7E8691] truncate">
                    {user?.email || 'usuario@oficina.com'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left text-sm text-[#D0D6DE] hover:bg-[#2A3038] transition-colors flex items-center space-x-2"
                >
                  <svg
                    className="w-4 h-4 text-[#FF4E3D]"
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
                  <span className="text-[#FF4E3D]">Sair</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

