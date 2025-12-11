'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { usersApi, User, UpdateUserDto, UserRole } from '@/lib/api/users';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

const roleOptions = [
  { value: 'admin', label: 'Administrador' },
  { value: 'manager', label: 'Gerente' },
  { value: 'mechanic', label: 'Mecânico' },
  { value: 'receptionist', label: 'Recepcionista' },
  { value: 'accountant', label: 'Contador' },
];

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<UpdateUserDto>({
    name: '',
    email: '',
    role: 'mechanic',
    isActive: true,
  });
  const [password, setPassword] = useState('');
  const [changePassword, setChangePassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      setLoadingUser(true);
      const user = await usersApi.findOne(id);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      });
    } catch (err: unknown) {
      logger.error('[EditUserPage] Erro ao carregar usuário:', err);
      alert('Erro ao carregar usuário');
      router.push('/users');
    } finally {
      setLoadingUser(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (changePassword && (!password || password.length < 8)) {
      newErrors.password = 'Senha deve ter pelo menos 8 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const data: UpdateUserDto = {
        name: formData.name?.trim(),
        email: formData.email?.trim().toLowerCase(),
        role: formData.role,
        isActive: formData.isActive,
        ...(changePassword && password ? { password } : {}),
      };

      await usersApi.update(id, data);
      router.push(`/users/${id}`);
    } catch (err: unknown) {
      logger.error('Erro ao atualizar usuário:', err);
      let errorMessage = 'Erro ao atualizar usuário';
      
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string | string[] } } };
        if (axiosError.response?.data?.message) {
          const message = axiosError.response.data.message;
          errorMessage = Array.isArray(message) ? message.join(', ') : message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link href={`/users/${id}`} className="text-[#00E0B8] hover:text-[#3ABFF8] mb-4 inline-block text-sm sm:text-base">
            ← Voltar para detalhes
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#D0D6DE]">Editar Usuário</h1>
          <p className="text-[#7E8691] mt-2 text-sm sm:text-base">Atualize as informações do usuário</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Input
                label="Nome Completo *"
                placeholder="João Silva"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                required
              />
              <Input
                label="Email *"
                type="email"
                placeholder="usuario@oficina.com"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Select
                label="Role *"
                value={formData.role || 'mechanic'}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                options={roleOptions}
                required
              />
              <div className="flex items-end">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive ?? true}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-[#2A3038] bg-[#1A1E23] text-[#00E0B8] focus:ring-[#00E0B8]"
                  />
                  <span className="text-sm text-[#D0D6DE]">Usuário ativo</span>
                </label>
              </div>
            </div>

            <div className="border-t border-[#2A3038] pt-4">
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="changePassword"
                  checked={changePassword}
                  onChange={(e) => setChangePassword(e.target.checked)}
                  className="w-4 h-4 rounded border-[#2A3038] bg-[#1A1E23] text-[#00E0B8] focus:ring-[#00E0B8]"
                />
                <label htmlFor="changePassword" className="text-sm text-[#D0D6DE]">
                  Alterar senha
                </label>
              </div>
              {changePassword && (
                <Input
                  label="Nova Senha *"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  required={changePassword}
                />
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#2A3038]">
            <Link href={`/users/${id}`} className="w-full sm:w-auto">
              <Button variant="secondary" type="button" className="w-full sm:w-auto">
                Cancelar
              </Button>
            </Link>
            <Button variant="primary" type="submit" isLoading={loading} className="w-full sm:w-auto">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

