'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GearIcon, LockClosedIcon, PersonIcon } from '@radix-ui/react-icons';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Chamar API de login do backend diretamente
      // Para o painel admin, usamos o tenant "system"
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Subdomain': 'system', // Tenant especial para super admin
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Credenciais inválidas');
      }

      // Verificar se é super admin
      // Por enquanto, verificamos pelo email ou pela flag no token
      const isSuperAdmin = 
        email.endsWith('@mecanica365.com') ||
        data.user?.isSuperAdmin === true ||
        data.user?.role === 'superadmin';

      if (!isSuperAdmin) {
        throw new Error('Acesso negado. Esta área é restrita aos administradores do sistema.');
      }

      // Salvar token específico do admin
      localStorage.setItem('adminToken', data.accessToken);
      localStorage.setItem('adminUser', JSON.stringify(data.user));

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0D] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#FF6B6B] to-[#EE5A5A] rounded-2xl mb-4">
            <GearIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Mecânica365</h1>
          <p className="text-[#8B8B9E] mt-1">Painel Administrativo</p>
        </div>

        {/* Login Form */}
        <div className="bg-[#12121A] border border-[#1F1F28] rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Acesso Restrito</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-[#FF6B6B]/20 border border-[#FF6B6B]/50 rounded-lg text-[#FF6B6B] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-[#8B8B9E] mb-2">
                Email
              </label>
              <div className="relative">
                <PersonIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6B7E]" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mecanica365.com"
                  className="w-full pl-10 pr-4 py-3 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-white placeholder-[#6B6B7E] focus:border-[#FF6B6B] focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-[#8B8B9E] mb-2">
                Senha
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6B7E]" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-white placeholder-[#6B6B7E] focus:border-[#FF6B6B] focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-[#FF6B6B] to-[#EE5A5A] rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <p className="text-center text-[#6B6B7E] text-sm mt-6">
            Área restrita aos administradores do sistema
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-[#6B6B7E] text-xs mt-8">
          © 2025 Mecânica365. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}

