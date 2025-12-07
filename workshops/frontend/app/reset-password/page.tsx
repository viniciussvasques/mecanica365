'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GearIcon } from '@/components/icons/MechanicIcons';

export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!token) {
      setValidating(false);
      setValid(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await axios.get(`${baseUrl}/api/auth/validate-reset-token?token=${token}`);
      
      setValid(response.data.valid);
      setMaskedEmail(response.data.email || '');
    } catch (err) {
      setValid(false);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (newPassword.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    // Validar requisitos da senha
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[@$!%*?&]/.test(newPassword);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      setError('A senha deve conter letra maiúscula, minúscula, número e caractere especial (@$!%*?&).');
      return;
    }

    setLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      await axios.post(`${baseUrl}/api/auth/reset-password`, {
        token,
        newPassword,
      });

      setSuccess(true);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Erro ao redefinir senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  if (validating) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto mb-4"></div>
          <p className="text-[#7E8691]">Verificando link...</p>
        </div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-[#0F1115] carbon-texture flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <GearIcon className="text-[#00E0B8]" size={32} />
            <h1 className="text-4xl font-bold neon-turquoise">Mecânica365</h1>
          </div>
          
          <div className="bg-[#FF4E3D]/10 border border-[#FF4E3D] rounded-lg p-8">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-[#D0D6DE] mb-4">
              Link Inválido ou Expirado
            </h2>
            <p className="text-[#7E8691] mb-6">
              Este link de recuperação de senha é inválido ou já expirou.
              Por favor, solicite um novo link.
            </p>
            <div className="space-y-3">
              <Link href="/forgot-password">
                <Button variant="primary" className="w-full">
                  Solicitar Novo Link
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Voltar para Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0F1115] carbon-texture flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <GearIcon className="text-[#00E0B8]" size={32} />
            <h1 className="text-4xl font-bold neon-turquoise">Mecânica365</h1>
          </div>
          
          <div className="bg-[#00E0B8]/10 border border-[#00E0B8] rounded-lg p-8">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-[#D0D6DE] mb-4">
              Senha Alterada com Sucesso!
            </h2>
            <p className="text-[#7E8691] mb-6">
              Sua nova senha foi definida. Agora você pode fazer login.
            </p>
            <Link href="/login">
              <Button variant="primary" className="w-full">
                Fazer Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] carbon-texture flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <GearIcon className="text-[#00E0B8]" size={32} />
            <h1 className="text-4xl font-bold neon-turquoise">Mecânica365</h1>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-[#D0D6DE]">
            Redefinir Senha
          </h2>
          {maskedEmail && (
            <p className="mt-2 text-sm text-[#7E8691]">
              Para o email: <span className="text-[#00E0B8]">{maskedEmail}</span>
            </p>
          )}
        </div>

        <div className="hud-panel p-8 rounded-lg">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-[#FF4E3D]/10 border border-[#FF4E3D] text-[#FF4E3D] rounded-lg p-4 text-sm">
                {error}
              </div>
            )}

            <Input
              label="Nova Senha"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />

            <Input
              label="Confirmar Nova Senha"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />

            <div className="bg-[#2A3038] p-4 rounded-lg text-sm text-[#7E8691]">
              <p className="font-medium text-[#D0D6DE] mb-2">A senha deve conter:</p>
              <ul className="space-y-1">
                <li className={newPassword.length >= 8 ? 'text-[#00E0B8]' : ''}>
                  ✓ Pelo menos 8 caracteres
                </li>
                <li className={/[A-Z]/.test(newPassword) ? 'text-[#00E0B8]' : ''}>
                  ✓ Uma letra maiúscula
                </li>
                <li className={/[a-z]/.test(newPassword) ? 'text-[#00E0B8]' : ''}>
                  ✓ Uma letra minúscula
                </li>
                <li className={/\d/.test(newPassword) ? 'text-[#00E0B8]' : ''}>
                  ✓ Um número
                </li>
                <li className={/[@$!%*?&]/.test(newPassword) ? 'text-[#00E0B8]' : ''}>
                  ✓ Um caractere especial (@$!%*?&)
                </li>
              </ul>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Redefinir Senha'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

