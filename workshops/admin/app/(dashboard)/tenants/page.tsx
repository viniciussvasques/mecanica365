'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, PlusIcon, ReloadIcon, DotsHorizontalIcon, Pencil1Icon, CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import { tenantsApi, Tenant, CreateTenantDto } from '@/lib/api';

function StatusBadge({ status }: Readonly<{ status: string }>) {
  const config: Record<string, { color: string; label: string }> = {
    active: { color: 'bg-[#4ADE80]/20 text-[#4ADE80]', label: 'Ativo' },
    pending: { color: 'bg-[#FBBF24]/20 text-[#FBBF24]', label: 'Pendente' },
    suspended: { color: 'bg-[#FF6B6B]/20 text-[#FF6B6B]', label: 'Suspenso' },
    cancelled: { color: 'bg-[#6B6B7E]/20 text-[#6B6B7E]', label: 'Cancelado' },
  };
  const c = config[status] || { color: 'bg-[#6B6B7E]/20 text-[#6B6B7E]', label: status };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.color}`}>{c.label}</span>;
}

function PlanBadge({ plan }: Readonly<{ plan: string }>) {
  const config: Record<string, { color: string; label: string }> = {
    starter: { color: 'bg-[#3B82F6]/20 text-[#3B82F6]', label: 'Starter' },
    professional: { color: 'bg-[#A855F7]/20 text-[#A855F7]', label: 'Professional' },
    enterprise: { color: 'bg-[#FF6B6B]/20 text-[#FF6B6B]', label: 'Enterprise' },
  };
  const key = Object.keys(config).find(k => plan?.includes(k)) || 'starter';
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config[key].color}`}>{config[key].label}</span>;
}

