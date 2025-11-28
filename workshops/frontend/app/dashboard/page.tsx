'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChangePasswordModal } from '@/components/ChangePasswordModal';

export const dynamic = 'force-dynamic';
import {
  CarIcon,
  PistonIcon,
  WrenchIcon,
  GearIcon,
  BrakePadIcon,
  OilIcon,
  FilterIcon,
  EngineIcon,
  ElevatorIcon,
  ScannerIcon,
  BellIcon,
} from '@/components/icons/MechanicIcons';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    const subdomain = searchParams.get('subdomain') || localStorage.getItem('subdomain');

    if (!token) {
      router.push('/login');
      return;
    }

    // Verificar se é primeiro login ou se deve mostrar modal
    const isFirstLogin = localStorage.getItem('isFirstLogin') === 'true' || 
                         searchParams.get('firstLogin') === 'true' ||
                         localStorage.getItem('showPasswordModal') === 'true';
    
    const userId = localStorage.getItem('userId');
    const passwordChangedKey = userId ? `passwordChanged_${userId}` : null;
    const alreadyChanged = passwordChangedKey ? localStorage.getItem(passwordChangedKey) : null;
    
    if (isFirstLogin && !alreadyChanged) {
      setShowChangePasswordModal(true);
      localStorage.removeItem('isFirstLogin');
      localStorage.removeItem('showPasswordModal');
    }

    setTimeout(() => {
      setUser({
        name: 'Admin',
        email: 'admin@oficina.com',
        role: 'admin',
      });
      setLoading(false);
    }, 1000);
  }, [router, searchParams]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('subdomain');
    localStorage.removeItem('userId');
    localStorage.removeItem('isFirstLogin');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#2A3038] border-t-[#00E0B8] mx-auto"></div>
          <p className="mt-4 text-[#7E8691]">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] carbon-texture">
      {/* Header */}
      <header className="bg-[#1A1E23] border-b border-[#2A3038] sticky top-0 z-50 glass-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <GearIcon className="text-[#00E0B8]" size={28} />
                <h1 className="text-2xl font-bold neon-turquoise">Mecânica365</h1>
              </Link>
              <nav className="hidden md:flex space-x-1">
                <Link
                  href="/dashboard"
                  className="text-[#D0D6DE] hover:text-[#00E0B8] px-4 py-2 rounded-lg text-sm font-medium bg-[#2A3038] transition-all"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/service-orders"
                  className="text-[#7E8691] hover:text-[#00E0B8] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2A3038] transition-all"
                >
                  Ordens de Serviço
                </Link>
                <Link
                  href="/dashboard/customers"
                  className="text-[#7E8691] hover:text-[#00E0B8] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2A3038] transition-all"
                >
                  Clientes
                </Link>
                <Link
                  href="/dashboard/parts"
                  className="text-[#7E8691] hover:text-[#00E0B8] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2A3038] transition-all"
                >
                  Peças
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3 px-4 py-2 bg-[#2A3038] rounded-lg">
                <ElevatorIcon className="text-[#00E0B8]" size={18} />
                <span className="text-sm text-[#D0D6DE]">
                  <span className="text-[#00E0B8]">Elevador 3</span> ocupado / <span className="text-[#00E0B8]">2</span> livres
                </span>
              </div>
              <button className="relative p-2 text-[#7E8691] hover:text-[#00E0B8] transition-colors">
                <BellIcon size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF4E3D] rounded-full"></span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-[#D0D6DE]">{user?.name}</p>
                  <p className="text-xs text-[#7E8691]">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-[#2A3038] hover:bg-[#3ABFF8] text-[#D0D6DE] hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className={`mb-8 transform transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 className="text-3xl font-bold text-[#D0D6DE] mb-2">
            Bem-vindo, {user?.name}! 👋
          </h2>
          <p className="text-[#7E8691]">
            Visão geral da sua oficina hoje
          </p>
        </div>

        {/* SEÇÃO 1 - VISÃO RÁPIDA (CARDS GRANDES) */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 transform transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Card 1: Carros no pátio */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 shadow-lg hover:shadow-xl hover:border-[#00E0B8]/50 transition-all duration-300 group relative overflow-hidden">
            <div className="hud-line"></div>
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gradient-to-br from-[#00E0B8]/20 to-[#00E0B8]/5 p-3 rounded-lg">
                <CarIcon className="text-[#00E0B8]" size={28} />
              </div>
              <span className="text-xs text-[#7E8691] bg-[#2A3038] px-2 py-1 rounded">Hoje</span>
            </div>
            <h3 className="text-lg font-semibold text-[#D0D6DE] mb-1">Carros no Pátio</h3>
            <p className="text-3xl font-bold text-[#00E0B8] mb-2">12</p>
            <div className="space-y-1 text-xs text-[#7E8691]">
              <div className="flex justify-between">
                <span>3 aguardando diagnóstico</span>
                <span className="text-[#FFCB2B]">3</span>
              </div>
              <div className="flex justify-between">
                <span>5 em serviço</span>
                <span className="text-[#3ABFF8]">5</span>
              </div>
              <div className="flex justify-between">
                <span>4 prontos para entrega</span>
                <span className="text-[#00E0B8]">4</span>
              </div>
            </div>
          </div>

          {/* Card 2: Orçamentos */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 shadow-lg hover:shadow-xl hover:border-[#3ABFF8]/50 transition-all duration-300 group relative overflow-hidden">
            <div className="hud-line"></div>
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gradient-to-br from-[#3ABFF8]/20 to-[#3ABFF8]/5 p-3 rounded-lg">
                <PistonIcon className="text-[#3ABFF8]" size={28} />
              </div>
              <span className="text-xs text-[#7E8691] bg-[#2A3038] px-2 py-1 rounded">Este mês</span>
            </div>
            <h3 className="text-lg font-semibold text-[#D0D6DE] mb-1">Orçamentos</h3>
            <p className="text-3xl font-bold text-[#3ABFF8] mb-2">34</p>
            <div className="space-y-1 text-xs text-[#7E8691]">
              <div className="flex justify-between">
                <span>12 aprovados</span>
                <span className="text-[#00E0B8]">12</span>
              </div>
              <div className="flex justify-between">
                <span>7 recusados</span>
                <span className="text-[#FF4E3D]">7</span>
              </div>
              <div className="flex justify-between">
                <span>15 pendentes</span>
                <span className="text-[#FFCB2B]">15</span>
              </div>
            </div>
          </div>

          {/* Card 3: Horários / Equipe */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 shadow-lg hover:shadow-xl hover:border-[#FFCB2B]/50 transition-all duration-300 group relative overflow-hidden">
            <div className="hud-line"></div>
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gradient-to-br from-[#FFCB2B]/20 to-[#FFCB2B]/5 p-3 rounded-lg">
                <WrenchIcon className="text-[#FFCB2B]" size={28} />
              </div>
              <span className="text-xs text-[#7E8691] bg-[#2A3038] px-2 py-1 rounded">Agora</span>
            </div>
            <h3 className="text-lg font-semibold text-[#D0D6DE] mb-1">Equipe</h3>
            <p className="text-3xl font-bold text-[#FFCB2B] mb-2">6</p>
            <div className="space-y-1 text-xs text-[#7E8691]">
              <div className="flex justify-between">
                <span>Mecânicos ativos</span>
                <span className="text-[#00E0B8]">6</span>
              </div>
              <div className="mt-2 pt-2 border-t border-[#2A3038]">
                <span className="text-[#7E8691]">Próxima:</span>
                <p className="text-[#D0D6DE] font-medium">Honda Civic às 14h</p>
              </div>
            </div>
          </div>

          {/* Card 4: Faturamento */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 shadow-lg hover:shadow-xl hover:border-[#00E0B8]/50 transition-all duration-300 group relative overflow-hidden">
            <div className="hud-line"></div>
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gradient-to-br from-[#00E0B8]/20 to-[#00E0B8]/5 p-3 rounded-lg">
                <GearIcon className="text-[#00E0B8]" size={28} />
              </div>
              <span className="text-xs text-[#7E8691] bg-[#2A3038] px-2 py-1 rounded">Nov 2025</span>
            </div>
            <h3 className="text-lg font-semibold text-[#D0D6DE] mb-1">Faturamento</h3>
            <p className="text-3xl font-bold text-[#00E0B8] mb-2">R$ 5.980</p>
            <div className="space-y-1 text-xs text-[#7E8691]">
              <div className="flex justify-between">
                <span>Hoje</span>
                <span className="text-[#00E0B8]">R$ 5.980</span>
              </div>
              <div className="flex justify-between">
                <span>Este mês</span>
                <span className="text-[#00E0B8]">R$ 40.200</span>
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO 2 - AGENDA DO DIA */}
        <div className={`bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 shadow-lg mb-8 transform transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-[#D0D6DE] flex items-center space-x-2">
              <GearIcon className="text-[#00E0B8]" size={20} />
              <span>Agenda do Dia</span>
            </h3>
            <span className="text-sm text-[#7E8691]">28 de Novembro, 2025</span>
          </div>
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {[
              { time: '08:00', service: 'Troca de Óleo', car: 'Honda Civic', color: 'turquoise', icon: OilIcon },
              { time: '10:00', service: 'Pastilhas de Freio', car: 'Toyota Corolla', color: 'red', icon: BrakePadIcon },
              { time: '14:00', service: 'Revisão Periódica', car: 'Volkswagen Gol', color: 'blue', icon: EngineIcon },
              { time: '16:00', service: 'Filtro de Ar', car: 'Fiat Uno', color: 'yellow', icon: FilterIcon },
            ].map((item, idx) => {
              const Icon = item.icon;
              const colorMap = {
                turquoise: 'bg-[#00E0B8]/10 border-[#00E0B8] text-[#00E0B8]',
                red: 'bg-[#FF4E3D]/10 border-[#FF4E3D] text-[#FF4E3D]',
                blue: 'bg-[#3ABFF8]/10 border-[#3ABFF8] text-[#3ABFF8]',
                yellow: 'bg-[#FFCB2B]/10 border-[#FFCB2B] text-[#FFCB2B]',
              };
              return (
                <div key={idx} className={`flex-shrink-0 w-64 p-4 rounded-lg border-2 ${colorMap[item.color as keyof typeof colorMap]} animate-scale-in`} style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="flex items-center space-x-3 mb-3">
                    <Icon size={24} />
                    <div>
                      <p className="font-semibold text-sm">{item.time}</p>
                      <p className="text-xs opacity-80">{item.service}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium">{item.car}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* SEÇÃO 3 - STATUS DOS ELEVADORES */}
        <div className={`bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 shadow-lg mb-8 transform transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h3 className="text-xl font-semibold text-[#D0D6DE] mb-6 flex items-center space-x-2">
            <ElevatorIcon className="text-[#00E0B8]" size={20} />
            <span>Status dos Elevadores</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: 1, status: 'free', label: 'Livre' },
              { id: 2, status: 'occupied', label: 'Ocupado' },
              { id: 3, status: 'maintenance', label: 'Manutenção' },
              { id: 4, status: 'scheduled', label: 'Agendado' },
            ].map((elevator) => {
              const statusMap = {
                free: { bg: 'status-free', icon: '🟢', text: 'Livre' },
                occupied: { bg: 'status-occupied', icon: '🔴', text: 'Ocupado' },
                maintenance: { bg: 'status-maintenance', icon: '🟡', text: 'Manutenção' },
                scheduled: { bg: 'status-scheduled', icon: '🔵', text: 'Agendado' },
              };
              const status = statusMap[elevator.status as keyof typeof statusMap];
              return (
                <div key={elevator.id} className={`${status.bg} border-2 rounded-lg p-4 text-center animate-scale-in`} style={{ animationDelay: `${elevator.id * 0.1}s` }}>
                  <ElevatorIcon className="mx-auto mb-2" size={32} />
                  <p className="text-lg font-bold text-[#D0D6DE] mb-1">Elevador {elevator.id}</p>
                  <p className="text-sm font-medium">{status.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* SEÇÃO 4 - PEÇAS / ESTOQUE */}
        <div className={`bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 shadow-lg mb-8 transform transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h3 className="text-xl font-semibold text-[#D0D6DE] mb-6 flex items-center space-x-2">
            <GearIcon className="text-[#00E0B8]" size={20} />
            <span>Inventário Mecânico</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-[#7E8691] uppercase tracking-wide">Peças Críticas</h4>
              {[
                { name: 'Pastilha dianteira', stock: 2, status: 'low', icon: BrakePadIcon },
                { name: 'Óleo 5W30', stock: 57, status: 'ok', icon: OilIcon },
                { name: 'Filtro de ar', stock: 12, status: 'ok', icon: FilterIcon },
                { name: 'Correia dentada', stock: 4, status: 'alert', icon: GearIcon },
              ].map((part, idx) => {
                const Icon = part.icon;
                const statusColor = part.status === 'low' ? 'text-[#FF4E3D]' : part.status === 'alert' ? 'text-[#FFCB2B]' : 'text-[#00E0B8]';
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[#2A3038] rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Icon className={statusColor} size={20} />
                      <span className="text-[#D0D6DE] text-sm">{part.name}</span>
                    </div>
                    <span className={`font-semibold ${statusColor}`}>{part.stock} unidades</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <svg className="transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#2A3038" strokeWidth="8" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#00E0B8" strokeWidth="8" strokeDasharray={`${75 * 2 * Math.PI * 40 / 100} ${2 * Math.PI * 40}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold text-[#00E0B8]">75%</p>
                  <p className="text-xs text-[#7E8691]">Em Estoque</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO 5 - ALERTAS / DIAGNÓSTICOS */}
        <div className={`bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 shadow-lg transform transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h3 className="text-xl font-semibold text-[#D0D6DE] mb-6 flex items-center space-x-2">
            <ScannerIcon className="text-[#00E0B8]" size={20} />
            <span>Computador de Bordo</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#2A3038] rounded-lg p-4 border border-[#FF4E3D]/30">
              <div className="flex items-center space-x-2 mb-3">
                <ScannerIcon className="text-[#FF4E3D]" size={18} />
                <h4 className="text-sm font-semibold text-[#FF4E3D]">Erros OBD2 Recentes</h4>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="text-[#D0D6DE]">P0420 - Catalisador</div>
                <div className="text-[#D0D6DE]">P0300 - Falha múltipla</div>
                <div className="text-[#7E8691]">P0171 - Mistura pobre</div>
              </div>
            </div>
            <div className="bg-[#2A3038] rounded-lg p-4 border border-[#FFCB2B]/30">
              <div className="flex items-center space-x-2 mb-3">
                <BellIcon className="text-[#FFCB2B]" size={18} />
                <h4 className="text-sm font-semibold text-[#FFCB2B]">Avisos de Manutenção</h4>
              </div>
              <div className="space-y-2 text-xs">
                <div className="text-[#D0D6DE]">Retorno do cliente: Honda Civic</div>
                <div className="text-[#D0D6DE]">Peça acabando: Pastilha dianteira</div>
                <div className="text-[#7E8691]">Revisão periódica: Toyota Corolla</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => {
          setShowChangePasswordModal(false);
          localStorage.removeItem('isFirstLogin');
        }}
        onSuccess={() => {
          setShowChangePasswordModal(false);
        }}
      />
    </div>
  );
}
