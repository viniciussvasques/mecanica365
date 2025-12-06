'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, Pencil1Icon, TrashIcon, ReloadIcon, RocketIcon, CheckCircledIcon } from '@radix-ui/react-icons';
import { integrationsApi, Integration } from '@/lib/api';

const TYPES = [
  { type: 'renavan', name: 'RENAVAN', icon: '🚗', desc: 'Consulta de veículos' },
  { type: 'vin_decoder', name: 'VIN Decoder', icon: '🔍', desc: 'Decodificação de chassi' },
  { type: 'cep', name: 'CEP', icon: '📍', desc: 'Busca de endereços' },
  { type: 'sms', name: 'SMS', icon: '📱', desc: 'Envio de SMS' },
  { type: 'whatsapp', name: 'WhatsApp', icon: '💬', desc: 'WhatsApp Business' },
  { type: 'payment_gateway', name: 'Pagamento', icon: '💳', desc: 'Gateway de pagamento' },
  { type: 'nfe', name: 'NF-e', icon: '📄', desc: 'Nota Fiscal' },
];

function StatusBadge({ status }: Readonly<{ status: string }>) {
  const config: Record<string, { color: string; label: string }> = {
    active: { color: 'bg-[#4ADE80]/20 text-[#4ADE80]', label: 'Ativo' },
    inactive: { color: 'bg-[#6B6B7E]/20 text-[#6B6B7E]', label: 'Inativo' },
    error: { color: 'bg-[#FF6B6B]/20 text-[#FF6B6B]', label: 'Erro' },
  };
  const c = config[status] || config.inactive;
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.color}`}>{c.label}</span>;
}

function Modal({ isOpen, integration, onClose, onSubmit }: Readonly<{ isOpen: boolean; integration?: Integration | null; onClose: () => void; onSubmit: (data: { type: string; name: string; config: Record<string, unknown> }) => Promise<void> }>) {
  const [form, setForm] = useState({ type: 'cep', name: '', apiKey: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (integration) setForm({ type: integration.type, name: integration.name, apiKey: (integration.config as Record<string, string>).apiKey || '' });
    else setForm({ type: 'cep', name: '', apiKey: '' });
  }, [integration, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try { await onSubmit({ type: form.type, name: form.name, config: { apiKey: form.apiKey } }); } finally { setIsSubmitting(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl w-full max-w-lg">
        <div className="p-6 border-b border-[#1F1F28]"><h2 className="text-xl font-bold text-white">{integration ? 'Editar' : 'Nova'} Integração</h2></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label htmlFor="integration-type" className="block text-sm font-medium text-[#8B8B9E] mb-1">Tipo *</label>
            <select id="integration-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, name: TYPES.find(t => t.type === e.target.value)?.name || '' })} disabled={!!integration} className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-white disabled:opacity-50">
              {TYPES.map(t => <option key={t.type} value={t.type}>{t.icon} {t.name}</option>)}
            </select>
          </div>
          <div><label htmlFor="integration-name" className="block text-sm font-medium text-[#8B8B9E] mb-1">Nome *</label><input id="integration-name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-white focus:border-[#FF6B6B] focus:outline-none" required /></div>
          <div><label htmlFor="integration-apikey" className="block text-sm font-medium text-[#8B8B9E] mb-1">API Key</label><input id="integration-apikey" type="password" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-white focus:border-[#FF6B6B] focus:outline-none" /></div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-[#2A2A38] rounded-lg text-[#8B8B9E] hover:bg-[#1A1A24]">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#EE5A5A] rounded-lg text-white font-medium disabled:opacity-50">{isSubmitting ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Integration | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { 
      setIsLoading(true); 
      const data = await integrationsApi.findAll();
      setIntegrations(data); 
    } catch (e) { 
      console.error(e); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleCreate = async (data: { type: string; name: string; config: Record<string, unknown> }) => {
    try { await integrationsApi.create(data); setIsModalOpen(false); load(); } catch (e) { console.error(e); alert('Erro'); }
  };

  const handleEdit = async (data: { type: string; name: string; config: Record<string, unknown> }) => {
    if (!editing) return;
    try { await integrationsApi.update(editing.id, data); setEditing(null); load(); } catch (e) { console.error(e); alert('Erro'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir?')) return;
    try { await integrationsApi.remove(id); load(); } catch (e) { console.error(e); }
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    try { const res = await integrationsApi.test(id); alert(res.success ? '✅ Sucesso!' : `❌ Falha: ${res.message}`); } catch (e) { console.error(e); alert('Erro no teste'); } finally { setTesting(null); }
  };

  const getType = (type: string) => TYPES.find(t => t.type === type);

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-10 h-10 border-4 border-[#FF6B6B]/20 border-t-[#FF6B6B] rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-white">Integrações</h1><p className="text-[#8B8B9E] mt-1">Configure integrações externas</p></div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 bg-[#12121A] border border-[#1F1F28] rounded-lg text-[#8B8B9E] hover:text-white"><ReloadIcon className="w-5 h-5" /></button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#EE5A5A] rounded-lg text-white font-medium"><PlusIcon className="w-5 h-5" />Nova</button>
        </div>
      </div>

      <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Disponíveis</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TYPES.map(t => {
            const configured = integrations.some(i => i.type === t.type);
            return <div key={t.type} className={`p-4 rounded-lg border ${configured ? 'bg-[#4ADE80]/10 border-[#4ADE80]/30' : 'bg-[#1A1A24] border-[#2A2A38]'}`}><div className="text-2xl mb-2">{t.icon}</div><p className="text-white font-medium">{t.name}</p><p className="text-[#6B6B7E] text-xs mt-1">{configured ? '✓ Configurado' : 'Não configurado'}</p></div>;
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((i) => {
          const t = getType(i.type);
          return (
            <div key={i.id} className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6 hover:border-[#2A2A38]">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3"><div className="text-3xl">{t?.icon || '⚙️'}</div><div><h3 className="text-white font-medium">{i.name}</h3><p className="text-[#6B6B7E] text-sm">{t?.name || i.type}</p></div></div>
                <StatusBadge status={i.status} />
              </div>
              {i.lastError && <p className="text-[#FF6B6B] text-xs mb-4 truncate">Erro: {i.lastError}</p>}
              <div className="flex gap-2">
                <button onClick={() => handleTest(i.id)} disabled={testing === i.id} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-[#8B8B9E] hover:text-white disabled:opacity-50">{testing === i.id ? <ReloadIcon className="w-4 h-4 animate-spin" /> : <RocketIcon className="w-4 h-4" />}Testar</button>
                <button onClick={() => setEditing(i)} className="p-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-[#8B8B9E] hover:text-white"><Pencil1Icon className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(i.id)} className="p-2 bg-[#FF6B6B]/20 rounded-lg text-[#FF6B6B] hover:bg-[#FF6B6B]/30"><TrashIcon className="w-4 h-4" /></button>
              </div>
            </div>
          );
        })}
        {integrations.length === 0 && <div className="col-span-full text-center py-12"><CheckCircledIcon className="w-12 h-12 text-[#2A2A38] mx-auto mb-4" /><p className="text-[#6B6B7E]">Nenhuma integração</p><button onClick={() => setIsModalOpen(true)} className="mt-4 text-[#FF6B6B] hover:underline">Configurar primeira</button></div>}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreate} />
      <Modal isOpen={!!editing} integration={editing} onClose={() => setEditing(null)} onSubmit={handleEdit} />
    </div>
  );
}

