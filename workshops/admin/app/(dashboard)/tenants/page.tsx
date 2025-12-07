'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  ReloadIcon, 
  DotsHorizontalIcon, 
  Pencil1Icon, 
  CheckCircledIcon, 
  CrossCircledIcon,
  PersonIcon,
  GlobeIcon,
  IdCardIcon,
  CalendarIcon,
  ExternalLinkIcon
} from '@radix-ui/react-icons';
import { tenantsApi, Tenant, CreateTenantDto } from '@/lib/api';

function StatusBadge({ status }: Readonly<{ status: string }>) {
  const config: Record<string, { color: string; label: string; icon: string }> = {
    active: { color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', label: 'Ativo', icon: '✓' },
    pending: { color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', label: 'Pendente', icon: '⏳' },
    suspended: { color: 'bg-red-500/10 text-red-400 border border-red-500/20', label: 'Suspenso', icon: '⚠' },
    cancelled: { color: 'bg-gray-500/10 text-gray-400 border border-gray-500/20', label: 'Cancelado', icon: '✕' },
  };
  const c = config[status] || { color: 'bg-gray-500/10 text-gray-400 border border-gray-500/20', label: status, icon: '?' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${c.color}`}>
      <span>{c.icon}</span>
      {c.label}
    </span>
  );
}

function PlanBadge({ plan }: Readonly<{ plan: string }>) {
  const config: Record<string, { color: string; label: string; gradient: string }> = {
    starter: { color: 'text-blue-400', label: 'Starter', gradient: 'from-blue-500 to-cyan-500' },
    professional: { color: 'text-violet-400', label: 'Professional', gradient: 'from-violet-500 to-purple-500' },
    enterprise: { color: 'text-rose-400', label: 'Enterprise', gradient: 'from-rose-500 to-pink-500' },
  };
  const key = Object.keys(config).find(k => plan?.includes(k)) || 'starter';
  const c = config[key];
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${c.gradient} text-white shadow-lg shadow-${key === 'starter' ? 'blue' : key === 'professional' ? 'violet' : 'rose'}-500/20`}>
      {c.label}
    </span>
  );
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121A] border border-[#1F1F28] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-[#1F1F28]">
          <h2 className="text-2xl font-bold text-white">Criar Novo Tenant</h2>
          <p className="text-[#6B6B7E] mt-1">Adicione uma nova oficina ao sistema</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label htmlFor="tenant-name" className="block text-sm font-medium text-[#8B8B9E] mb-2">Nome da Oficina *</label>
            <input 
              id="tenant-name" 
              type="text" 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              className="w-full px-4 py-3 bg-[#1A1A24] border border-[#2A2A38] rounded-xl text-white focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/20 transition-all" 
              placeholder="Ex: Oficina do João"
              required 
            />
          </div>
          <div>
            <label htmlFor="tenant-subdomain" className="block text-sm font-medium text-[#8B8B9E] mb-2">Subdomain *</label>
            <div className="flex items-center">
              <input 
                id="tenant-subdomain" 
                type="text" 
                value={formData.subdomain} 
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replaceAll(/[^a-z0-9-]/g, '') })} 
                className="flex-1 px-4 py-3 bg-[#1A1A24] border border-[#2A2A38] rounded-l-xl text-white focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/20 transition-all" 
                placeholder="minhaoficina"
                required 
              />
              <span className="px-4 py-3 bg-[#2A2A38] border border-l-0 border-[#2A2A38] rounded-r-xl text-[#6B6B7E] text-sm">.mecanica365.com</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="tenant-doc-type" className="block text-sm font-medium text-[#8B8B9E] mb-2">Tipo de Documento</label>
              <select 
                id="tenant-doc-type" 
                value={formData.documentType} 
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value as 'cpf' | 'cnpj' })} 
                className="w-full px-4 py-3 bg-[#1A1A24] border border-[#2A2A38] rounded-xl text-white focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/20 transition-all"
              >
                <option value="cnpj">CNPJ</option>
                <option value="cpf">CPF</option>
              </select>
            </div>
            <div>
              <label htmlFor="tenant-document" className="block text-sm font-medium text-[#8B8B9E] mb-2">Documento *</label>
              <input 
                id="tenant-document" 
                type="text" 
                value={formData.document} 
                onChange={(e) => setFormData({ ...formData, document: e.target.value })} 
                className="w-full px-4 py-3 bg-[#1A1A24] border border-[#2A2A38] rounded-xl text-white focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/20 transition-all" 
                placeholder="00.000.000/0000-00"
                required 
              />
            </div>
          </div>
          <div>
            <label htmlFor="tenant-plan" className="block text-sm font-medium text-[#8B8B9E] mb-2">Plano</label>
            <select 
              id="tenant-plan" 
              value={formData.plan} 
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })} 
              className="w-full px-4 py-3 bg-[#1A1A24] border border-[#2A2A38] rounded-xl text-white focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/20 transition-all"
            >
              <option value="workshops_starter">🚀 Starter</option>
              <option value="workshops_professional">⭐ Professional</option>
              <option value="workshops_enterprise">👑 Enterprise</option>
            </select>
          </div>
          <div className="border-t border-[#1F1F28] pt-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <PersonIcon className="w-5 h-5 text-[#FF6B6B]" />
              Usuário Administrador
            </h3>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Nome do Admin" 
                value={formData.adminName} 
                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })} 
                className="w-full px-4 py-3 bg-[#1A1A24] border border-[#2A2A38] rounded-xl text-white placeholder-[#6B6B7E] focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/20 transition-all" 
              />
              <input 
                type="email" 
                placeholder="Email do Admin" 
                value={formData.adminEmail} 
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })} 
                className="w-full px-4 py-3 bg-[#1A1A24] border border-[#2A2A38] rounded-xl text-white placeholder-[#6B6B7E] focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/20 transition-all" 
              />
              <input 
                type="password" 
                placeholder="Senha do Admin" 
                value={formData.adminPassword} 
                onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })} 
                className="w-full px-4 py-3 bg-[#1A1A24] border border-[#2A2A38] rounded-xl text-white placeholder-[#6B6B7E] focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/20 transition-all" 
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 px-4 py-3 border border-[#2A2A38] rounded-xl text-[#8B8B9E] hover:bg-[#1A1A24] hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#FF6B6B] to-[#EE5A5A] rounded-xl text-white font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-[#FF6B6B]/20 transition-all"
            >
              {isSubmitting ? 'Criando...' : 'Criar Tenant'}
            </button>
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
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);

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
      if (action === 'cancel' && !confirm('Tem certeza que deseja cancelar este tenant?')) return;
      await tenantsApi[action](id);
      loadTenants();
    } catch (error) {
      console.error('Erro:', error);
    }
    setActionMenu(null);
    setMenuPosition(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FF6B6B]/20 border-t-[#FF6B6B] rounded-full animate-spin" />
          <p className="text-[#6B6B7E]">Carregando tenants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white">Tenants</h1>
          <p className="text-[#6B6B7E] mt-2">Gerencie as oficinas cadastradas na plataforma</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FF6B6B] to-[#EE5A5A] rounded-xl text-white font-medium hover:shadow-lg hover:shadow-[#FF6B6B]/20 transition-all"
        >
          <PlusIcon className="w-5 h-5" />
          Novo Tenant
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6B7E]" />
          <input 
            type="text" 
            placeholder="Buscar por nome, subdomain ou documento..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="w-full pl-12 pr-4 py-3 bg-[#12121A] border border-[#1F1F28] rounded-xl text-white placeholder-[#6B6B7E] focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/20 transition-all" 
          />
        </div>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)} 
          className="px-4 py-3 bg-[#12121A] border border-[#1F1F28] rounded-xl text-white focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/20 transition-all min-w-[150px]"
        >
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="pending">Pendentes</option>
          <option value="suspended">Suspensos</option>
          <option value="cancelled">Cancelados</option>
        </select>
        <button 
          onClick={loadTenants} 
          className="px-4 py-3 bg-[#12121A] border border-[#1F1F28] rounded-xl text-[#8B8B9E] hover:text-white hover:border-[#FF6B6B] transition-all"
          title="Recarregar"
        >
          <ReloadIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#12121A]/50 rounded-xl p-5 hover:bg-[#12121A] transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-[#8B8B9E]/10 rounded-lg flex items-center justify-center">
              <PersonIcon className="w-4 h-4 text-[#8B8B9E]" />
            </div>
            <p className="text-[#6B6B7E] text-sm">Total</p>
          </div>
          <p className="text-3xl font-bold text-white">{tenants.length}</p>
        </div>
        <div className="bg-[#12121A]/50 rounded-xl p-5 hover:bg-[#12121A] transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <CheckCircledIcon className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[#6B6B7E] text-sm">Ativos</p>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{tenants.filter(t => t.status === 'active').length}</p>
        </div>
        <div className="bg-[#12121A]/50 rounded-xl p-5 hover:bg-[#12121A] transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-[#6B6B7E] text-sm">Pendentes</p>
          </div>
          <p className="text-3xl font-bold text-amber-400">{tenants.filter(t => t.status === 'pending').length}</p>
        </div>
        <div className="bg-[#12121A]/50 rounded-xl p-5 hover:bg-[#12121A] transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-red-500/10 rounded-lg flex items-center justify-center">
              <CrossCircledIcon className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-[#6B6B7E] text-sm">Suspensos</p>
          </div>
          <p className="text-3xl font-bold text-red-400">{tenants.filter(t => t.status === 'suspended').length}</p>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-[#0A0A0D] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-[#1F1F28]/50">
                <th className="px-6 py-4 text-left text-xs font-medium text-[#6B6B7E] uppercase tracking-wider">Oficina</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#6B6B7E] uppercase tracking-wider">Subdomain</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#6B6B7E] uppercase tracking-wider">Documento</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#6B6B7E] uppercase tracking-wider">Plano</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#6B6B7E] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#6B6B7E] uppercase tracking-wider">Criado em</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-[#6B6B7E] uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F28]/30">
              {filtered.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-[#12121A]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">{tenant.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{tenant.name}</p>
                        <p className="text-[#6B6B7E] text-xs flex items-center gap-1">
                          <PersonIcon className="w-3 h-3" />
                          {tenant.adminEmail || 'Sem admin'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <GlobeIcon className="w-4 h-4 text-[#4B4B5E]" />
                      <span className="text-[#8B8B9E] font-mono text-sm">{tenant.subdomain}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <IdCardIcon className="w-4 h-4 text-[#4B4B5E]" />
                      <span className="text-[#6B6B7E] text-xs uppercase">{tenant.documentType}:</span>
                      <span className="text-[#8B8B9E] text-sm">{tenant.document}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <PlanBadge plan={tenant.plan} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={tenant.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[#6B6B7E] text-sm">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block">
                      <button 
                        onClick={(e) => {
                          if (actionMenu === tenant.id) {
                            setActionMenu(null);
                            setMenuPosition(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuPosition({
                              top: rect.bottom + 8,
                              right: window.innerWidth - rect.right,
                            });
                            setActionMenu(tenant.id);
                          }
                        }} 
                        className="p-2 hover:bg-[#2A2A38] rounded-lg transition-colors"
                      >
                        <DotsHorizontalIcon className="w-5 h-5 text-[#8B8B9E]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-[#1F1F28] rounded-full flex items-center justify-center">
                        <PersonIcon className="w-8 h-8 text-[#3A3A4E]" />
                      </div>
                      <p className="text-[#6B6B7E] text-lg">Nenhum tenant encontrado</p>
                      <p className="text-[#4A4A5E] text-sm">Tente ajustar os filtros ou criar um novo tenant</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreate} />

      {/* Action Menu Modal */}
      {actionMenu && menuPosition && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setActionMenu(null); setMenuPosition(null); }} />
          <div 
            className="fixed w-56 bg-[#1A1A24] border border-[#2A2A38] rounded-xl shadow-2xl z-50 overflow-hidden"
            style={{ 
              top: Math.min(menuPosition.top, window.innerHeight - 280), 
              right: menuPosition.right 
            }}
          >
            {(() => {
              const tenant = filtered.find(t => t.id === actionMenu);
              if (!tenant) return null;
              return (
                <>
                  <div className="px-4 py-2.5 border-b border-[#2A2A38] bg-[#12121A]">
                    <p className="text-white font-medium text-sm">{tenant.name}</p>
                    <p className="text-[#6B6B7E] text-xs">{tenant.subdomain}.mecanica365.com</p>
                  </div>
                  <div className="py-1">
                    <Link 
                      href={`/tenants/${tenant.id}`} 
                      className="flex items-center gap-2.5 px-4 py-2 text-[#8B8B9E] hover:bg-[#2A2A38] hover:text-white transition-colors text-sm"
                    >
                      <Pencil1Icon className="w-4 h-4" />
                      Editar
                    </Link>
                    <a 
                      href={`http://${tenant.subdomain}.localhost:3000`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-4 py-2 text-[#8B8B9E] hover:bg-[#2A2A38] hover:text-white transition-colors text-sm"
                    >
                      <ExternalLinkIcon className="w-4 h-4" />
                      Acessar Painel
                    </a>
                  </div>
                  <div className="border-t border-[#2A2A38] py-1">
                    {tenant.status !== 'active' && (
                      <button 
                        onClick={() => handleAction(tenant.id, 'activate')} 
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-emerald-400 hover:bg-emerald-500/10 transition-colors text-sm"
                      >
                        <CheckCircledIcon className="w-4 h-4" />
                        Ativar
                      </button>
                    )}
                    {tenant.status === 'active' && (
                      <button 
                        onClick={() => handleAction(tenant.id, 'suspend')} 
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-amber-400 hover:bg-amber-500/10 transition-colors text-sm"
                      >
                        <CrossCircledIcon className="w-4 h-4" />
                        Suspender
                      </button>
                    )}
                    {tenant.status !== 'cancelled' && (
                      <button 
                        onClick={() => handleAction(tenant.id, 'cancel')} 
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
                      >
                        <CrossCircledIcon className="w-4 h-4" />
                        Cancelar
                      </button>
                    )}
                  </div>
                  <div className="border-t border-[#2A2A38]">
                    <button 
                      onClick={() => { setActionMenu(null); setMenuPosition(null); }} 
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-[#6B6B7E] hover:bg-[#2A2A38] hover:text-white transition-colors text-sm"
                    >
                      Fechar
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
