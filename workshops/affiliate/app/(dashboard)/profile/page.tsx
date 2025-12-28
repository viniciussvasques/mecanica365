'use client';

import {
    PersonIcon,
    ValueIcon,
    CheckCircledIcon,
    UpdateIcon
} from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';
import { affiliateApi } from '@/lib/api';

export default function AffiliateProfile() {
    const [profile, setProfile] = useState<any>({
        name: '',
        email: '',
        pixKey: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadProfile() {
            try {
                const data = await affiliateApi.getProfile();
                setProfile(data);
            } catch (error) {
                console.error('Erro ao carregar perfil:', error);
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await affiliateApi.updateProfile({ name: profile.name, pixKey: profile.pixKey });
            alert('Perfil atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar perfil:', error);
            alert('Falha ao atualizar perfil.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl space-y-8 animate-pulse text-white">
                <div className="h-8 bg-white/5 w-1/4 rounded"></div>
                <div className="h-4 bg-white/5 w-1/2 rounded"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
                    <div className="md:col-span-2 h-64 bg-white/5 rounded-3xl"></div>
                    <div className="h-64 bg-white/5 rounded-3xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
                <h1 className="text-3xl font-extrabold text-white uppercase tracking-tighter italic">Seu Perfil</h1>
                <p className="text-[#8B8B9E] mt-1">Configure suas informações pessoais e dados de pagamento.</p>
            </header>

            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-[#121214]/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] text-[#6B6B7E] font-bold uppercase tracking-widest px-1">Nome Completo</label>
                                <input
                                    type="text"
                                    value={profile.name || ''}
                                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                                    className="w-full bg-black/40 border border-white/5 px-5 py-3 rounded-2xl text-white outline-none focus:border-[#FF6B6B]/50 transition-colors"
                                    placeholder="Seu nome"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-[#6B6B7E] font-bold uppercase tracking-widest px-1">E-mail</label>
                                <input
                                    type="email"
                                    value={profile.email || ''}
                                    disabled
                                    className="w-full bg-black/20 border border-white/5 px-5 py-3 rounded-2xl text-[#6B6B7E] outline-none cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] text-[#6B6B7E] font-bold uppercase tracking-widest px-1">Chave PIX (Para Recebimento)</label>
                            <input
                                type="text"
                                value={profile.pixKey || ''}
                                onChange={e => setProfile({ ...profile, pixKey: e.target.value })}
                                className="w-full bg-black/40 border border-white/5 px-5 py-3 rounded-2xl text-white outline-none focus:border-[#FF6B6B]/50 transition-colors"
                                placeholder="CPF, E-mail, Celular ou Chave Aleatória"
                            />
                            <p className="text-[10px] text-[#6B6B7E] mt-2 italic px-1">* As comissões são pagas automaticamente via PIX todo dia 10.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-[#FF6B6B] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#FF6B6B]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? <UpdateIcon className="animate-spin" /> : <CheckCircledIcon />}
                            Salvar Alterações
                        </button>
                    </div>

                    <div className="bg-white/5 p-6 rounded-2xl border border-dashed border-white/10">
                        <p className="text-xs text-[#6B6B7E] text-center italic">Pagamentos são realizados automaticamente até o 5º dia útil de cada mês para comissões acumuladas acima de R$ 100,00.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-[#121214] border border-white/5 rounded-3xl p-8 text-center group">
                        <div className="w-20 h-20 bg-[#FF6B6B]/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <PersonIcon className="text-[#FF6B6B] w-10 h-10" />
                        </div>
                        <h2 className="text-white font-bold text-xl">{profile.name || 'Afiliado'}</h2>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-3 py-1 rounded-full mt-2 inline-block">Conta Verificada</span>
                    </div>

                    <div className="bg-gradient-to-br from-[#121214] to-black border border-white/5 rounded-3xl p-8 space-y-4">
                        <h4 className="text-white font-bold text-sm flex items-center gap-2">
                            <ValueIcon className="text-[#FF6B6B]" />
                            Resumo de Pagamentos
                        </h4>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-[#6B6B7E]">A receber</span>
                                <span className="text-white font-bold">R$ 0,00</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-[#6B6B7E]">Pago (Total)</span>
                                <span className="text-white font-bold text-emerald-400">R$ 0,00</span>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
