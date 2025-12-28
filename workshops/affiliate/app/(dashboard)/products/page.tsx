'use client';

import {
    RocketIcon,
    ExternalLinkIcon,
    PlusIcon
} from '@radix-ui/react-icons';

export default function AffiliateProducts() {
    const products = [
        {
            id: '1',
            name: 'Mecanica365',
            description: 'O sistema #1 para gestão de oficinas mecânicas no Brasil.',
            commission: '30% recorrente',
            features: ['Gestão de ROs', 'Estoque Inteligente', 'App para Mecânicos'],
            image: 'https://images.unsplash.com/photo-1599256621730-535171e28e50?q=80&w=200&h=200&auto=format&fit=crop'
        },
        {
            id: '2',
            name: 'CRM Hub',
            description: 'Potencialize suas vendas com o CRM mais completo do mercado.',
            commission: '25% recorrente',
            features: ['Automação de WhatsApp', 'Funil de Vendas', 'IA para Atendimento'],
            image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=200&h=200&auto=format&fit=crop'
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
                <h1 className="text-3xl font-extrabold text-white">Catálogo de Produtos</h1>
                <p className="text-[#8B8B9E] mt-1">Conheça os sistemas que você pode promover e ganhar comissões.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products.map((product) => (
                    <div key={product.id} className="bg-[#121214] border border-white/5 rounded-3xl overflow-hidden hover:border-white/10 transition-all flex flex-col group">
                        <div className="aspect-video relative overflow-hidden">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent"></div>
                            <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">
                                {product.commission}
                            </div>
                        </div>

                        <div className="p-8 flex-1 flex flex-col">
                            <h2 className="text-2xl font-bold text-white mb-3">{product.name}</h2>
                            <p className="text-[#8B8B9E] text-sm mb-6 leading-relaxed">{product.description}</p>

                            <div className="space-y-3 mb-8">
                                {product.features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-[#D0D6DE]">
                                        <div className="w-1.5 h-1.5 bg-[#FF6B6B] rounded-full"></div>
                                        {feature}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-auto flex gap-3">
                                <button className="flex-1 py-3 bg-[#FF6B6B] text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-[#FF6B6B]/20 transition-all">
                                    Promover Agora
                                </button>
                                <button className="p-3 border border-white/5 rounded-xl text-[#8B8B9E] hover:text-white transition-all">
                                    <ExternalLinkIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
