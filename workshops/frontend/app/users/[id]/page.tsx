'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { usersApi, User, UserRole } from '@/lib/api/users';
import { Button } from '@/components/ui/Button';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

const roleColors: Record<UserRole, string> = {
  admin: 'bg-[#FF4E3D] text-white',
  manager: 'bg-[#3ABFF8] text-white',
  mechanic: 'bg-[#00E0B8] text-[#0F1115]',
  receptionist: 'bg-[#FFCB2B] text-[#0F1115]',
  accountant: 'bg-[#9B59B6] text-white',
};

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  mechanic: 'Mecânico',
  receptionist: 'Recepcionista',
  accountant: 'Contador',
};

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setLoading(true);
      setError(null);
      const data = await usersApi.findOne(id);
      setUser(data);
    } catch (err: unknown) {
      logger.error('[UserDetailsPage] Erro ao carregar usuário:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar usuário';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!user) return;
    
    if (!confirm(`Tem certeza que deseja ${user.isActive ? 'desativar' : 'ativar'} este usuário?`)) {
      return;
    }

    try {
      await usersApi.update(user.id, { isActive: !user.isActive });
      await loadUser();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar usuário';
      alert(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    
    if (!confirm('Tem certeza que deseja remover este usuário?')) {
      return;
    }

    try {
      await usersApi.remove(user.id);
      router.push('/users');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover usuário';
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8]"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/users" className="text-[#00E0B8] hover:text-[#3ABFF8] mb-4 inline-block">
            ← Voltar para usuários
          </Link>
          <div className="bg-[#FF4E3D]/10 border border-[#FF4E3D] rounded-lg p-6">
            <p className="text-[#FF4E3D]">{error || 'Usuário não encontrado'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/users" className="text-[#00E0B8] hover:text-[#3ABFF8] mb-4 inline-block">
            ← Voltar para usuários
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#D0D6DE]">{user.name}</h1>
              <p className="text-[#7E8691] mt-2">{user.email}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Link href={`/users/${user.id}/edit`}>
                <Button variant="secondary">Editar</Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleToggleActive}
                className={user.isActive ? 'text-[#FFCB2B] border-[#FFCB2B]' : 'text-[#00E0B8] border-[#00E0B8]'}
              >
                {user.isActive ? 'Desativar' : 'Ativar'}
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-[#FF4E3D] border-[#FF4E3D] hover:bg-[#FF4E3D]/10"
              >
                Remover
              </Button>
            </div>
          </div>
        </div>

        {/* Informações */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Informações do Usuário</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-[#7E8691] mb-1">Nome</p>
                <p className="text-[#D0D6DE] font-medium">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-[#7E8691] mb-1">Email</p>
                <p className="text-[#D0D6DE] font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-[#7E8691] mb-1">Role</p>
                <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${roleColors[user.role]}`}>
                  {roleLabels[user.role]}
                </span>
              </div>
              <div>
                <p className="text-sm text-[#7E8691] mb-1">Status</p>
                <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                  user.isActive 
                    ? 'bg-[#00E0B8]/20 text-[#00E0B8] border border-[#00E0B8]/30' 
                    : 'bg-[#7E8691]/20 text-[#7E8691] border border-[#7E8691]/30'
                }`}>
                  {user.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div>
                <p className="text-sm text-[#7E8691] mb-1">Criado em</p>
                <p className="text-[#D0D6DE] font-medium">
                  {new Date(user.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#7E8691] mb-1">Última atualização</p>
                <p className="text-[#D0D6DE] font-medium">
                  {new Date(user.updatedAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

