'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  DashboardIcon,
  GearIcon,
  ExitIcon,
  LayersIcon,
  ActivityLogIcon,
  LightningBoltIcon,
  Link2Icon,
  BellIcon,
  RocketIcon,
  MixerHorizontalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  StackIcon,
  QuestionMarkCircledIcon,
  FileTextIcon,
  CardStackIcon,
  EnvelopeClosedIcon,
} from '@radix-ui/react-icons';

interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
  { label: 'Tenants', href: '/tenants', icon: LayersIcon },
  { label: 'Planos', href: '/plans', icon: StackIcon },
  { label: 'Billing', href: '/billing', icon: RocketIcon },
  { label: 'Payment Gateways', href: '/payment-gateways', icon: CardStackIcon },
  { label: 'Email Settings', href: '/email-settings', icon: EnvelopeClosedIcon },
  { label: 'Auditoria', href: '/audit', icon: ActivityLogIcon },
  { label: 'Suporte', href: '/support', icon: QuestionMarkCircledIcon },
  { label: 'Jobs', href: '/jobs', icon: LightningBoltIcon },
  { label: 'Backups', href: '/backups', icon: FileTextIcon },
  { label: 'Webhooks', href: '/webhooks', icon: Link2Icon },
  { label: 'Afiliados', href: '/affiliates', icon: CardStackIcon },
  { label: 'Integrações', href: '/integrations', icon: MixerHorizontalIcon },
  { label: 'Automações', href: '/automations', icon: BellIcon },
  { label: 'Configurações', href: '/settings', icon: GearIcon },
];

interface SidebarProps {
  readonly collapsed?: boolean;
  readonly onToggle?: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed: controlledCollapsed, onToggle }: Readonly<SidebarProps>) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(controlledCollapsed ?? false);

  useEffect(() => {
    setMounted(true);
    if (typeof globalThis.window !== 'undefined') {
      const savedState = globalThis.window.localStorage.getItem('adminSidebarCollapsed');
      if (savedState !== null) {
        const isCollapsed = savedState === 'true';
        setCollapsed(isCollapsed);
        onToggle?.(isCollapsed);
      }
    }
  }, [onToggle]);

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    onToggle?.(newState);
    if (typeof globalThis.window !== 'undefined') {
      globalThis.window.localStorage.setItem('adminSidebarCollapsed', String(newState));
    }
  };

  const handleLogout = () => {
    if (typeof globalThis.window !== 'undefined') {
      globalThis.window.localStorage.removeItem('adminToken');
      globalThis.window.localStorage.removeItem('adminUser');
    }
    router.push('/login');
  };

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
        fixed left-0 top-0 h-screen bg-[#0F0F12] border-r border-[#1F1F28] z-50
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-20' : 'w-64'}
        flex flex-col
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-[#1F1F28] flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#FF6B6B] to-[#EE5A5A] rounded-lg flex items-center justify-center">
              <GearIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Admin Panel</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 mx-auto bg-gradient-to-br from-[#FF6B6B] to-[#EE5A5A] rounded-lg flex items-center justify-center">
            <GearIcon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200
                    ${active
                      ? 'bg-gradient-to-r from-[#FF6B6B]/20 to-[#EE5A5A]/10 text-[#FF6B6B] border-l-2 border-[#FF6B6B]'
                      : 'text-[#8B8B9E] hover:bg-[#1A1A24] hover:text-white'
                    }
                    ${collapsed ? 'justify-center' : ''}
                  `}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-[#FF6B6B]' : ''}`} />
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#1F1F28] space-y-2">
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg
            text-[#8B8B9E] hover:bg-[#1A1A24] hover:text-white transition-colors"
        >
          {collapsed ? (
            <ChevronRightIcon className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeftIcon className="w-5 h-5" />
              <span>Recolher</span>
            </>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
            text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors
            ${collapsed ? 'justify-center' : ''}
          `}
          title={collapsed ? 'Sair' : undefined}
        >
          <ExitIcon className="w-5 h-5" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}

