'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, CheckCircledIcon, CrossCircledIcon, ReloadIcon } from '@radix-ui/react-icons';
import { tenantsApi, Tenant } from '@/lib/api';

export default function TenantDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', plan: '' });

  useEffect(() => { loadTenant(); }, [id]);

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
    </div>
  );
}

