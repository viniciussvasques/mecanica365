'use client';

import {
    PersonIcon,
    ValueIcon,
    EnvelopeClosedIcon,
    MobileIcon,
    CheckCircledIcon
} from '@radix-ui/react-icons';

export default function AffiliateProfile() {
    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
                <h1 className="text-3xl font-extrabold text-white">Perfil e Pagamentos</h1>
                <p className="text-[#8B8B9E] mt-1">Configure seus dados pessoais e informações de recebimento.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Lado Esquerdo: Dados Pessoais */}
                <div className="bg-[#121214] border border-white/5 rounded-3xl p-8 space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <PersonIcon className="text-[#3ABFF8]" />
                        Dados Básicos
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-[#6B6B7E] uppercase font-bold tracking-widest block mb-1">Nome Completo</label>
                            <input type="text" defaultValue="Vinicius Vasques" className="w-full bg-black/30 border border-white/5 px-4 py-3 rounded-xl text-white outline-none focus:border-[#3ABFF8]/50 transition-all" />
                        </div>
                        <div>
                            <label className="text-xs text-[#6B6B7E] uppercase font-bold tracking-widest block mb-1">E-mail</label>
                            <div className="flex items-center gap-3 bg-black/10 border border-white/5 px-4 py-3 rounded-xl text-[#8B8B9E]">
                                <EnvelopeClosedIcon />
                                <span>vinicius@exemplo.com</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-[#6B6B7E] uppercase font-bold tracking-widest block mb-1">WhatsApp</label>
                            <div className="flex items-center gap-3 bg-black/30 border border-white/5 px-4 py-3 rounded-xl">
                                <MobileIcon className="text-[#8B8B9E]" />
                                <input type="text" defaultValue="(11) 99999-9999" className="bg-transparent text-white outline-none flex-1" />
                            </div>
                        </div>
                    </div>

                    <button className="w-full py-4 bg-white/5 text-white border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all">
                        Salvar Alterações
                    </button>
                </div>

                {/* Lado Direito: Dados Financeiros (PIX) */}
                <div className="bg-[#121214] border border-white/5 rounded-3xl p-8 space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <ValueIcon className="text-emerald-400" />
                        Configuração de PIX
                    </h2>

                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-start gap-4">
                        <CheckCircledIcon className="text-emerald-400 mt-1" />
                        <div>
                            <p className="text-emerald-400 text-sm font-bold">Conta Verificada</p>
                            <p className="text-[#6B6B7E] text-[10px] leading-relaxed">Suas informações de pagamento foram validadas e você está apto a receber comissões.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-[#6B6B7E] uppercase font-bold tracking-widest block mb-1">Tipo de Chave</label>
                            <select className="w-full bg-black/30 border border-white/5 px-4 py-3 rounded-xl text-white outline-none appearance-none focus:border-emerald-400/50 transition-all">
                                <option>CPF / CNPJ</option>
                                <option>E-mail</option>
                                <option>Telefone</option>
                                <option>Chave Aleatória</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-[#6B6B7E] uppercase font-bold tracking-widest block mb-1">Chave PIX</label>
                            <input type="text" defaultValue="123.456.789-00" className="w-full bg-black/30 border border-white/5 px-4 py-3 rounded-xl text-white outline-none focus:border-emerald-400/50 transition-all" />
                        </div>
                    </div>

                    <div className="pt-4">
                        <div className="bg-white/5 p-6 rounded-2xl border border-dashed border-white/10">
                            <p className="text-xs text-[#6B6B7E] text-center italic">Pagamentos são realizados automaticamente até o 5º dia útil de cada mês para comissões acumuladas acima de R$ 100,00.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
