'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, Pencil1Icon, TrashIcon, ReloadIcon, PlayIcon, LightningBoltIcon } from '@radix-ui/react-icons';
import { automationsApi, Automation } from '@/lib/api';

const TRIGGERS = [
  { value: 'quote.created', label: 'Orçamento Criado', icon: '📝' },
  { value: 'quote.approved', label: 'Orçamento Aprovado', icon: '✅' },
  { value: 'service_order.completed', label: 'OS Concluída', icon: '✔️' },
  { value: 'invoice.paid', label: 'Fatura Paga', icon: '💰' },
  { value: 'part.low_stock', label: 'Estoque Baixo', icon: '📦' },
];

const ACTIONS = [
  { value: 'send_email', label: 'Enviar E-mail', icon: '📧' },
  { value: 'send_sms', label: 'Enviar SMS', icon: '📱' },
  { value: 'create_notification', label: 'Criar Notificação', icon: '🔔' },
  { value: 'webhook', label: 'Chamar Webhook', icon: '🌐' },
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

function Modal({ isOpen, automation, onClose, onSubmit }: Readonly<{ isOpen: boolean; automation?: Automation | null; onClose: () => void; onSubmit: (data: { name: string; trigger: string; actions: { type: string; config: Record<string, unknown> }[] }) => Promise<void> }>) {
  const [form, setForm] = useState({ name: '', trigger: 'quote.created', actions: [] as string[] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (automation) setForm({ name: automation.name, trigger: automation.trigger, actions: automation.actions.map(a => a.type) });
    else setForm({ name: '', trigger: 'quote.created', actions: [] });
  }, [automation, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.actions.length === 0) { alert('Adicione pelo menos uma ação'); return; }
    setIsSubmitting(true);
    try { await onSubmit({ name: form.name, trigger: form.trigger, actions: form.actions.map(a => ({ type: a, config: {} })) }); } finally { setIsSubmitting(false); }
  };

  const toggleAction = (a: string) => setForm(f => ({ ...f, actions: f.actions.includes(a) ? f.actions.filter(x => x !== a) : [...f.actions, a] }));

  const getAction = (a: string) => ACTIONS.find((x) => x.value === a);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#1F1F28]"><h2 className="text-xl font-bold text-white">{automation ? 'Editar' : 'Nova'} Automação</h2></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label htmlFor="automation-name" className="block text-sm font-medium text-[#8B8B9E] mb-1">Nome *</label><input id="automation-name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Enviar email ao aprovar" className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-white focus:border-[#FF6B6B] focus:outline-none" required /></div>
          <div><label htmlFor="automation-trigger" className="block text-sm font-medium text-[#8B8B9E] mb-2">Gatilho *</label>
            <select id="automation-trigger" value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })} className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-white focus:border-[#FF6B6B] focus:outline-none">
              {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="automation-actions" className="block text-sm font-medium text-[#8B8B9E] mb-2">Ações *</label>
            <div className="space-y-2 mb-3">{form.actions.map((a) => { const info = getAction(a); return <div key={a} className="flex items-center justify-between p-3 bg-[#1A1A24] rounded-lg"><div className="flex items-center gap-2"><span>{info?.icon}</span><span className="text-white">{info?.label}</span></div><button type="button" onClick={() => toggleAction(a)} className="text-[#FF6B6B]">✕</button></div>; })}</div>
            <div className="grid grid-cols-2 gap-2">{ACTIONS.map(a => <button key={a.value} type="button" onClick={() => toggleAction(a.value)} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${form.actions.includes(a.value) ? 'bg-[#FF6B6B]/20 border border-[#FF6B6B] text-white' : 'bg-[#1A1A24] border border-[#2A2A38] text-[#8B8B9E] hover:text-white'}`}><span>{a.icon}</span>{a.label}</button>)}</div>
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

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Automation | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { 
      setIsLoading(true); 
      const data = await automationsApi.findAll();
      setAutomations(data); 
    } catch (e) { 
      console.error(e); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleCreate = async (data: { name: string; trigger: string; actions: { type: string; config: Record<string, unknown> }[] }) => {
    try { await automationsApi.create(data); setIsModalOpen(false); load(); } catch (e) { console.error(e); alert('Erro'); }
  };

  const handleEdit = async (data: { name: string; trigger: string; actions: { type: string; config: Record<string, unknown> }[] }) => {
    if (!editing) return;
    try { await automationsApi.update(editing.id, data); setEditing(null); load(); } catch (e) { console.error(e); alert('Erro'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir?')) return;
    try { await automationsApi.remove(id); load(); } catch (e) { console.error(e); }
  };

  const handleExecute = async (id: string) => {
    setExecuting(id);
    try { const res = await automationsApi.execute(id); alert(res.success ? '✅ Executado!' : `❌ Erro: ${res.message}`); load(); } catch (e) { console.error(e); alert('Erro'); } finally { setExecuting(null); }
  };

  const getTrigger = (t: string) => TRIGGERS.find((x) => x.value === t);
  const getAction = (a: string) => ACTIONS.find((x) => x.value === a);

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-10 h-10 border-4 border-[#FF6B6B]/20 border-t-[#FF6B6B] rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-white">Automações</h1><p className="text-[#8B8B9E] mt-1">Configure regras de automação</p></div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 bg-[#12121A] border border-[#1F1F28] rounded-lg text-[#8B8B9E] hover:text-white"><ReloadIcon className="w-5 h-5" /></button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#EE5A5A] rounded-lg text-white font-medium"><PlusIcon className="w-5 h-5" />Nova</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-4"><p className="text-[#6B6B7E] text-sm">Total</p><p className="text-2xl font-bold text-white">{automations.length}</p></div>
        <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-4"><p className="text-[#6B6B7E] text-sm">Ativas</p><p className="text-2xl font-bold text-[#4ADE80]">{automations.filter(a => a.status === 'active').length}</p></div>
        <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-4"><p className="text-[#6B6B7E] text-sm">Execuções</p><p className="text-2xl font-bold text-[#3B82F6]">{automations.reduce((s, a) => s + a.executionCount, 0)}</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {automations.map((a) => {
          const t = getTrigger(a.trigger);
          return (
            <div key={a.id} className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6 hover:border-[#2A2A38]">
              <div className="flex items-start justify-between mb-4"><div><h3 className="text-white font-medium">{a.name}</h3>{a.description && <p className="text-[#6B6B7E] text-sm mt-1">{a.description}</p>}</div><StatusBadge status={a.status} /></div>
              <div className="mb-4"><p className="text-[#6B6B7E] text-xs mb-2">GATILHO</p><div className="flex items-center gap-2 p-2 bg-[#1A1A24] rounded-lg"><span>{t?.icon}</span><span className="text-white text-sm">{t?.label}</span></div></div>
              <div className="mb-4"><p className="text-[#6B6B7E] text-xs mb-2">AÇÕES ({a.actions.length})</p><div className="flex flex-wrap gap-1">{a.actions.map((act) => { const info = getAction(act.type); return <span key={act.type} className="px-2 py-1 bg-[#1A1A24] rounded text-xs text-[#8B8B9E]">{info?.icon} {info?.label}</span>; })}</div></div>
              <div className="flex items-center justify-between text-[#6B6B7E] text-xs mb-4"><span>{a.executionCount} execuções</span>{a.lastExecutedAt && <span>Última: {new Date(a.lastExecutedAt).toLocaleString('pt-BR')}</span>}</div>
              <div className="flex gap-2">
                <button onClick={() => handleExecute(a.id)} disabled={executing === a.id || a.status !== 'active'} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#4ADE80]/20 rounded-lg text-[#4ADE80] hover:bg-[#4ADE80]/30 disabled:opacity-50">{executing === a.id ? <ReloadIcon className="w-4 h-4 animate-spin" /> : <PlayIcon className="w-4 h-4" />}Executar</button>
                <button onClick={() => setEditing(a)} className="p-2 bg-[#1A1A24] border border-[#2A2A38] rounded-lg text-[#8B8B9E] hover:text-white"><Pencil1Icon className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(a.id)} className="p-2 bg-[#FF6B6B]/20 rounded-lg text-[#FF6B6B] hover:bg-[#FF6B6B]/30"><TrashIcon className="w-4 h-4" /></button>
              </div>
            </div>
          );
        })}
        {automations.length === 0 && <div className="col-span-full text-center py-12"><LightningBoltIcon className="w-12 h-12 text-[#2A2A38] mx-auto mb-4" /><p className="text-[#6B6B7E]">Nenhuma automação</p><button onClick={() => setIsModalOpen(true)} className="mt-4 text-[#FF6B6B] hover:underline">Criar primeira</button></div>}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreate} />
      <Modal isOpen={!!editing} automation={editing} onClose={() => setEditing(null)} onSubmit={handleEdit} />
    </div>
  );
}

