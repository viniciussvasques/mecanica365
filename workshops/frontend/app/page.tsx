'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  GearIcon,
  CarIcon,
  PistonIcon,
  WrenchIcon,
  BrakePadIcon,
  OilIcon,
  FilterIcon,
  EngineIcon,
  ElevatorIcon,
  ScannerIcon,
} from '@/components/icons/MechanicIcons';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setMounted(true);
    
    // Redirecionar para /login APENAS quando houver subdomínio do cliente
    // Exemplos que devem redirecionar: cliente.mecanica365.com, foo.bar.com, cliente.localhost
    // Exemplos que NÃO devem redirecionar: mecanica365.com, www.mecanica365.com, localhost
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const parts = hostname.split('.');

      const hasSubdomain =
        // multi-level (foo.bar.com)
        parts.length >= 3 ||
        // tenant.localhost
        (parts.length === 2 && parts[1] === 'localhost' && parts[0] !== 'www');

      if (hasSubdomain) {
        const currentPath = window.location.pathname;
        if (currentPath === '/' || currentPath === '') {
          window.location.href = '/login';
          return;
        }
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: CarIcon,
      title: 'Gestão Completa de ROs',
      description: 'Controle total de ordens de serviço com histórico completo, status em tempo real e acompanhamento detalhado de cada veículo.',
      color: 'from-[#00E0B8] to-[#3ABFF8]',
    },
    {
      icon: GearIcon,
      title: 'Estoque Inteligente',
      description: 'Controle automático de peças e materiais com alertas de estoque baixo, movimentações e relatórios detalhados.',
      color: 'from-[#3ABFF8] to-[#00E0B8]',
    },
    {
      icon: ScannerIcon,
      title: 'Diagnóstico Avançado',
      description: 'Integração com scanners OBD2, histórico de diagnósticos e alertas preventivos para manutenção.',
      color: 'from-[#FFCB2B] to-[#00E0B8]',
    },
  ];

  const benefits = [
    { icon: PistonIcon, text: 'Aumente sua produtividade em até 40%' },
    { icon: WrenchIcon, text: 'Reduza custos operacionais' },
    { icon: BrakePadIcon, text: 'Melhore a satisfação dos clientes' },
    { icon: EngineIcon, text: 'Controle total da sua oficina' },
  ];

  // State for fetched plans
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Fetch plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.mecanica365.com';
        const response = await fetch(`${apiUrl}/api/plans`);
        if (response.ok) {
          const data = await response.json();
          // Transform API data to match component structure
          const transformedPlans = data.map((plan: any, idx: number) => {
            // Determine icon based on plan code
            let icon = GearIcon;
            if (plan.code.includes('starter')) icon = OilIcon;
            else if (plan.code.includes('enterprise')) icon = EngineIcon;
            
            // Build features list
            const features = [];
            if (plan.serviceOrdersLimit) {
              features.push(`${plan.serviceOrdersLimit} ROs por mês`);
            } else {
              features.push('ROs ilimitadas');
            }
            if (plan.partsLimit) {
              features.push(`${plan.partsLimit} peças no estoque`);
            } else {
              features.push('Estoque ilimitado');
            }
            if (plan.usersLimit) {
              features.push(`${plan.usersLimit} usuários`);
            } else {
              features.push('Usuários ilimitados');
            }
            if (plan.features.includes('advanced_reports')) {
              features.push('Relatórios avançados');
            }
            if (plan.features.includes('api_access')) {
              features.push('API access');
            }
            if (plan.features.includes('white_label')) {
              features.push('White label');
            }
            if (plan.features.includes('priority_support')) {
              features.push('Suporte prioritário');
            }
            if (plan.features.includes('custom_integrations')) {
              features.push('Integrações customizadas');
            }
            
            return {
              name: plan.name,
              price: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.monthlyPrice),
              period: '/mês',
              features,
              popular: plan.code.includes('professional') || plan.highlightText?.toLowerCase().includes('popular'),
              icon,
              code: plan.code,
            };
          });
          setPlans(transformedPlans);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPlans();
  }, []);

  return (
    <div className="min-h-screen bg-[#0F1115] carbon-texture">
      {/* Header */}
      <header className="bg-[#1A1E23]/80 backdrop-blur-md border-b border-[#2A3038] sticky top-0 z-50 glass-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2 group">
              <GearIcon className="text-[#00E0B8] group-hover:rotate-180 transition-transform duration-500" size={32} />
              <h1 className="text-2xl font-bold neon-turquoise">Mecânica365</h1>
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-[#7E8691] hover:text-[#00E0B8] transition-colors">Recursos</a>
              <a href="#pricing" className="text-[#7E8691] hover:text-[#00E0B8] transition-colors">Planos</a>
              <a href="#benefits" className="text-[#7E8691] hover:text-[#00E0B8] transition-colors">Benefícios</a>
              <Link
                href="/login"
                className="text-[#D0D6DE] hover:text-[#00E0B8] px-4 py-2 rounded-lg transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="bg-gradient-to-r from-[#00E0B8] to-[#3ABFF8] text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-[#00E0B8]/20 transition-all transform hover:scale-105"
              >
                Começar Grátis
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00E0B8]/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#3ABFF8]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className={`
            transform transition-all duration-1000
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}>
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-[#00E0B8]/10 border border-[#00E0B8]/30 rounded-full mb-8 animate-fade-in">
              <PistonIcon className="text-[#00E0B8]" size={20} />
              <span className="text-sm text-[#00E0B8] font-medium">Sistema Completo para Oficinas Mecânicas</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold mb-6">
              <span className="block text-[#D0D6DE] mb-2">Gerencie sua oficina</span>
              <span className="block bg-gradient-to-r from-[#00E0B8] via-[#3ABFF8] to-[#00E0B8] bg-clip-text text-transparent animate-gradient">
                de forma inteligente
              </span>
            </h1>

            <p className="max-w-3xl mx-auto text-xl text-[#7E8691] mb-10 leading-relaxed">
              Sistema completo de gestão para oficinas mecânicas. Controle de ROs, estoque, clientes, 
              agendamentos e muito mais em um só lugar. <span className="text-[#00E0B8] font-semibold">Aumente sua produtividade em até 40%.</span>
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-16">
              <Link
                href="/register"
                className="group relative px-8 py-4 bg-gradient-to-r from-[#00E0B8] to-[#3ABFF8] text-white rounded-xl text-lg font-semibold hover:shadow-2xl hover:shadow-[#00E0B8]/30 transition-all transform hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10">Começar Agora - Grátis</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#3ABFF8] to-[#00E0B8] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-[#1A1E23] border-2 border-[#00E0B8] text-[#00E0B8] rounded-xl text-lg font-semibold hover:bg-[#00E0B8]/10 transition-all transform hover:scale-105"
              >
                Já tenho conta
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { value: '40%', label: 'Aumento de Produtividade' },
                { value: '500+', label: 'Oficinas Ativas' },
                { value: '24/7', label: 'Suporte Disponível' },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 hover:border-[#00E0B8]/50 transition-all animate-scale-in"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="text-4xl font-bold text-[#00E0B8] mb-2">{stat.value}</div>
                  <div className="text-sm text-[#7E8691]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-[#1A1E23]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#D0D6DE] mb-4">
              Recursos que <span className="neon-turquoise">transformam</span> sua oficina
            </h2>
            <p className="text-xl text-[#7E8691] max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar sua oficina de forma profissional e eficiente
            </p>
          </div>

          {/* Rotating Feature */}
          <div className="mb-16">
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-2xl p-8 md:p-12 relative overflow-hidden min-h-[400px] md:min-h-[350px]">
              <div className="hud-line"></div>
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={idx}
                    className={`absolute inset-0 p-8 md:p-12 transition-all duration-500 flex items-center ${
                      activeFeature === idx
                        ? 'opacity-100 translate-y-0 z-10'
                        : 'opacity-0 translate-y-4 pointer-events-none z-0'
                    }`}
                  >
                    <div className="w-full flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
                      <div className={`bg-gradient-to-br ${feature.color} p-6 rounded-2xl shadow-lg flex-shrink-0`}>
                        <Icon className="text-white" size={64} />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
                          <h3 className="text-3xl font-bold text-[#D0D6DE]">{feature.title}</h3>
                          {/* Toggle Switch Indicator */}
                          <div className="relative inline-flex items-center">
                            <div className="relative w-12 h-6 bg-[#2A3038] rounded-full transition-colors">
                              <div className={`absolute top-1 left-1 w-4 h-4 bg-[#00E0B8] rounded-full transition-transform ${
                                activeFeature === idx ? 'translate-x-6' : 'translate-x-0'
                              }`}></div>
                            </div>
                          </div>
                        </div>
                        <p className="text-lg text-[#7E8691] leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Navigation Dots */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 bg-[#2A3038]/80 backdrop-blur-sm px-4 py-2 rounded-full">
                {features.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveFeature(idx)}
                    className={`rounded-full transition-all ${
                      activeFeature === idx 
                        ? 'bg-[#00E0B8] w-8 h-2' 
                        : 'bg-[#7E8691] w-2 h-2 hover:bg-[#00E0B8]/50'
                    }`}
                    aria-label={`Mostrar feature ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: CarIcon, title: 'Ordens de Serviço', desc: 'Controle completo de ROs com histórico e status em tempo real' },
              { icon: FilterIcon, title: 'Gestão de Estoque', desc: 'Controle de peças com alertas de estoque baixo e movimentações' },
              { icon: ElevatorIcon, title: 'Agendamentos', desc: 'Sistema completo de agendamento com calendário integrado' },
              { icon: ScannerIcon, title: 'Diagnóstico OBD2', desc: 'Integração com scanners para diagnóstico rápido e preciso' },
              { icon: BrakePadIcon, title: 'Histórico de Veículos', desc: 'Acompanhamento completo do histórico de cada veículo' },
              { icon: EngineIcon, title: 'Relatórios Avançados', desc: 'Relatórios detalhados para análise e tomada de decisão' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 hover:border-[#00E0B8]/50 transition-all group animate-scale-in"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="bg-gradient-to-br from-[#00E0B8]/20 to-[#00E0B8]/5 p-4 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="text-[#00E0B8]" size={32} />
                  </div>
                  <h3 className="text-xl font-semibold text-[#D0D6DE] mb-2">{item.title}</h3>
                  <p className="text-[#7E8691]">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-[#0F1115]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#D0D6DE] mb-4">
              Por que escolher <span className="neon-turquoise">Mecânica365</span>?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={idx}
                  className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 text-center hover:border-[#00E0B8]/50 transition-all animate-scale-in"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <Icon className="text-[#00E0B8] mx-auto mb-4" size={40} />
                  <p className="text-[#D0D6DE] font-medium">{benefit.text}</p>
                </div>
              );
            })}
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-[#00E0B8]/10 via-[#3ABFF8]/10 to-[#00E0B8]/10 border border-[#00E0B8]/30 rounded-2xl p-12 text-center relative overflow-hidden">
            <div className="hud-line"></div>
            <h3 className="text-3xl font-bold text-[#D0D6DE] mb-4">
              Pronto para transformar sua oficina?
            </h3>
            <p className="text-xl text-[#7E8691] mb-8">
              Comece hoje mesmo e veja a diferença na gestão da sua oficina
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-4 bg-gradient-to-r from-[#00E0B8] to-[#3ABFF8] text-white rounded-xl text-lg font-semibold hover:shadow-2xl hover:shadow-[#00E0B8]/30 transition-all transform hover:scale-105"
            >
              Começar Agora - Grátis
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-[#1A1E23]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#D0D6DE] mb-4">
              Planos que <span className="neon-turquoise">crescem</span> com você
            </h2>
            <p className="text-xl text-[#7E8691] max-w-2xl mx-auto">
              Escolha o plano ideal para sua oficina. Todos os planos incluem suporte e atualizações.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plansLoading ? (
              <div className="col-span-3 text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8]"></div>
                <p className="mt-4 text-[#7E8691]">Carregando planos...</p>
              </div>
            ) : plans.length === 0 ? (
              <div className="col-span-3 text-center py-12">
                <p className="text-[#7E8691]">Nenhum plano disponível no momento.</p>
              </div>
            ) : (
              plans.map((plan, idx) => {
                const Icon = plan.icon;
                return (
                  <div
                    key={idx}
                    className={`bg-[#1A1E23] border rounded-2xl p-8 relative overflow-hidden transition-all transform hover:scale-105 ${
                      plan.popular
                        ? 'border-[#00E0B8] shadow-xl shadow-[#00E0B8]/20 scale-105'
                        : 'border-[#2A3038] hover:border-[#00E0B8]/50'
                    }`}
                  >
                    {plan.popular && (
                      <>
                        <div className="hud-line"></div>
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-[#00E0B8] to-[#3ABFF8] text-white text-xs font-bold px-3 py-1 rounded-full">
                          ⭐ MAIS POPULAR
                        </div>
                      </>
                    )}
                    <div className="mb-6">
                      <Icon className={`${plan.popular ? 'text-[#00E0B8]' : 'text-[#7E8691]'} mb-4`} size={40} />
                      <h3 className="text-2xl font-bold text-[#D0D6DE] mb-2">{plan.name}</h3>
                      <div className="flex items-baseline">
                        <span className={`text-4xl font-extrabold ${plan.popular ? 'text-[#00E0B8]' : 'text-[#D0D6DE]'}`}>
                          {plan.price}
                        </span>
                        <span className="ml-2 text-[#7E8691]">{plan.period}</span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start text-[#7E8691]">
                          <svg className="w-5 h-5 text-[#00E0B8] mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={`/register?plan=${plan.code}`}
                      className={`block w-full text-center py-3 rounded-lg font-semibold transition-all ${
                        plan.popular
                          ? 'bg-gradient-to-r from-[#00E0B8] to-[#3ABFF8] text-white hover:shadow-lg hover:shadow-[#00E0B8]/20'
                          : 'bg-[#2A3038] text-[#D0D6DE] hover:bg-[#00E0B8]/10 hover:text-[#00E0B8] border border-[#2A3038] hover:border-[#00E0B8]'
                      }`}
                    >
                      Começar Agora
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F1115] border-t border-[#2A3038] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <GearIcon className="text-[#00E0B8]" size={24} />
              <span className="text-[#D0D6DE] font-semibold">Mecânica365</span>
            </div>
            <div className="text-[#7E8691] text-sm">
              © 2024 Mecânica365. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
