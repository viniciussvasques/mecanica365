'use client';

import { useState, useEffect } from 'react';
import {
    MagnifyingGlassIcon,
    PlusIcon,
    ReloadIcon,
    DotsHorizontalIcon,
    CheckCircledIcon,
    CrossCircledIcon,
    PersonIcon,
    Link2Icon,
    CardStackIcon,
    CalendarIcon,
    RocketIcon
} from '@radix-ui/react-icons';
import { affiliatesApi, Affiliate } from '@/lib/api';

function StatusBadge({ status }: Readonly<{ status: string }>) {
    const config: Record<string, { color: string; label: string; icon: string }> = {
        active: { color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', label: 'Ativo', icon: '✓' },
        pending: { color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', label: 'Pendente', icon: '⏳' },
        blocked: { color: 'bg-red-500/10 text-red-400 border border-red-500/20', label: 'Bloqueado', icon: '✕' },
    };
    const c = config[status] || { color: 'bg-gray-500/10 text-gray-400 border border-gray-500/20', label: status, icon: '?' };
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${c.color}`}>
            <span>{c.icon}</span>
            {c.label}
        </span>
    );
}

function CreateModal({ isOpen, onClose, onSubmit }: Readonly<{ isOpen: boolean; onClose: () => void; onSubmit: (data: any) => Promise<void> }>) {
    const [formData, setFormData] = useState({ name: '', email: '', cpfCnpj: '', pixKey: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            setFormData({ name: '', email: '', cpfCnpj: '', pixKey: '' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#12121A] border border-[#1F1F28] rounded-2xl w-full max-w-md shadow-2xl">
                <div className="p-6 border-b border-[#1F1F28]">
                    <h2 className="text-xl font-bold text-white">Novo Afiliado</h2>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm text-[#8B8B9E] mb-1">Nome Completo</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-xl text-white outline-none focus:border-[#FF6B6B]"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-[#8B8B9E] mb-1">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-xl text-white outline-none focus:border-[#FF6B6B]"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-[#8B8B9E] mb-1">CPF ou CNPJ</label>
                        <input
                            type="text"
                            value={formData.cpfCnpj}
                            onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                            className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-xl text-white outline-none focus:border-[#FF6B6B]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-[#8B8B9E] mb-1">Chave PIX (Para Pagamentos)</label>
                        <input
                            type="text"
                            value={formData.pixKey}
                            onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                            className="w-full px-4 py-2 bg-[#1A1A24] border border-[#2A2A38] rounded-xl text-white outline-none focus:border-[#FF6B6B]"
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-[#2A2A38] text-[#8B8B9E] hover:bg-[#1A1A24]">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#EE5A5A] rounded-xl text-white font-bold disabled:opacity-50">
                            {isSubmitting ? 'Salvando...' : 'Cadastrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AffiliatesPage() {
    const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
    const [filtered, setFiltered] = useState<Affiliate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const router = useRouter(); // Initialize useRouter

    useEffect(() => { loadAffiliates(); }, []);
    useEffect(() => { filterAffiliates(); }, [affiliates, search, statusFilter]);

    const loadAffiliates = async () => {
        try {
            setIsLoading(true);
            const data = await affiliatesApi.findAll();
            setAffiliates(data);
        } catch (error) {
            console.error('Erro ao carregar afiliados:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterAffiliates = () => {
        let result = [...affiliates];
        if (search) {
            const term = search.toLowerCase();
            result = result.filter(a => a.name.toLowerCase().includes(term) || a.email.toLowerCase().includes(term));
        }
        if (statusFilter !== 'all') result = result.filter(a => a.status === statusFilter);
        setFiltered(result);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#FF6B6B]/20 border-t-[#FF6B6B] rounded-full animate-spin" />
                    <p className="text-[#6B6B7E]">Carregando afiliados...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white">Afiliados</h1>
                    <p className="text-[#6B6B7E] mt-2">Gerencie seus parceiros e links de indicação</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FF6B6B] to-[#EE5A5A] rounded-xl text-white font-medium hover:shadow-lg hover:shadow-[#FF6B6B]/20 transition-all"
                >
                    <PlusIcon className="w-5 h-5" />
                    Novo Afiliado
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#12121A]/50 rounded-xl p-5 border border-[#1F1F28]/50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center">
                            <PersonIcon className="w-4 h-4 text-blue-400" />
                        </div>
                        <p className="text-[#6B6B7E] text-sm">Total de Afiliados</p>
                    </div>
                    <p className="text-3xl font-bold text-white">{affiliates.length}</p>
                </div>
                <div className="bg-[#12121A]/50 rounded-xl p-5 border border-[#1F1F28]/50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                            <RocketIcon className="w-4 h-4 text-emerald-400" />
                        </div>
                        <p className="text-[#6B6B7E] text-sm">Visitas Registradas</p>
                    </div>
                    <p className="text-3xl font-bold text-emerald-400">
                        {affiliates.reduce((acc, a) => acc + (a._count?.visits || 0), 0)}
                    </p>
                </div>
                <div className="bg-[#12121A]/50 rounded-xl p-5 border border-[#1F1F28]/50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center">
                            <CardStackIcon className="w-4 h-4 text-amber-400" />
                        </div>
                        <p className="text-[#6B6B7E] text-sm">Comissões Totais</p>
                    </div>
                    <p className="text-3xl font-bold text-amber-400">
                        {affiliates.reduce((acc, a) => acc + (a._count?.commissions || 0), 0)}
                    </p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6B7E]" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[#12121A] border border-[#1F1F28] rounded-xl text-white placeholder-[#6B6B7E] focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/20 transition-all"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 bg-[#12121A] border border-[#1F1F28] rounded-xl text-white focus:border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/20 transition-all min-w-[150px]"
                >
                    <option value="all">Todos os Status</option>
                    <option value="active">Ativos</option>
                    <option value="pending">Pendentes</option>
                    <option value="blocked">Bloqueados</option>
                </select>
                <button
                    onClick={loadAffiliates}
                    className="px-4 py-3 bg-[#12121A] border border-[#1F1F28] rounded-xl text-[#8B8B9E] hover:text-white hover:border-[#FF6B6B] transition-all"
                >
                    <ReloadIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Affiliates Table */}
            <div className="bg-[#12121A]/30 border border-[#1F1F28]/50 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="border-b border-[#1F1F28]/50">
                                <th className="px-6 py-4 text-left text-xs font-medium text-[#6B6B7E] uppercase tracking-wider">Afiliado</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-[#6B6B7E] uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-center text-xs font-medium text-[#6B6B7E] uppercase tracking-wider">Links</th>
                                <th className="px-6 py-4 text-center text-xs font-medium text-[#6B6B7E] uppercase tracking-wider">Métricas</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-[#6B6B7E] uppercase tracking-wider">Cadastrado em</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-[#6B6B7E] uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1F1F28]/30">
                            {filtered.map((affiliate) => (
                                <tr key={affiliate.id} className="hover:bg-[#12121A]/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-white font-medium">{affiliate.name}</p>
                                            <p className="text-[#6B6B7E] text-xs">{affiliate.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={affiliate.status} />
                                    </td>
                                    <td className="px-6 py-4 text-center text-white">
                                        {affiliate.links?.length || 0}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-emerald-400 text-sm font-medium">{affiliate._count?.visits || 0} visitas</span>
                                            <span className="text-amber-400 text-xs">{affiliate._count?.commissions || 0} vendas</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-[#6B6B7E] text-sm">
                                            <CalendarIcon className="w-3.5 h-3.5" />
                                            {new Date(affiliate.createdAt).toLocaleDateString('pt-BR')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => router.push(`/affiliates/${affiliate.id}`)}
                                            className="p-2 hover:bg-[#2A2A38] rounded-lg transition-colors"
                                        >
                                            <DotsHorizontalIcon className="w-5 h-5 text-[#8B8B9E]" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <p className="text-[#6B6B7E]">Nenhum afiliado encontrado</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <CreateModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={async (data) => {
                    await affiliatesApi.create(data);
                    setIsModalOpen(false);
                    loadAffiliates();
                }}
            />
        </div>
    );
}
