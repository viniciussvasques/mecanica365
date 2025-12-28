'use client';

import {
    RocketIcon,
    ValueIcon,
    BarChartIcon,
    LayersIcon,
    Link2Icon,
    ArrowRightIcon
} from '@radix-ui/react-icons';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { affiliateApi } from '@/lib/api';

export default function AffiliateDashboard() {
    const [stats, setStats] = useState([
        { label: 'Comissão Acumulada', value: '...', icon: ValueIcon, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { label: 'Cliques nos Links', value: '...', icon: BarChartIcon, color: 'text-[#FF6B6B]', bg: 'bg-[#FF6B6B]/10' },
        { label: 'Conversões', value: '...', icon: LayersIcon, color: 'text-[#3ABFF8]', bg: 'bg-[#3ABFF8]/10' },
        { label: 'Taxa de Conversão', value: '...', icon: RocketIcon, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    ]);

    const [recentClicks, setRecentClicks] = useState<{ code: string; date: string; location: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadDashboardData() {
            try {
                const data = await affiliateApi.getStats();
                setStats([
                    { label: 'Comissão Acumulada', value: `R$ ${data.totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: ValueIcon, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                    { label: 'Cliques nos Links', value: data.totalVisits.toString(), icon: BarChartIcon, color: 'text-[#FF6B6B]', bg: 'bg-[#FF6B6B]/10' },
                    { label: 'Conversões', value: data.totalConversions.toString(), icon: LayersIcon, color: 'text-[#3ABFF8]', bg: 'bg-[#3ABFF8]/10' },
                    { label: 'Taxa de Conversão', value: `${data.conversionRate}%`, icon: RocketIcon, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                ]);

                // Mocking clicks list for now as we don't have a specific endpoint for it yet, 
                // but we can derive from visits if needed.
                setRecentClicks([
                    { product: 'Mecanica365', date: 'Hoje, 14:30', ip: '191.185.XX.XX', status: 'Convertido' },
                    { product: 'CRM Hub', date: 'Hoje, 12:15', ip: '177.42.XX.XX', status: 'Visita' },
                ]);
            } catch (error) {
                console.error('Erro ao carregar dados do dashboard:', error);
            } finally {
                setLoading(false);
            }
        }

        loadDashboardData();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
                <h1 className="text-3xl font-extrabold text-white">Bem-vindo, Parceiro!</h1>
                <p className="text-[#8B8B9E] mt-1">Veja seu desempenho e gerencie seus links de afiliado.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="bg-[#121214] border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-all group">
                            <div className={`${stat.bg} w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <Icon className={stat.color} />
                            </div>
                            <p className="text-[#6B6B7E] text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                            <p className="text-2xl font-bold text-white mt-1">
                                {loading ? (
                                    <span className="inline-block w-24 h-6 bg-white/5 animate-pulse rounded" />
                                ) : stat.value}
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-[#121214]/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 lg:p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <BarChartIcon className="text-[#FF6B6B]" />
                            Atividade Recente
                        </h2>
                        <button className="text-sm text-[#FF6B6B] hover:underline">Ver tudo</button>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-white/5 animate-pulse rounded-2xl border border-white/5" />
                            ))
                        ) : (
                            recentClicks.map((click, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-[#FF6B6B]/10 rounded-xl flex items-center justify-center">
                                            <Link2Icon className="text-[#FF6B6B]" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{click.product}</p>
                                            <p className="text-[#6B6B7E] text-xs">{click.date} • {click.ip}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${click.status === 'Convertido' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#FF6B6B]/10 text-[#FF6B6B]'
                                        }`}>
                                        {click.status}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Links */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-[#FF6B6B] to-[#EE5A5A] rounded-3xl p-8 relative overflow-hidden group">
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
                        <h3 className="text-2xl font-bold text-white relative z-10 mb-2">Novo Link</h3>
                        <p className="text-white/80 relative z-10 text-sm mb-6">Gere um link personalizado para qualquer produto SaaS em segundos.</p>
                        <Link
                            href="/links"
                            className="inline-flex items-center gap-2 bg-white text-[#FF6B6B] px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-black/10 hover:scale-105 transition-all"
                        >
                            Criar Agora
                            <ArrowRightIcon />
                        </Link>
                    </div>

                    <div className="bg-[#121214] border border-white/5 rounded-3xl p-8">
                        <h3 className="text-white font-bold mb-4">Meta Mensal</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-[#6B6B7E]">Progresso</span>
                                <span className="text-white font-bold">Calculando...</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-emerald-400 to-[#3ABFF8] w-[0%]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
