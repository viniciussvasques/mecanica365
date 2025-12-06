'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, Pencil1Icon, TrashIcon, ReloadIcon, Link2Icon, CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import { webhooksApi, Webhook } from '@/lib/api';

const EVENTS = [
  { value: 'quote.created', label: 'Orçamento Criado' },
  { value: 'quote.approved', label: 'Orçamento Aprovado' },
  { value: 'service_order.created', label: 'OS Criada' },
  { value: 'service_order.completed', label: 'OS Concluída' },
  { value: 'invoice.paid', label: 'Fatura Paga' },
  { value: 'payment.received', label: 'Pagamento Recebido' },
  { value: 'customer.created', label: 'Cliente Criado' },
  { value: 'part.low_stock', label: 'Estoque Baixo' },
];

function Modal({ isOpen, webhook, onClose, onSubmit }: Readonly<{ isOpen: boolean; webhook?: Webhook | null; onClose: () => void; onSubmit: (data: { name: string; url: string; events: string[] }) => Promise<void> }>) {
  const [form, setForm] = useState({ name: '', url: '', events: [] as string[] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (webhook) setForm({ name: webhook.name, url: webhook.url, events: webhook.events });
    else setForm({ name: '', url: '', events: [] });
  }, [webhook, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.events.length === 0) { alert('Selecione pelo menos um evento'); return; }
    setIsSubmitting(true);
    try { await onSubmit(form); } finally { setIsSubmitting(false); }
  };

  const toggleEvent = (e: string) => setForm(f => ({ ...f, events: f.events.includes(e) ? f.events.filter(x => x !== e) : [...f.events, e] }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#1F1F28]"><h2 className="text-xl font-bold text-white">{webhook ? 'Editar' : 'Novo'} Webhook</h2></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label htmlFor="webhook-name" className="block text-sm font-medium text-[#8B8B9E] mb-1">Nome *</label><input id="webhook-name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-white focus:border-[#FF6B6B] focus:outline-none" required /></div>
          <div><label htmlFor="webhook-url" className="block text-sm font-medium text-[#8B8B9E] mb-1">URL *</label><input id="webhook-url" type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-white focus:border-[#FF6B6B] focus:outline-none" required /></div>
          <div>
            <label htmlFor="webhook-events" className="block text-sm font-medium text-[#8B8B9E] mb-2">Eventos *</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {EVENTS.map((e) => (
                <label key={e.value} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${form.events.includes(e.value) ? 'bg-[#FF6B6B]/20 border border-[#FF6B6B]' : 'bg-[#1A1A24] border border-[#2A2A38] hover:border-[#3A3A48]'}`}>
                  <input type="checkbox" checked={form.events.includes(e.value)} onChange={() => toggleEvent(e.value)} className="hidden" />
                  <span className={`text-sm ${form.events.includes(e.value) ? 'text-white' : 'text-[#8B8B9E]'}`}>{e.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-[#2A2A38] rounded-lg text-[#8B8B9E] hover:bg-[#1A1A24]">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#EE5A5A] rounded-lg text-white font-medium disabled:opacity-50">{isSubmitting ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Webhook | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setIsLoading(true); setWebhooks(await webhooksApi.findAll()); } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleCreate = async (data: { name: string; url: string; events: string[] }) => {
    try { 
      await webhooksApi.create(data); 
      setIsModalOpen(false); 
      await load(); 
    } catch (e) { 
      console.error(e); 
      alert('Erro'); 
    }
  };

  const handleEdit = async (data: { name: string; url: string; events: string[] }) => {
    if (!editing) return;
    try { await webhooksApi.update(editing.id, data); setEditing(null); load(); } catch (e) { console.error(e); alert('Erro'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir?')) return;
    try { await webhooksApi.remove(id); load(); } catch (e) { console.error(e); }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-10 h-10 border-4 border-[#FF6B6B]/20 border-t-[#FF6B6B] rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-white">Webhooks</h1><p className="text-[#8B8B9E] mt-1">Configure webhooks para integrações</p></div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 bg-[#12121A] border border-[#1F1F28] rounded-lg text-[#8B8B9E] hover:text-white"><ReloadIcon className="w-5 h-5" /></button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#EE5A5A] rounded-lg text-white font-medium"><PlusIcon className="w-5 h-5" />Novo</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {webhooks.map((w) => (
          <div key={w.id} className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6 hover:border-[#2A2A38]">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${w.isActive ? 'bg-[#4ADE80]/20' : 'bg-[#6B6B7E]/20'}`}><Link2Icon className={`w-5 h-5 ${w.isActive ? 'text-[#4ADE80]' : 'text-[#6B6B7E]'}`} /></div>
                <div><h3 className="text-white font-medium">{w.name}</h3><p className="text-[#6B6B7E] text-sm truncate max-w-[200px]">{w.url}</p></div>
              </div>
              {w.isActive ? <CheckCircledIcon className="w-5 h-5 text-[#4ADE80]" /> : <CrossCircledIcon className="w-5 h-5 text-[#6B6B7E]" />}
            </div>
            <div className="mb-4"><p className="text-[#6B6B7E] text-sm mb-2">Eventos ({w.events.length})</p><div className="flex flex-wrap gap-1">{w.events.slice(0, 3).map(e => <span key={e} className="px-2 py-0.5 bg-[#1A1A24] rounded text-xs text-[#8B8B9E]">{e.split('.')[1]}</span>)}{w.events.length > 3 && <span className="px-2 py-0.5 bg-[#1A1A24] rounded text-xs text-[#8B8B9E]">+{w.events.length - 3}</span>}</div></div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(w)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-[#8B8B9E] hover:text-white"><Pencil1Icon className="w-4 h-4" />Editar</button>
              <button onClick={() => handleDelete(w.id)} className="p-2 bg-[#FF6B6B]/20 rounded-lg text-[#FF6B6B] hover:bg-[#FF6B6B]/30"><TrashIcon className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {webhooks.length === 0 && <div className="col-span-full text-center py-12"><Link2Icon className="w-12 h-12 text-[#2A2A38] mx-auto mb-4" /><p className="text-[#6B6B7E]">Nenhum webhook</p><button onClick={() => setIsModalOpen(true)} className="mt-4 text-[#FF6B6B] hover:underline">Criar primeiro</button></div>}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreate} />
      <Modal isOpen={!!editing} webhook={editing} onClose={() => setEditing(null)} onSubmit={handleEdit} />
    </div>
  );
}

