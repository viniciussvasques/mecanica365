'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authStorage } from '@/lib/utils/localStorage';
import { logger } from '@/lib/utils/logger';

interface AuthGuardProps {
    children: React.ReactNode;
    publicRoutes: string[];
}

export function AuthGuard({ children, publicRoutes }: AuthGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // Função para verificar autenticação
        const checkAuth = () => {
            // Ignorar verificações durante SSR/hidratação inicial se não tiver pathname
            if (!pathname) return;

            // Verificar se é rota pública
            const isPublicRoute = publicRoutes.some(route => {
                if (pathname === route) return true;
                // Tratamento especial para rotas com parâmetros ou subrotas públicas específicas
                if (route === '/quotes/view' && pathname.startsWith('/quotes/view')) return true;
                if (route === '/onboarding' && pathname.startsWith('/onboarding')) return true;
                return false;
            });

            if (isPublicRoute) {
                setAuthorized(true);
                return;
            }

            const token = authStorage.getToken();
            if (!token) {
                logger.warn('[AuthGuard] Token não encontrado, redirecionando para login');
                // Salvar a URL tentada para redirecionar de volta após login (futuro)
                router.replace('/login');
                setAuthorized(false);
            } else {
                setAuthorized(true);
            }
        };

        checkAuth();
    }, [pathname, router, publicRoutes]);

    // Se não estiver autorizado (e não for rota pública), exibe loading ou nada
    // O useEffect vai redirecionar se necessário
    if (!authorized) {
        // Pode retornar um componente de Loading bonito aqui se desejar
        return (
            <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8]"></div>
            </div>
        );
    }

    return <>{children}</>;
}