function CreateModal({ isOpen, onClose, onSubmit }: Readonly<{ isOpen: boolean; onClose: () => void; onSubmit: (data: CreateTenantDto) => Promise<void> }>) {
  const [formData, setFormData] = useState<CreateTenantDto>({
    name: '', documentType: 'cnpj', document: '', subdomain: '', plan: 'workshops_starter', adminEmail: '', adminName: '', adminPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({ name: '', documentType: 'cnpj', document: '', subdomain: '', plan: 'workshops_starter', adminEmail: '', adminName: '', adminPassword: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#1F1F28]">
          <h2 className="text-xl font-bold text-white">Novo Tenant</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="tenant-name" className="block text-sm font-medium text-[#8B8B9E] mb-1">Nome da Oficina *</label>
            <input id="tenant-name" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-white focus:border-[#FF6B6B] focus:outline-none" required />
          </div>
          <div>
            <label htmlFor="tenant-subdomain" className="block text-sm font-medium text-[#8B8B9E] mb-1">Subdomain *</label>
            <div className="flex items-center">
              <input id="tenant-subdomain" type="text" value={formData.subdomain} onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replaceAll(/[^a-z0-9-]/g, '') })} className="flex-1 px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-l-lg text-white focus:border-[#FF6B6B] focus:outline-none" required />
              <span className="px-4 py-2 bg-[#2A2A38] border border-[#2A2A38] rounded-r-lg text-[#6B6B7E]">.mecanica365.com</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="tenant-doc-type" className="block text-sm font-medium text-[#8B8B9E] mb-1">Tipo</label>
              <select id="tenant-doc-type" value={formData.documentType} onChange={(e) => setFormData({ ...formData, documentType: e.target.value as 'cpf' | 'cnpj' })} className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-white focus:border-[#FF6B6B] focus:outline-none">
                <option value="cnpj">CNPJ</option>
                <option value="cpf">CPF</option>
              </select>
            </div>
            <div>
              <label htmlFor="tenant-document" className="block text-sm font-medium text-[#8B8B9E] mb-1">Documento *</label>
              <input id="tenant-document" type="text" value={formData.document} onChange={(e) => setFormData({ ...formData, document: e.target.value })} className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-white focus:border-[#FF6B6B] focus:outline-none" required />
            </div>
          </div>
          <div>
            <label htmlFor="tenant-plan" className="block text-sm font-medium text-[#8B8B9E] mb-1">Plano</label>
            <select id="tenant-plan" value={formData.plan} onChange={(e) => setFormData({ ...formData, plan: e.target.value })} className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-white focus:border-[#FF6B6B] focus:outline-none">
              <option value="workshops_starter">Starter</option>
              <option value="workshops_professional">Professional</option>
              <option value="workshops_enterprise">Enterprise</option>
            </select>
          </div>
          <div className="border-t border-[#1F1F28] pt-4">
            <h3 className="text-white font-medium mb-3">Usuário Admin</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Nome do Admin" value={formData.adminName} onChange={(e) => setFormData({ ...formData, adminName: e.target.value })} className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-white placeholder-[#6B6B7E] focus:border-[#FF6B6B] focus:outline-none" />
              <input type="email" placeholder="Email do Admin" value={formData.adminEmail} onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })} className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-white placeholder-[#6B6B7E] focus:border-[#FF6B6B] focus:outline-none" />
              <input type="password" placeholder="Senha do Admin" value={formData.adminPassword} onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })} className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-white placeholder-[#6B6B7E] focus:border-[#FF6B6B] focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-[#2A2A38] rounded-lg text-[#8B8B9E] hover:bg-[#1A1A24]">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#EE5A5A] rounded-lg text-white font-medium disabled:opacity-50">{isSubmitting ? 'Criando...' : 'Criar Tenant'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filtered, setFiltered] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  useEffect(() => { loadTenants(); }, []);
  useEffect(() => { filterTenants(); }, [tenants, search, statusFilter]);

  const loadTenants = async () => {
    try {
      setIsLoading(true);
      const data = await tenantsApi.findAll();
      setTenants(data);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTenants = () => {
    let result = [...tenants];
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(term) || t.subdomain.toLowerCase().includes(term) || t.document.includes(term));
    }
    if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter);
    setFiltered(result);
  };

  const handleCreate = async (data: CreateTenantDto) => {
    try {
      await tenantsApi.create(data);
      setIsModalOpen(false);
      loadTenants();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao criar tenant');
    }
  };

  const handleAction = async (id: string, action: 'activate' | 'suspend' | 'cancel') => {
    try {
      if (action === 'cancel' && !confirm('Tem certeza?')) return;
      await tenantsApi[action](id);
      loadTenants();
    } catch (error) {
      console.error('Erro:', error);
    }
    setActionMenu(null);
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-10 h-10 border-4 border-[#FF6B6B]/20 border-t-[#FF6B6B] rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-white">Tenants</h1><p className="text-[#8B8B9E] mt-1">Gerencie as oficinas cadastradas</p></div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#EE5A5A] rounded-lg text-white font-medium"><PlusIcon className="w-5 h-5" />Novo Tenant</button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[300px] relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6B7E]" />
          <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-[#12121A] border border-[#1F1F28] rounded-lg text-white placeholder-[#6B6B7E] focus:border-[#FF6B6B] focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 bg-[#12121A] border border-[#1F1F28] rounded-lg text-white focus:border-[#FF6B6B] focus:outline-none">
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="pending">Pendentes</option>
          <option value="suspended">Suspensos</option>
          <option value="cancelled">Cancelados</option>
        </select>
        <button onClick={loadTenants} className="px-4 py-2 bg-[#12121A] border border-[#1F1F28] rounded-lg text-[#8B8B9E] hover:text-white"><ReloadIcon className="w-5 h-5" /></button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#12121A] border border-[#1F1F28] rounded-lg p-4"><p className="text-[#6B6B7E] text-sm">Total</p><p className="text-2xl font-bold text-white">{tenants.length}</p></div>
        <div className="bg-[#12121A] border border-[#1F1F28] rounded-lg p-4"><p className="text-[#6B6B7E] text-sm">Ativos</p><p className="text-2xl font-bold text-[#4ADE80]">{tenants.filter(t => t.status === 'active').length}</p></div>
        <div className="bg-[#12121A] border border-[#1F1F28] rounded-lg p-4"><p className="text-[#6B6B7E] text-sm">Pendentes</p><p className="text-2xl font-bold text-[#FBBF24]">{tenants.filter(t => t.status === 'pending').length}</p></div>
        <div className="bg-[#12121A] border border-[#1F1F28] rounded-lg p-4"><p className="text-[#6B6B7E] text-sm">Suspensos</p><p className="text-2xl font-bold text-[#FF6B6B]">{tenants.filter(t => t.status === 'suspended').length}</p></div>
      </div>

      <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1F1F28]">
                <th className="px-6 py-4 text-left text-sm font-medium text-[#8B8B9E]">Oficina</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#8B8B9E]">Subdomain</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#8B8B9E]">Documento</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#8B8B9E]">Plano</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#8B8B9E]">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#8B8B9E]">Criado</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-[#8B8B9E]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tenant) => (
                <tr key={tenant.id} className="border-b border-[#1F1F28] hover:bg-[#1A1A24]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-lg flex items-center justify-center"><span className="text-white font-bold">{tenant.name.charAt(0)}</span></div>
                      <div><p className="text-white font-medium">{tenant.name}</p><p className="text-[#6B6B7E] text-sm">{tenant.adminEmail || 'Sem admin'}</p></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#8B8B9E]">{tenant.subdomain}</td>
                  <td className="px-6 py-4 text-[#8B8B9E] text-sm">{tenant.documentType.toUpperCase()}: {tenant.document}</td>
                  <td className="px-6 py-4"><PlanBadge plan={tenant.plan} /></td>
                  <td className="px-6 py-4"><StatusBadge status={tenant.status} /></td>
                  <td className="px-6 py-4 text-[#8B8B9E] text-sm">{new Date(tenant.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 text-right relative">
                    <button onClick={() => setActionMenu(actionMenu === tenant.id ? null : tenant.id)} className="p-2 hover:bg-[#2A2A38] rounded-lg"><DotsHorizontalIcon className="w-5 h-5 text-[#8B8B9E]" /></button>
                    {actionMenu === tenant.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-[#1A1A24] border border-[#2A2A38] rounded-lg shadow-lg z-10">
                        <Link href={`/tenants/${tenant.id}`} className="flex items-center gap-2 px-4 py-2 text-[#8B8B9E] hover:bg-[#2A2A38] hover:text-white"><Pencil1Icon className="w-4 h-4" />Editar</Link>
                        {tenant.status !== 'active' && <button onClick={() => handleAction(tenant.id, 'activate')} className="flex items-center gap-2 w-full px-4 py-2 text-[#4ADE80] hover:bg-[#2A2A38]"><CheckCircledIcon className="w-4 h-4" />Ativar</button>}
                        {tenant.status === 'active' && <button onClick={() => handleAction(tenant.id, 'suspend')} className="flex items-center gap-2 w-full px-4 py-2 text-[#FBBF24] hover:bg-[#2A2A38]"><CrossCircledIcon className="w-4 h-4" />Suspender</button>}
                        {tenant.status !== 'cancelled' && <button onClick={() => handleAction(tenant.id, 'cancel')} className="flex items-center gap-2 w-full px-4 py-2 text-[#FF6B6B] hover:bg-[#2A2A38]"><CrossCircledIcon className="w-4 h-4" />Cancelar</button>}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-[#6B6B7E]">Nenhum tenant encontrado</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <CreateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreate} />
    </div>
  );
}

