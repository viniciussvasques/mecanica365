'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { getAxiosErrorMessage } from '@/lib/utils/error.utils';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GearIcon, WrenchIcon } from '@/components/icons/MechanicIcons';
import { logger } from '@/lib/utils/logger';
import { authStorage } from '@/lib/utils/localStorage';

// Função para extrair subdomain da URL atual
const getSubdomainFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const hostname = window.location.hostname;
  
  // Padrão: subdomain.localhost ou subdomain.domain.com
  // Exemplo: oficinartee.localhost -> oficinartee
  const parts = hostname.split('.');
  
  // Se for localhost simples ou IP, não tem subdomain
  if (hostname === 'localhost' || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    return null;
  }
  
  // Se for subdomain.localhost ou subdomain.localhost:3000
  if (parts.length >= 2 && parts[parts.length - 1].startsWith('localhost')) {
    return parts[0]; // Retorna o subdomain (ex: oficinartee)
  }
  
  // Para domínios reais (subdomain.domain.com)
  if (parts.length >= 3) {
    return parts[0];
  }
  
  return null;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [urlSubdomain, setUrlSubdomain] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [findingTenant, setFindingTenant] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Detectar subdomain da URL atual
    const detectedSubdomain = getSubdomainFromUrl();
    if (detectedSubdomain) {
      setUrlSubdomain(detectedSubdomain);
      setSubdomain(detectedSubdomain);
      logger.log('[Login] Subdomain detectado na URL:', detectedSubdomain);
    }
  }, []);

  // Só buscar tenant por email se NÃO houver subdomain na URL
  useEffect(() => {
    const findTenant = async () => {
      // Se já tem subdomain da URL, não buscar automaticamente
      if (urlSubdomain) {
        return;
      }
      
      if (formData.email.includes('@') && formData.email.length > 5 && !subdomain && !findingTenant) {
        setFindingTenant(true);
        try {
          const result = await authApi.findTenantByEmail(formData.email);
          if (result && result.subdomain) {
            setSubdomain(result.subdomain);
          }
        } catch (err: unknown) {
          logger.log('Tenant não encontrado automaticamente');
        } finally {
          setFindingTenant(false);
        }
      }
    };

    const timeoutId = setTimeout(findTenant, 800);
    return () => clearTimeout(timeoutId);
  }, [formData.email, urlSubdomain, subdomain, findingTenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    // IMPORTANTE: Se tem subdomain na URL, usar ESSE subdomain (não buscar outro)
    // Isso garante que usuário só pode logar no tenant da URL
    let tenantSubdomain = urlSubdomain || subdomain;
    
    // Só buscar tenant por email se não houver subdomain na URL
    if (!tenantSubdomain) {
      setFindingTenant(true);
      try {
        const result = await authApi.findTenantByEmail(formData.email);
        if (result && result.subdomain) {
          tenantSubdomain = result.subdomain;
          setSubdomain(tenantSubdomain);
        }
      } catch (err: unknown) {
        logger.log('Tentando login sem subdomain encontrado');
      } finally {
        setFindingTenant(false);
      }
    }

    if (!tenantSubdomain) {
      setError('Não foi possível identificar sua conta. Verifique o email ou entre em contato com o suporte.');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.login(tenantSubdomain, {
        email: formData.email,
        password: formData.password,
      });
      
      if (response.accessToken) {
        authStorage.setToken(response.accessToken);
        authStorage.setRefreshToken(response.refreshToken || '');
        authStorage.setSubdomain(tenantSubdomain);

        // Salvar nome e email do usuário
        if (response.user?.name) {
          authStorage.setUserName(response.user.name);
        }
        if (response.user?.email) {
          authStorage.setUserEmail(response.user.email);
        }

        if (response.user?.id) {
          authStorage.setUserId(response.user.id);
        }

        if (response.user?.role) {
          authStorage.setUserRole(response.user.role);
          logger.log('[Login] Role salvo no localStorage:', response.user.role);
        } else {
          logger.warn('[Login] Role não encontrado na resposta:', response.user);
        }

        const isFirstLogin = response.isFirstLogin === true;
        const alreadyChanged = response.user?.id ? authStorage.getPasswordChanged(response.user.id) : false;

        if (isFirstLogin && !alreadyChanged) {
          authStorage.setIsFirstLogin(true);
          authStorage.setShowPasswordModal(true);
        }
        
        // Redirecionar baseado no role
        const userRole = response.user?.role;
        const queryParams = `subdomain=${tenantSubdomain}${isFirstLogin && !alreadyChanged ? '&firstLogin=true' : ''}`;
        
        if (userRole === 'mechanic') {
          router.push(`/mechanic/dashboard?${queryParams}`);
        } else {
          router.push(`/dashboard?${queryParams}`);
        }
      }
    } catch (err: unknown) {
      logger.error('[LoginPage] Erro ao fazer login:', err);
      
      let errorMessage = getAxiosErrorMessage(err) || 'Erro ao fazer login. Verifique suas credenciais.';
      
      // Se houver subdomain na URL e o erro for credenciais inválidas,
      // dar uma mensagem mais específica
      if (urlSubdomain && errorMessage.includes('Credenciais inválidas')) {
        errorMessage = 'Email ou senha incorretos para esta oficina. Verifique se você está acessando a URL correta.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] carbon-texture flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className={`
        max-w-md w-full space-y-6 sm:space-y-8
        transform transition-all duration-700 ease-out
        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}>
        <div className="text-center">
          <Link href="/" className="inline-block mb-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <GearIcon className="text-[#00E0B8]" size={32} />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold neon-turquoise">
                Mecânica365
              </h1>
            </div>
          </Link>
          <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-extrabold text-[#D0D6DE] animate-fade-in-delay">
            Entre na sua conta
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#7E8691] animate-fade-in-delay-2">
            Ou{' '}
            <Link href="/register" className="font-semibold text-[#00E0B8] hover:text-[#3ABFF8] transition-colors underline-offset-2 hover:underline">
              crie uma nova conta
            </Link>
          </p>
        </div>

        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-2xl p-6 sm:p-8 shadow-2xl animate-fade-in-delay-3 relative overflow-hidden">
          <div className="hud-line"></div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-[#FF4E3D]/20 border-l-4 border-[#FF4E3D] text-[#FF4E3D] px-4 py-3 rounded-lg shadow-sm animate-shake">
                <p className="text-sm font-medium flex items-center">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            {subdomain && (
              <div className="bg-[#00E0B8]/20 border-l-4 border-[#00E0B8] text-[#00E0B8] px-4 py-3 rounded-lg shadow-sm">
                <p className="text-sm font-medium flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Conta encontrada: <span className="font-semibold ml-1">{subdomain}.mecanica365.app</span>
                </p>
              </div>
            )}

            <div className="space-y-4">
              <Input
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu@email.com"
                helperText={findingTenant ? 'Buscando sua conta...' : subdomain ? `Conta: ${subdomain}.mecanica365.app` : undefined}
                className="w-full"
              />

              <Input
                id="password"
                label="Senha"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading || findingTenant}
              disabled={loading || findingTenant || !formData.email || !formData.password}
              className="w-full"
            >
              {findingTenant ? 'Buscando conta...' : loading ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-sm text-[#7E8691] hover:text-[#00E0B8] transition-colors"
              >
                Esqueceu sua senha?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
