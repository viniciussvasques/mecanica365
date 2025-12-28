'use client';

import {
    RocketIcon,
    LayersIcon,
    ArrowRightIcon,
} from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';
import { affiliateApi } from '@/lib/api';

interface Product {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
}

export default function AffiliateProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProducts() {
            try {
                const data = await affiliateApi.getProducts();
                setProducts(data);
            } catch (error) {
                console.error('Erro ao carregar produtos:', error);
            } finally {
                setLoading(false);
            }
        }
        loadProducts();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
                <h1 className="text-3xl font-extrabold text-white uppercase tracking-tighter italic">Catálogo SaaS</h1>
                <p className="text-[#8B8B9E] mt-1">Produtos disponíveis para você promover e lucrar.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                    [1, 2].map(i => (
                        <div key={i} className="h-64 bg-white/5 animate-pulse rounded-3xl border border-white/5" />
                    ))
                ) : products.map((product, i) => (
                    <div key={i} className="bg-[#121214]/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-all group overflow-hidden relative">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FF6B6B]/5 rounded-full blur-3xl group-hover:bg-[#FF6B6B]/10 transition-colors"></div>

                        <div className="flex items-start justify-between mb-6 relative z-10">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#FF6B6B] to-[#EE5A5A] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF6B6B]/20">
                                <RocketIcon className="text-white w-8 h-8" />
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-[#FF6B6B] uppercase tracking-widest bg-[#FF6B6B]/10 px-2 py-1 rounded-full">Recorrente</span>
                                <p className="text-white font-bold text-2xl mt-2">10% <small className="text-xs text-[#8B8B9E] font-normal">/mês</small></p>
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2">{product.name}</h3>
                        <p className="text-[#8B8B9E] text-sm mb-8 leading-relaxed">
                            {product.description || 'Promova nossa solução líder de mercado e garanta comissões mensais vitalícias enquanto o cliente estiver ativo.'}
                        </p>

                        <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
                            <ul className="flex items-center gap-4">
                                <li className="flex items-center gap-1 text-[10px] text-[#6B6B7E] font-bold uppercase tracking-tighter">
                                    <LayersIcon className="w-3 h-3" />
                                    Marketing Kit
                                </li>
                            </ul>
                            <button className="flex items-center gap-2 text-white font-bold text-sm bg-white/5 hover:bg-[#FF6B6B] px-5 py-2.5 rounded-xl transition-all group/btn">
                                Promover agora
                                <ArrowRightIcon className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
