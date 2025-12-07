'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, CheckCircledIcon, CrossCircledIcon, ReloadIcon, PersonIcon, LockClosedIcon } from '@radix-ui/react-icons';
import { tenantsApi, Tenant } from '@/lib/api';

interface TenantUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function TenantDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', plan: '' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => { loadTenant(); loadUsers(); }, [id]);

  const loadTenant = async () => {
    try {
      setIsLoading(true);
      const data = await tenantsApi.findOne(id);
      setTenant(data);
      setFormData({ name: data.name, plan: data.plan });
    } catch (error) {
      console.error('Erro:', error);
      router.push('/tenants');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const data = await tenantsApi.getUsers(id);
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleResetPassword = async (userId: string, userEmail: string) => {
    if (!confirm(`Tem certeza que deseja resetar a senha do usuário ${userEmail}?`)) return;
    
    try {
      setResettingPassword(userId);
      const result = await tenantsApi.resetUserPassword(id, userId);
      setGeneratedPassword({ email: userEmail, password: result.tempPassword });
      setShowPasswordModal(true);
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      alert('Erro ao resetar senha. Tente novamente.');
    } finally {
      setResettingPassword(null);
    }
  };

  const handleSave = async () => {
    if (!tenant) return;
    try {
      setIsSaving(true);
      await tenantsApi.update(tenant.id, formData);
      loadTenant();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao atualizar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAction = async (action: 'activate' | 'suspend' | 'cancel') => {
    if (!tenant) return;
    if (action === 'cancel' && !confirm('Tem certeza?')) return;
    try {
      await tenantsApi[action](tenant.id);
      loadTenant();
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-10 h-10 border-4 border-[#FF6B6B]/20 border-t-[#FF6B6B] rounded-full animate-spin" /></div>;
  if (!tenant) return <div className="text-center py-12"><p className="text-[#FF6B6B]">Tenant não encontrado</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/tenants" className="p-2 hover:bg-[#1A1A24] rounded-lg"><ArrowLeftIcon className="w-5 h-5 text-[#8B8B9E]" /></Link>
          <div><h1 className="text-3xl font-bold text-white">{tenant.name}</h1><p className="text-[#8B8B9E]">{tenant.subdomain}.mecanica365.com</p></div>
        </div>
        <button onClick={loadTenant} className="p-2 hover:bg-[#1A1A24] rounded-lg"><ReloadIcon className="w-5 h-5 text-[#8B8B9E]" /></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Informações</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="tenant-edit-name" className="block text-sm font-medium text-[#8B8B9E] mb-1">Nome</label>
                <input id="tenant-edit-name" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-white focus:border-[#FF6B6B] focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label htmlFor="tenant-edit-subdomain" className="block text-sm font-medium text-[#8B8B9E] mb-1">Subdomain</label><input id="tenant-edit-subdomain" type="text" value={tenant.subdomain} disabled className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-[#6B6B7E] cursor-not-allowed" /></div>
                <div><label htmlFor="tenant-edit-document" className="block text-sm font-medium text-[#8B8B9E] mb-1">Documento</label><input id="tenant-edit-document" type="text" value={`${tenant.documentType.toUpperCase()}: ${tenant.document}`} disabled className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-[#6B6B7E] cursor-not-allowed" /></div>
              </div>
              <div>
                <label htmlFor="tenant-edit-plan" className="block text-sm font-medium text-[#8B8B9E] mb-1">Plano</label>
                <select id="tenant-edit-plan" value={formData.plan} onChange={(e) => setFormData({ ...formData, plan: e.target.value })} className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-white focus:border-[#FF6B6B] focus:outline-none">
                  <option value="workshops_starter">Starter</option>
                  <option value="workshops_professional">Professional</option>
                  <option value="workshops_enterprise">Enterprise</option>
                </select>
              </div>
              <button onClick={handleSave} disabled={isSaving} className="w-full px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#EE5A5A] rounded-lg text-white font-medium disabled:opacity-50">{isSaving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>

          {tenant.subscription && (
            <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Assinatura</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[#6B6B7E] text-sm">Status</p><p className="text-white">{tenant.subscription.status}</p></div>
                <div><p className="text-[#6B6B7E] text-sm">Plano</p><p className="text-white">{tenant.subscription.plan}</p></div>
                <div><p className="text-[#6B6B7E] text-sm">Período</p><p className="text-white">{new Date(tenant.subscription.currentPeriodStart).toLocaleDateString('pt-BR')} - {new Date(tenant.subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}</p></div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#8B8B9E]">Status atual</span>
                {(() => {
                  const statusConfig: Record<string, { color: string; label: string }> = {
                    active: { color: 'bg-[#4ADE80]/20 text-[#4ADE80]', label: 'Ativo' },
                    pending: { color: 'bg-[#FBBF24]/20 text-[#FBBF24]', label: 'Pendente' },
                    suspended: { color: 'bg-[#FF6B6B]/20 text-[#FF6B6B]', label: 'Suspenso' },
                    cancelled: { color: 'bg-[#6B6B7E]/20 text-[#6B6B7E]', label: 'Cancelado' },
                  };
                  const config = statusConfig[tenant.status] || statusConfig.cancelled;
                  return <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>{config.label}</span>;
                })()}
              </div>
              <div className="space-y-2">
                {tenant.status !== 'active' && <button onClick={() => handleAction('activate')} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#4ADE80]/20 text-[#4ADE80] rounded-lg hover:bg-[#4ADE80]/30"><CheckCircledIcon className="w-4 h-4" />Ativar</button>}
                {tenant.status === 'active' && <button onClick={() => handleAction('suspend')} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#FBBF24]/20 text-[#FBBF24] rounded-lg hover:bg-[#FBBF24]/30"><CrossCircledIcon className="w-4 h-4" />Suspender</button>}
                {tenant.status !== 'cancelled' && <button onClick={() => handleAction('cancel')} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#FF6B6B]/20 text-[#FF6B6B] rounded-lg hover:bg-[#FF6B6B]/30"><CrossCircledIcon className="w-4 h-4" />Cancelar</button>}
              </div>
            </div>
          </div>

          <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Datas</h2>
            <div className="space-y-3">
              <div><p className="text-[#6B6B7E] text-sm">Criado em</p><p className="text-white">{new Date(tenant.createdAt).toLocaleString('pt-BR')}</p></div>
              <div><p className="text-[#6B6B7E] text-sm">Atualizado em</p><p className="text-white">{new Date(tenant.updatedAt).toLocaleString('pt-BR')}</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Usuários */}
      <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <PersonIcon className="w-5 h-5" />
            Usuários do Tenant ({users.length})
          </h2>
          <button onClick={loadUsers} className="p-2 hover:bg-[#1A1A24] rounded-lg">
            <ReloadIcon className={`w-4 h-4 text-[#8B8B9E] ${isLoadingUsers ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {isLoadingUsers ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-[#FF6B6B]/20 border-t-[#FF6B6B] rounded-full animate-spin mx-auto" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-[#6B6B7E] text-center py-8">Nenhum usuário encontrado</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1F1F28]">
                  <th className="text-left py-3 px-4 text-[#8B8B9E] text-sm font-medium">Nome</th>
                  <th className="text-left py-3 px-4 text-[#8B8B9E] text-sm font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-[#8B8B9E] text-sm font-medium">Role</th>
                  <th className="text-left py-3 px-4 text-[#8B8B9E] text-sm font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-[#8B8B9E] text-sm font-medium">Criado em</th>
                  <th className="text-right py-3 px-4 text-[#8B8B9E] text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-[#1F1F28] hover:bg-[#1A1A24]">
                    <td className="py-3 px-4 text-white">{user.name}</td>
                    <td className="py-3 px-4 text-[#8B8B9E]">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'admin' ? 'bg-[#FF6B6B]/20 text-[#FF6B6B]' :
                        user.role === 'manager' ? 'bg-[#FBBF24]/20 text-[#FBBF24]' :
                        user.role === 'mechanic' ? 'bg-[#3B82F6]/20 text-[#3B82F6]' :
                        'bg-[#6B6B7E]/20 text-[#6B6B7E]'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.isActive ? 'bg-[#4ADE80]/20 text-[#4ADE80]' : 'bg-[#FF6B6B]/20 text-[#FF6B6B]'
                      }`}>
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#8B8B9E] text-sm">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleResetPassword(user.id, user.email)}
                        disabled={resettingPassword === user.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FF6B6B]/20 text-[#FF6B6B] rounded-lg hover:bg-[#FF6B6B]/30 disabled:opacity-50 text-sm"
                      >
                        <LockClosedIcon className="w-3 h-3" />
                        {resettingPassword === user.id ? 'Resetando...' : 'Resetar Senha'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Senha Gerada */}
      {showPasswordModal && generatedPassword && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <LockClosedIcon className="w-5 h-5 text-[#4ADE80]" />
              Senha Resetada com Sucesso
            </h3>
            <div className="bg-[#1A1A24] border border-[#2A2A38] rounded-lg p-4 mb-4">
              <p className="text-[#8B8B9E] text-sm mb-1">Usuário:</p>
              <p className="text-white font-medium mb-3">{generatedPassword.email}</p>
              <p className="text-[#8B8B9E] text-sm mb-1">Nova Senha Temporária:</p>
              <div className="flex items-center gap-2">
                <code className="text-[#4ADE80] text-lg font-mono bg-[#0A0A0F] px-3 py-2 rounded flex-1">
                  {generatedPassword.password}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPassword.password);
                    alert('Senha copiada!');
                  }}
                  className="px-3 py-2 bg-[#FF6B6B]/20 text-[#FF6B6B] rounded hover:bg-[#FF6B6B]/30"
                >
                  Copiar
                </button>
              </div>
            </div>
            <div className="bg-[#FBBF24]/10 border border-[#FBBF24]/30 rounded-lg p-3 mb-4">
              <p className="text-[#FBBF24] text-sm">
                ⚠️ O usuário será solicitado a alterar a senha no primeiro login.
              </p>
            </div>
            <button
              onClick={() => {
                setShowPasswordModal(false);
                setGeneratedPassword(null);
              }}
              className="w-full px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#EE5A5A] rounded-lg text-white font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

