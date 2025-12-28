'use client';

import { useEffect, useState } from 'react';
import {
    Link2Icon,
    CopyIcon,
    ExternalLinkIcon,
    PlusIcon,
} from '@radix-ui/react-icons';
import { affiliateApi } from '@/lib/api';

interface LinkData {
    name: string;
    code: string;
    clicks: number;
    sales: number;
    url: string;
}

interface ApiLink {
    product: { name: string; baseUrl: string };
    code: string;
    _count: { visits: number; commissions: number };
}

export default function AffiliateLinks() {
    const [links, setLinks] = useState<LinkData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadLinks() {
            try {
                const data = await affiliateApi.getLinks();
                setLinks(data.map((l: ApiLink) => ({
                    name: l.product.name,
                    code: l.code,
                    clicks: l._count.visits,
                    sales: l._count.commissions,
                    url: `${l.product.baseUrl}/ref/${l.code}`
                })));
            } catch (error) {
                console.error('Erro ao carregar links:', error);
            } finally {
                setLoading(false);
            }
        }
        loadLinks();
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-white uppercase tracking-tighter italic">Meus Links</h1>
                    <p className="text-[#8B8B9E] mt-1">Gerencie e acompanhe o desempenho dos seus links de indicação.</p>
                </div>
                <button className="bg-[#FF6B6B] text-white px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-[#FF6B6B]/20 flex items-center gap-2">
                    <PlusIcon />
                    Novo Link
                </button>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    [1, 2].map(i => (
                        <div key={i} className="h-24 bg-white/5 animate-pulse rounded-3xl border border-white/5" />
                    ))
                ) : links.map((link, i) => (
                    <div key={i} className="bg-[#121214]/50 backdrop-blur-xl border border-white/5 p-6 rounded-3xl hover:border-white/10 transition-all group">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#FF6B6B]/10 rounded-2xl flex items-center justify-center">
                                    <Link2Icon className="text-[#FF6B6B] w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg">{link.name}</h3>
                                    <p className="text-[#6B6B7E] text-xs font-mono">{link.code}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="text-center">
                                    <p className="text-[#6B6B7E] text-[10px] uppercase font-bold tracking-widest">Cliques</p>
                                    <p className="text-white font-bold text-lg">{link.clicks}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[#6B6B7E] text-[10px] uppercase font-bold tracking-widest">Vendas</p>
                                    <p className="text-white font-bold text-lg">{link.sales}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-black/40 border border-white/5 px-4 py-2 rounded-xl text-xs text-[#8B8B9E] font-mono truncate max-w-[300px]">
                                    {link.url}
                                </div>
                                <button
                                    onClick={() => copyToClipboard(link.url)}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
                                    title="Copiar Link"
                                >
                                    <CopyIcon />
                                </button>
                                <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-[#FF6B6B] hover:bg-[#EE5A5A] rounded-lg text-white transition-colors"
                                    title="Abrir Link"
                                >
                                    <ExternalLinkIcon />
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
