'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';

interface ClientLayoutProps {
  children: React.ReactNode;
}

// Rotas que não devem ter sidebar
const publicRoutes = ['/login', '/register', '/onboarding', '/'];

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isPublicRoute = publicRoutes.includes(pathname);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#0F1115]">
      <Sidebar />
      <main className="flex-1 ml-64 transition-all duration-300 overflow-x-hidden min-h-screen">
        {children}
      </main>
    </div>
  );
}

