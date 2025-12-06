'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { quotesApi, Quote, QuoteStatus } from '@/lib/api/quotes';
import { notificationsApi } from '@/lib/api/notifications';
import { Button } from '@/components/ui/Button';
import { useNotification } from '@/components/NotificationProvider';

export const dynamic = 'force-dynamic';

export default function DiagnosedQuotesPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadQuotes();
    loadUnreadCount();

    // Polling a cada 15 segundos para atualizar notificações e orçamentos
    const interval = setInterval(() => {
      loadQuotes();
      loadUnreadCount();
    }, 15000);

    return () => clearInterval(interval);
  }, [router]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const response = await quotesApi.findAll({
        status: QuoteStatus.DIAGNOSED,
        limit: 100,
      });
      setQuotes(response.data);
    } catch (err) {
      console.error('Erro ao carregar orçamentos:', err);
      showNotification('Erro ao carregar orçamentos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const result = await notificationsApi.getUnreadCount();
      setUnreadCount(result || 0);
    } catch (err) {
      console.error('Erro ao carregar contador de notificações:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      [QuoteStatus.DIAGNOSED]: { label: 'Diagnosticado', className: 'bg-[#3ABFF8] text-white animate-blink' },
      [QuoteStatus.AWAITING_DIAGNOSIS]: { label: 'Aguardando Diagnóstico', className: 'bg-[#FFA500] text-[#0F1115]' },
      [QuoteStatus.SENT]: { label: 'Enviado', className: 'bg-[#3ABFF8] text-white' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-[#7E8691] text-white' };
    return (
      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#D0D6DE]">
                Orçamentos Diagnosticados
              </h1>
              <p className="text-[#7E8691] mt-2">
                {quotes.length === 1 ? '1 orçamento aguardando preenchimento' : `${quotes.length} orçamentos aguardando preenchimento`}
              </p>
            </div>
            <Link href="/quotes">
              <Button variant="outline">Voltar</Button>
            </Link>
          </div>

          {unreadCount > 0 && (
            <div className="bg-gradient-to-r from-[#3ABFF8]/30 to-[#00E0B8]/30 border-2 border-[#3ABFF8] rounded-lg p-6 mb-6 animate-blink shadow-lg shadow-[#3ABFF8]/20">
              <div className="flex items-center gap-3">
                <span className="text-4xl animate-bounce">🔔</span>
                <div className="flex-1">
                  <p className="font-bold text-xl text-[#D0D6DE] mb-1">
                    ⚡ {unreadCount === 1 ? '1 novo diagnóstico concluído!' : `${unreadCount} novos diagnósticos concluídos!`}
                  </p>
                  <p className="text-sm text-[#7E8691]">
                    Clique em um orçamento abaixo para preencher e enviar ao cliente
                  </p>
                </div>
                <div className="text-3xl animate-pulse">✨</div>
              </div>
            </div>
          )}
        </div>

        {quotes.length === 0 ? (
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-12 text-center">
            <p className="text-[#7E8691] text-lg">
              Nenhum orçamento diagnosticado no momento
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                role="button"
                tabIndex={0}
                className={`bg-[#1A1E23] border-2 rounded-lg p-6 hover:border-[#00E0B8]/70 transition-all cursor-pointer ${
                  unreadCount > 0 
                    ? 'border-[#3ABFF8] animate-pulse-glow shadow-lg shadow-[#3ABFF8]/30' 
                    : 'border-[#2A3038]'
                }`}
                onClick={() => router.push(`/quotes/${quote.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/quotes/${quote.id}`);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#D0D6DE] mb-1">
                      {quote.number}
                    </h3>
                    {getStatusBadge(quote.status)}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div>
                    <p className="text-sm text-[#7E8691]">Cliente</p>
                    <p className="text-[#D0D6DE] font-medium">
                      {quote.customer?.name || 'Não informado'}
                    </p>
                  </div>
                  {quote.vehicle && (
                    <div>
                      <p className="text-sm text-[#7E8691]">Veículo</p>
                      <p className="text-[#D0D6DE]">
                        {quote.vehicle.placa || 'Sem placa'} - {quote.vehicle.make} {quote.vehicle.model}
                      </p>
                    </div>
                  )}
                  {quote.assignedMechanic && (
                    <div>
                      <p className="text-sm text-[#7E8691]">Mecânico</p>
                      <p className="text-[#D0D6DE]">{quote.assignedMechanic.name}</p>
                    </div>
                  )}
                  {quote.identifiedProblemDescription && (
                    <div>
                      <p className="text-sm text-[#7E8691]">Problema Identificado</p>
                      <p className="text-[#D0D6DE] text-sm line-clamp-2">
                        {quote.identifiedProblemDescription}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-[#7E8691]">Diagnosticado em</p>
                    <p className="text-[#D0D6DE] text-sm">{formatDate(quote.updatedAt)}</p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/quotes/${quote.id}`);
                  }}
                >
                  Preencher Orçamento
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

