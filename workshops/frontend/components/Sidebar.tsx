'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from './icons/MechanicIcons';

interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: GearIcon },
  { label: 'Clientes', href: '/customers', icon: CarIcon },
  { label: 'Ordens de Serviço', href: '/service-orders', icon: WrenchIcon },
  { label: 'Orçamentos', href: '/quotes', icon: BrakePadIcon },
  { label: 'Estoque', href: '/inventory', icon: OilIcon },
  { label: 'Peças', href: '/parts', icon: FilterIcon },
  { label: 'Veículos', href: '/vehicles', icon: EngineIcon },
  { label: 'Elevadores', href: '/elevators', icon: ElevatorIcon },
  { label: 'Diagnóstico', href: '/diagnostics', icon: ScannerIcon },
  { label: 'Notificações', href: '/notifications', icon: BellIcon },
];

interface SidebarProps {
  onToggle?: (collapsed: boolean) => void;
}

export function Sidebar({ onToggle }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    // Carregar estado do sidebar do localStorage
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      const isCollapsed = savedState === 'true';
      setCollapsed(isCollapsed);
      onToggle?.(isCollapsed);
    }
  }, [onToggle]);

  const isActive = (href: string) => {
    if (!mounted || !pathname) return false;
    if (href === '/dashboard') {
      return pathname === '/dashboard';
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

      {/* Footer */}
      <div className="p-4 border-t border-[#2A3038]">
        {!collapsed && (
          <div className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-[#2A3038]/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00E0B8] to-[#3ABFF8] flex items-center justify-center">
              <span className="text-sm font-bold text-[#0F1115]">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#D0D6DE] truncate">Usuário</p>
              <p className="text-xs text-[#7E8691] truncate">admin@oficina.com</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00E0B8] to-[#3ABFF8] flex items-center justify-center mx-auto">
            <span className="text-sm font-bold text-[#0F1115]">U</span>
          </div>
        )}
      </div>
    </aside>
  );
}

