'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usersApi, User, UserRole } from '@/lib/api/users';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
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

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    role?: UserRole;
    includeInactive?: boolean;
  }>({});

  useEffect(() => {
      const token = authStorage.getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
    const token = authStorage.getToken();
    if (!token) {
      setError('Token de autenticação não encontrado. Faça login novamente.');
      router.push('/login');
      return;
    }
      
      const response = await usersApi.findAll({
        role: filters.role,
        includeInactive: filters.includeInactive,
      });
      setUsers(response);
    } catch (err: unknown) {
      logger.error('[UsersPage] Erro ao carregar usuários:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar usuários';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: 'role' | 'includeInactive', value: string | boolean) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === '' || value === false ? undefined : value,
    }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este usuário?')) {
      return;
    }

    try {
      await usersApi.remove(id);
      await loadUsers();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover usuário';
      alert(errorMessage);
      logger.error('Erro ao remover usuário:', err);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await usersApi.update(user.id, { isActive: !user.isActive });
      await loadUsers();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar usuário';
      alert(errorMessage);
      logger.error('Erro ao atualizar usuário:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-[#D0D6DE]">Usuários</h1>
            <Link href="/users/new">
              <Button variant="primary">
                + Novo Usuário
              </Button>
            </Link>
          </div>
          <p className="text-[#7E8691]">Gerencie os usuários do sistema</p>
        </div>

        {/* Filtros */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Role"
              value={filters.role || ''}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              options={[
                { value: '', label: 'Todas as roles' },
                { value: 'admin', label: 'Administrador' },
                { value: 'manager', label: 'Gerente' },
                { value: 'mechanic', label: 'Mecânico' },
                { value: 'receptionist', label: 'Recepcionista' },
                { value: 'accountant', label: 'Contador' },
              ]}
            />
            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.includeInactive || false}
                  onChange={(e) => handleFilterChange('includeInactive', e.target.checked)}
                  className="w-4 h-4 rounded border-[#2A3038] bg-[#1A1E23] text-[#00E0B8] focus:ring-[#00E0B8]"
                />
                <span className="text-sm text-[#D0D6DE]">Incluir inativos</span>
              </label>
            </div>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="bg-[#FF4E3D]/10 border border-[#FF4E3D] rounded-lg p-4 mb-6">
            <p className="text-[#FF4E3D]">{error}</p>
          </div>
        )}

        {/* Tabela */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto"></div>
              <p className="mt-4 text-[#7E8691]">Carregando usuários...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[#7E8691]">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#2A3038]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Nome</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Role</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Criado em</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A3038]">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-[#2A3038]/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-[#D0D6DE] font-medium">{user.name}</td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">{user.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${roleColors[user.role]}`}>
                            {roleLabels[user.role]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            user.isActive 
                              ? 'bg-[#00E0B8]/20 text-[#00E0B8] border border-[#00E0B8]/30' 
                              : 'bg-[#7E8691]/20 text-[#7E8691] border border-[#7E8691]/30'
                          }`}>
                            {user.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">
                          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Link href={`/users/${user.id}`}>
                              <Button variant="outline" size="sm">
                                Ver
                              </Button>
                            </Link>
                            <Link href={`/users/${user.id}/edit`}>
                              <Button variant="secondary" size="sm">
                                Editar
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleActive(user)}
                              className={user.isActive ? 'text-[#FFCB2B] border-[#FFCB2B] hover:bg-[#FFCB2B]/10' : 'text-[#00E0B8] border-[#00E0B8] hover:bg-[#00E0B8]/10'}
                            >
                              {user.isActive ? 'Desativar' : 'Ativar'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(user.id)}
                              className="text-[#FF4E3D] border-[#FF4E3D] hover:bg-[#FF4E3D]/10"
                            >
                              Remover
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

