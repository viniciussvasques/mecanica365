'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GearIcon } from '@/components/icons/MechanicIcons';

export const dynamic = 'force-dynamic';

// Função para extrair subdomain da URL atual
const getSubdomainFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  if (hostname === 'localhost' || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    return null;
  }
  
  if (parts.length >= 2 && parts[parts.length - 1].startsWith('localhost')) {
    return parts[0];
  }
  
  if (parts.length >= 3) {
    return parts[0];
  }
  
  return null;
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const detectedSubdomain = getSubdomainFromUrl();
    setSubdomain(detectedSubdomain);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Por favor, informe seu email.');
      return;
    }

    if (!subdomain) {
      setError('Não foi possível identificar a oficina. Acesse pelo link correto.');
      return;
    }

    setLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const apiUrl = `http://${subdomain}.localhost:3001/api`;

      await axios.post(`${apiUrl}/auth/forgot-password`, { email }, {
        headers: {
          'X-Tenant-Subdomain': subdomain,
        },
      });

      setSent(true);
    } catch (err: unknown) {
      // Sempre mostrar mensagem de sucesso para não revelar se email existe
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#0F1115] carbon-texture flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <GearIcon className="text-[#00E0B8]" size={32} />
              <h1 className="text-4xl font-bold neon-turquoise">Mecânica365</h1>
            </div>
            
            <div className="bg-[#00E0B8]/10 border border-[#00E0B8] rounded-lg p-8 mt-8">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-2xl font-bold text-[#D0D6DE] mb-4">
                Verifique seu Email
              </h2>
              <p className="text-[#7E8691] mb-6">
                Se o email <span className="text-[#D0D6DE] font-medium">{email}</span> estiver cadastrado, 
                você receberá um link para redefinir sua senha.
              </p>
              <p className="text-sm text-[#7E8691] mb-6">
                O link é válido por <span className="text-[#00E0B8] font-bold">30 minutos</span>.
              </p>
              <Link href="/login">
                <Button variant="primary" className="w-full">
                  Voltar para Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] carbon-texture flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block mb-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <GearIcon className="text-[#00E0B8]" size={32} />
              <h1 className="text-4xl font-bold neon-turquoise">Mecânica365</h1>
            </div>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-[#D0D6DE]">
            Recuperar Senha
          </h2>
          <p className="mt-2 text-sm text-[#7E8691]">
            Informe seu email e enviaremos um link para redefinir sua senha.
          </p>
        </div>

        <div className="hud-panel p-8 rounded-lg">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-[#FF4E3D]/10 border border-[#FF4E3D] text-[#FF4E3D] rounded-lg p-4 text-sm">
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-[#00E0B8] hover:text-[#3ABFF8] transition-colors"
              >
                ← Voltar para Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

