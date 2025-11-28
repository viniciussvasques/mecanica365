'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GearIcon, WrenchIcon } from '@/components/icons/MechanicIcons';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [subdomain, setSubdomain] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [findingTenant, setFindingTenant] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const findTenant = async () => {
      if (formData.email.includes('@') && formData.email.length > 5 && !subdomain && !findingTenant) {
        setFindingTenant(true);
        try {
          const result = await authApi.findTenantByEmail(formData.email);
          if (result && result.subdomain) {
            setSubdomain(result.subdomain);
          }
        } catch (err) {
          console.log('Tenant não encontrado automaticamente');
        } finally {
          setFindingTenant(false);
        }
      }
    };

    const timeoutId = setTimeout(findTenant, 800);
    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    let tenantSubdomain = subdomain;
    if (!tenantSubdomain) {
      setFindingTenant(true);
      try {
        const result = await authApi.findTenantByEmail(formData.email);
        if (result && result.subdomain) {
          tenantSubdomain = result.subdomain;
          setSubdomain(tenantSubdomain);
        }
      } catch (err) {
        console.log('Tentando login sem subdomain encontrado');
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
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken || '');
        localStorage.setItem('subdomain', tenantSubdomain);
        
        if (response.user?.id) {
          localStorage.setItem('userId', response.user.id);
        }
        
        const isFirstLogin = response.isFirstLogin === true;
        const passwordChangedKey = response.user?.id ? `passwordChanged_${response.user.id}` : null;
        const alreadyChanged = passwordChangedKey ? localStorage.getItem(passwordChangedKey) : null;
        
        if (isFirstLogin && !alreadyChanged) {
          localStorage.setItem('isFirstLogin', 'true');
          localStorage.setItem('showPasswordModal', 'true');
        }
        
        router.push(`/dashboard?subdomain=${tenantSubdomain}${isFirstLogin && !alreadyChanged ? '&firstLogin=true' : ''}`);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao fazer login. Verifique suas credenciais.';
      setError(errorMessage);
      console.error('Login error:', err);
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
          </form>
        </div>
      </div>
    </div>
  );
}
