'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeftIcon,
    PlusIcon,
    ReloadIcon,
    Link2Icon,
    ExternalLinkIcon,
    CopyIcon,
    CheckIcon,
    TrashIcon
} from '@radix-ui/react-icons';
import { affiliatesApi, Affiliate, SaaSProduct, AffiliateLink } from '@/lib/api';

export default function AffiliateDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
    const [products, setProducts] = useState<SaaSProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Form para novo link
    const [newLink, setNewLink] = useState({
        productId: '',
        code: '',
        targetUrl: ''
    });

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [affData, prodData] = await Promise.all([
                affiliatesApi.findOne(id as string),
                affiliatesApi.getProducts()
            ]);
            setAffiliate(affData);
            setProducts(prodData);

            // Default new link values
            if (prodData.length > 0) {
                setNewLink(prev => ({
                    ...prev,
                    productId: prodData[0].id,
                    targetUrl: prodData[0].baseUrl
                }));
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyLink = (code: string, linkId: string) => {
        const fullUrl = `https://mecanica365.com/api/ref/${code}`;
        navigator.clipboard.writeText(fullUrl);
        setCopiedId(linkId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleCreateLink = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await affiliatesApi.createLink(id as string, newLink);
            loadData();
            setNewLink(prev => ({ ...prev, code: '' }));
        } catch (error) {
            alert('Erro ao criar link');
        }
    };

    if (isLoading || !affiliate) {
        return <div className="p-8 text-white">Carregando...</div>;
    }

    return (
        <div className="space-y-6">
            <button
                onClick={() => router.push('/affiliates')}
                className="flex items-center gap-2 text-[#8B8B9E] hover:text-white transition-colors"
            >
                <ChevronLeftIcon className="w-5 h-5" />
                Voltar para a lista
            </button>

            <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">{affiliate.name}</h1>
                    <p className="text-[#6B6B7E]">{affiliate.email}</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${affiliate.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                        {affiliate.status.toUpperCase()}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Links do Afiliado */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#12121A]/50 border border-[#1F1F28] rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Link2Icon className="w-5 h-5 text-[#FF6B6B]" />
                            Links de Afiliado
                        </h2>

                        <div className="space-y-4">
                            {affiliate.links.map((link) => (
                                <div key={link.id} className="bg-[#1A1A24] border border-[#2A2A38] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[#FF6B6B]/10 rounded-lg flex items-center justify-center">
                                            <RocketIcon className="w-5 h-5 text-[#FF6B6B]" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{link.product?.name || 'Sistema'}</p>
                                            <p className="text-[#6B6B7E] text-xs font-mono">{link.code}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleCopyLink(link.code, link.id)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-[#2A2A38] text-[#8B8B9E] hover:text-white rounded-lg transition-all text-sm"
                                        >
                                            {copiedId === link.id ? <CheckIcon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
                                            {copiedId === link.id ? 'Copiado' : 'Copiar Link'}
                                        </button>
                                        <a
                                            href={link.targetUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 text-[#6B6B7E] hover:text-white"
                                        >
                                            <ExternalLinkIcon className="w-5 h-5" />
                                        </a>
                                    </div>
                                </div>
                            ))}

                            {affiliate.links.length === 0 && (
                                <p className="text-[#6B6B7E] text-center py-4">Nenhum link gerado ainda.</p>
                            )}
                        </div>
                    </div>

                    {/* Gerar Novo Link */}
                    <div className="bg-[#12121A]/50 border border-[#1F1F28] rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Gerar Novo Link</h3>
                        <form onSubmit={handleCreateLink} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-[#8B8B9E] mb-2">Produto SaaS</label>
                                <select
                                    value={newLink.productId}
                                    onChange={(e) => {
                                        const prod = products.find(p => p.id === e.target.value);
                                        setNewLink({ ...newLink, productId: e.target.value, targetUrl: prod?.baseUrl || '' });
                                    }}
                                    className="w-full px-4 py-2.5 bg-[#1A1A24] border border-[#2A2A38] rounded-xl text-white focus:border-[#FF6B6B] outline-none"
                                >
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-[#8B8B9E] mb-2">Código Personalizado (UTM)</label>
                                <input
                                    type="text"
                                    value={newLink.code}
                                    onChange={(e) => setNewLink({ ...newLink, code: e.target.value.toUpperCase().replaceAll(/\s/g, '') })}
                                    placeholder="EX: VINICIUS365"
                                    className="w-full px-4 py-2.5 bg-[#1A1A24] border border-[#2A2A38] rounded-xl text-white focus:border-[#FF6B6B] outline-none"
                                    required
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-gradient-to-r from-[#FF6B6B] to-[#EE5A5A] rounded-xl text-white font-bold hover:shadow-lg hover:shadow-[#FF6B6B]/20 transition-all"
                                >
                                    Criar Link de Afiliado
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Sidebar Mini Metrics */}
                <div className="space-y-6">
                    <div className="bg-[#12121A]/50 border border-[#1F1F28] rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4">Dados Financeiros</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[#6B6B7E] text-xs uppercase tracking-wider mb-1">Chave PIX</p>
                                <p className="text-white font-mono bg-[#1A1A24] p-3 rounded-lg border border-[#2A2A38]">
                                    {affiliate.pixKey || 'Não informada'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[#6B6B7E] text-xs uppercase tracking-wider mb-1">CPF/CNPJ</p>
                                <p className="text-white">{affiliate.cpfCnpj || 'Não informado'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#12121A]/50 border border-[#1F1F28] rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4">Métricas Rápidas</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-[#1A1A24] rounded-xl border border-[#2A2A38]">
                                <p className="text-2xl font-bold text-emerald-400">{affiliate._count?.visits || 0}</p>
                                <p className="text-[#6B6B7E] text-xs">Cliques</p>
                            </div>
                            <div className="text-center p-3 bg-[#1A1A24] rounded-xl border border-[#2A2A38]">
                                <p className="text-2xl font-bold text-amber-400">{affiliate._count?.commissions || 0}</p>
                                <p className="text-[#6B6B7E] text-xs">Vendas</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
