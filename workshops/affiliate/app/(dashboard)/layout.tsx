'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    DashboardIcon,
    Link2Icon,
    RocketIcon,
    ExitIcon,
    PersonIcon
} from '@radix-ui/react-icons';

export default function AffiliateDashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [mounted] = useState(true);

    if (!mounted) return <div className="min-h-screen bg-[#0A0A0D] flex items-center justify-center text-white font-sans">Carregando Hub de Afiliados...</div>;

    const menuItems = [
        { label: 'Visão Geral', href: '/', icon: DashboardIcon },
        { label: 'Meus Links', href: '/links', icon: Link2Icon },
        { label: 'Catálogo SaaS', href: '/products', icon: RocketIcon },
        { label: 'Perfil e PIX', href: '/profile', icon: PersonIcon },
    ];

    return (
        <div className="min-h-screen bg-[#0A0A0B] text-[#D0D6DE] flex flex-col md:flex-row font-sans">
            {/* Sidebar Afiliado */}
            <aside className="w-full md:w-64 bg-[#121214] border-r border-white/5 p-6 flex flex-col gap-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B6B] to-[#EE5A5A] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF6B6B]/20">
                        <RocketIcon className="text-white w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Affiliate Hub</h2>
                </div>

                <nav className="flex-1 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-[#FF6B6B]/10 text-white border border-[#FF6B6B]/20' : 'text-[#8B8B9E] hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${active ? 'text-[#FF6B6B]' : ''}`} />
                                <span className="font-medium text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <button className="flex items-center gap-3 px-4 py-3 text-[#6B6B7E] hover:text-red-400 transition-colors">
                    <ExitIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">Sair do Hub</span>
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-6 md:p-10">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
