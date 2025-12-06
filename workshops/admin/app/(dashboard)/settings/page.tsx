'use client';

import { useState } from 'react';
import { GearIcon, LockClosedIcon, BellIcon, GlobeIcon, MixerHorizontalIcon, ReloadIcon } from '@radix-ui/react-icons';

function Section({ title, desc, icon: Icon, children }: { title: string; desc: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6">
      <div className="flex items-start gap-4 mb-6"><div className="p-2 bg-[#FF6B6B]/20 rounded-lg"><Icon className="w-5 h-5 text-[#FF6B6B]" /></div><div><h3 className="text-lg font-semibold text-white">{title}</h3><p className="text-[#6B6B7E] text-sm">{desc}</p></div></div>
      {children}
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#1F1F28] last:border-0">
      <div><p className="text-white">{label}</p>{desc && <p className="text-[#6B6B7E] text-sm">{desc}</p>}</div>
      <button onClick={() => onChange(!checked)} className={`w-12 h-6 rounded-full transition-colors ${checked ? 'bg-[#FF6B6B]' : 'bg-[#2A2A38]'}`}><div className={`w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-0.5'}`} /></button>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    twoFactorRequired: false,
    passwordExpiration: false,
    emailNotifications: true,
    slackNotifications: false,
    debugMode: false,
    autoBackup: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const toggle = (key: keyof typeof settings) => setSettings(s => ({ ...s, [key]: !s[key] }));

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
    alert('Configurações salvas!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-white">Configurações</h1><p className="text-[#8B8B9E] mt-1">Configurações gerais do sistema</p></div>
        <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#EE5A5A] rounded-lg text-white font-medium disabled:opacity-50">{isSaving ? <ReloadIcon className="w-4 h-4 animate-spin" /> : <GearIcon className="w-4 h-4" />}{isSaving ? 'Salvando...' : 'Salvar'}</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Geral" desc="Configurações gerais" icon={GlobeIcon}>
          <Toggle label="Modo de Manutenção" desc="Bloqueia acesso de usuários" checked={settings.maintenanceMode} onChange={() => toggle('maintenanceMode')} />
          <Toggle label="Registro de Tenants" desc="Permite novos cadastros" checked={settings.registrationEnabled} onChange={() => toggle('registrationEnabled')} />
        </Section>

        <Section title="Segurança" desc="Configurações de segurança" icon={LockClosedIcon}>
          <Toggle label="2FA Obrigatório" desc="Exige autenticação de dois fatores" checked={settings.twoFactorRequired} onChange={() => toggle('twoFactorRequired')} />
          <Toggle label="Expiração de Senha" desc="Força troca a cada 90 dias" checked={settings.passwordExpiration} onChange={() => toggle('passwordExpiration')} />
        </Section>

        <Section title="Notificações" desc="Configurações de alertas" icon={BellIcon}>
          <Toggle label="Email" desc="Receber alertas por email" checked={settings.emailNotifications} onChange={() => toggle('emailNotifications')} />
          <Toggle label="Slack" desc="Enviar para canal do Slack" checked={settings.slackNotifications} onChange={() => toggle('slackNotifications')} />
        </Section>

        <Section title="Sistema" desc="Configurações técnicas" icon={MixerHorizontalIcon}>
          <Toggle label="Modo Debug" desc="Ativa logs detalhados" checked={settings.debugMode} onChange={() => toggle('debugMode')} />
          <Toggle label="Backup Automático" desc="Backup diário do banco" checked={settings.autoBackup} onChange={() => toggle('autoBackup')} />
        </Section>
      </div>

      <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Informações do Sistema</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><p className="text-[#6B6B7E] text-sm">Versão</p><p className="text-white font-medium">v1.0.0</p></div>
          <div><p className="text-[#6B6B7E] text-sm">Ambiente</p><p className="text-white font-medium">Production</p></div>
          <div><p className="text-[#6B6B7E] text-sm">Último Deploy</p><p className="text-white font-medium">{new Date().toLocaleDateString('pt-BR')}</p></div>
          <div><p className="text-[#6B6B7E] text-sm">Uptime</p><p className="text-white font-medium">99.9%</p></div>
        </div>
      </div>

      <div className="bg-[#12121A] border border-[#FF6B6B]/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[#FF6B6B] mb-2">Zona de Perigo</h3>
        <p className="text-[#8B8B9E] text-sm mb-4">Ações irreversíveis</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => alert('Em desenvolvimento')} className="px-4 py-2 border border-[#FF6B6B]/50 rounded-lg text-[#FF6B6B] hover:bg-[#FF6B6B]/10">Limpar Cache</button>
          <button onClick={() => alert('Em desenvolvimento')} className="px-4 py-2 border border-[#FF6B6B]/50 rounded-lg text-[#FF6B6B] hover:bg-[#FF6B6B]/10">Reindexar</button>
          <button onClick={() => alert('Em desenvolvimento')} className="px-4 py-2 border border-[#FF6B6B]/50 rounded-lg text-[#FF6B6B] hover:bg-[#FF6B6B]/10">Forçar Backup</button>
        </div>
      </div>
    </div>
  );
}

