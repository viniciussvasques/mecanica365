'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';

interface ClientLayoutProps {
  children: React.ReactNode;
}

// Rotas que não devem ter sidebar
const publicRoutes = ['/login', '/register', '/onboarding', '/', '/quotes/view'];

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  // Verificar se é rota pública (exata ou começa com a rota pública)
  const isPublicRoute = publicRoutes.some(route => {
    if (!pathname) return false;
    if (pathname === route) return true;
    // Para /quotes/view, verificar se começa com essa rota
    if (route === '/quotes/view' && pathname.startsWith('/quotes/view')) return true;
    return false;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Verificar estado do sidebar no localStorage
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setSidebarCollapsed(savedState === 'true');
    }
  }, []);

  const handleSidebarToggle = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem('sidebarCollapsed', String(collapsed));
  };

  // Durante SSR, não renderizar sidebar
  if (!mounted) {
    return <>{children}</>;
  }

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#0F1115]">
      <Sidebar onToggle={handleSidebarToggle} />
      <main
        className={`flex-1 transition-all duration-300 overflow-x-hidden min-h-screen ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {children}
      </main>
    </div>
  );
}

