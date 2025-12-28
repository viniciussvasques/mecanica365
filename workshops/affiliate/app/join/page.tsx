'use client';

import {
    RocketIcon,
    ValueIcon,
    BarChartIcon,
    CheckIcon,
    ChevronRightIcon
} from '@radix-ui/react-icons';
import Link from 'next/link';

export default function AffiliateJoin() {
    return (
        <div className="min-h-screen bg-[#0A0A0B] text-white font-sans">
            {/* Hero Section */}
            <section className="relative pt-20 pb-20 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-[#FF6B6B]/10 to-transparent blur-3xl opacity-50"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 rounded-full text-[#FF6B6B] text-xs font-bold uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
                        <RocketIcon />
                        Programa de Parcerias Mecanica365
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tighter bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
                        Transforme sua rede em <br /> <span className="text-[#FF6B6B]">renda recorrente.</span>
                    </h1>

                    <p className="text-xl text-[#8B8B9E] max-w-2xl mx-auto mb-12 leading-relaxed">
                        Seja um parceiro do sistema #1 para oficinas mecânicas no Brasil e ganhe <span className="text-white font-bold">30% de comissão mensal</span> sobre cada venda indicada.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button className="px-10 py-5 bg-[#FF6B6B] text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-[#FF6B6B]/30 hover:scale-105 transition-all flex items-center gap-2 group">
                            Começar Agora Gratuitamente
                            <ChevronRightIcon className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <Link href="/" className="px-10 py-5 border border-white/10 hover:border-white/20 rounded-2xl font-bold text-lg transition-all">
                            Já sou afiliado
                        </Link>
                    </div>
                </div>
            </section>

            {/* Benefits Grid */}
            <section className="py-24 bg-[#0F0F12]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-10 bg-[#121214] border border-white/5 rounded-3xl hover:border-[#FF6B6B]/30 transition-all group">
                            <div className="w-12 h-12 bg-[#FF6B6B]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <ValueIcon className="text-[#FF6B6B] w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-4 italic">Altas Comissões</h3>
                            <p className="text-[#8B8B9E] text-sm leading-relaxed">
                                Ganhe uma porcentagem agressiva sobre cada assinatura ativada por você. Pagamentos regulares via PIX.
                            </p>
                        </div>

                        <div className="p-10 bg-[#121214] border border-white/5 rounded-3xl hover:border-[#FF6B6B]/30 transition-all group">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <BarChartIcon className="text-emerald-500 w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-4 italic">Painel em Tempo Real</h3>
                            <p className="text-[#8B8B9E] text-sm leading-relaxed">
                                Acompanhe cada clique, visita e conversão em um dashboard exclusivo. Transparência total sobre seus ganhos.
                            </p>
                        </div>

                        <div className="p-10 bg-[#121214] border border-white/5 rounded-3xl hover:border-[#FF6B6B]/30 transition-all group">
                            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <RocketIcon className="text-amber-500 w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-4 italic">Suporte e Material</h3>
                            <p className="text-[#8B8B9E] text-sm leading-relaxed">
                                Tenha acesso a criativos, vídeos e treinamentos para ajudar você a converter mais e crescer sua base.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Signup Form / CTA Mini */}
            <section className="py-24">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold mb-12">Pronto para começar?</h2>
                    <div className="bg-[#121214] border border-white/5 p-8 md:p-12 rounded-[2rem] shadow-2xl relative">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                            <div className="space-y-6">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-emerald-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                                        <CheckIcon className="text-emerald-500" />
                                    </div>
                                    <p className="text-sm text-[#8B8B9E]">Sem taxa de adesão ou mensalidades.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-emerald-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                                        <CheckIcon className="text-emerald-500" />
                                    </div>
                                    <p className="text-sm text-[#8B8B9E]">Cookies com validade de 30 dias.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-emerald-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                                        <CheckIcon className="text-emerald-500" />
                                    </div>
                                    <p className="text-sm text-[#8B8B9E]">Pagamentos via PIX automatizados.</p>
                                </div>
                            </div>
                            <div className="flex flex-col justify-center gap-4">
                                <input type="text" placeholder="Seu melhor e-mail" className="bg-black/30 border border-white/5 px-6 py-4 rounded-xl focus:border-[#FF6B6B]/50 transition-all outline-none" />
                                <button className="bg-white text-black py-4 rounded-xl font-bold hover:bg-[#FF6B6B] hover:text-white transition-all">
                                    Quero me inscrever
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 text-center text-[#6B6B7E] text-sm">
                &copy; 2024 Mecanica365. Todos os direitos reservados.
            </footer>
        </div>
    );
}
