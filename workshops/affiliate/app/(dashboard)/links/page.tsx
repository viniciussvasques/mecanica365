'use client';

import { useState } from 'react';
import {
    Link2Icon,
    CopyIcon,
    CheckIcon,
    ExternalLinkIcon,
    PlusIcon
} from '@radix-ui/react-icons';

export default function AffiliateLinks() {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const myLinks = [
        { id: '1', product: 'Mecanica365', code: 'PROMO365', clicks: 856, sales: 5, url: 'https://mecanica365.com/ref/PROMO365' },
        { id: '2', product: 'CRM Hub', code: 'VINI_CRM', clicks: 245, sales: 2, url: 'https://mecanica365.com/ref/VINI_CRM' },
    ];

    const handleCopy = (url: string, id: string) => {
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white">Meus Links</h1>
                    <p className="text-[#8B8B9E] mt-1">Gerencie e compartilhe seus códigos de rastreio.</p>
                </div>
                <button className="flex items-center justify-center gap-2 px-6 py-3 bg-[#FF6B6B] text-white rounded-xl font-bold hover:shadow-lg hover:shadow-[#FF6B6B]/20 transition-all">
                    <PlusIcon className="w-5 h-5" />
                    Gerar Novo Link
                </button>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {myLinks.map((link) => (
                    <div key={link.id} className="bg-[#121214] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#FF6B6B]/10 rounded-2xl flex items-center justify-center">
                                <Link2Icon className="text-[#FF6B6B] w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold">{link.product}</h3>
                                <code className="text-[#FF6B6B] text-xs font-mono bg-[#FF6B6B]/5 px-2 py-0.5 rounded italic">Code: {link.code}</code>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-6 md:px-8">
                            <div className="flex-1">
                                <p className="text-[#6B6B7E] text-[10px] uppercase font-bold tracking-widest mb-1">Link de Indicação</p>
                                <div className="flex items-center gap-2 bg-black/30 p-2 rounded-lg border border-white/5 group">
                                    <span className="text-[#8B8B9E] text-xs truncate flex-1">{link.url}</span>
                                    <button
                                        onClick={() => handleCopy(link.url, link.id)}
                                        className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
                                    >
                                        {copiedId === link.id ? <CheckIcon className="text-emerald-400" /> : <CopyIcon className="text-[#8B8B9E]" />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 pr-4">
                                <div className="text-center">
                                    <p className="text-white font-bold">{link.clicks}</p>
                                    <p className="text-[#6B6B7E] text-[10px] uppercase font-bold tracking-tighter">Cliques</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-emerald-400 font-bold">{link.sales}</p>
                                    <p className="text-[#6B6B7E] text-[10px] uppercase font-bold tracking-tighter">Vendas</p>
                                </div>
                            </div>
                        </div>

                        <button className="p-2 text-[#6B6B7E] hover:text-white transition-colors">
                            <ExternalLinkIcon className="w-5 h-5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
