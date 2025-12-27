'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { quotesApi, Quote, QuoteStatus } from '@/lib/api/quotes';
import { Button } from '@/components/ui/Button';
// import { Button } from '@/components/ui/Button'; // Removed duplicate
// import { useNotification } from '@/components/NotificationProvider'; // Removed
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export default function PendingDiagnosisPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    loadPendingQuotes();
  }, []);

  const loadPendingQuotes = async () => {
    try {
      setLoading(true);
      const response = await quotesApi.findAll({
        status: QuoteStatus.AWAITING_DIAGNOSIS,
        limit: 100
      });
      setQuotes(response.data);
    } catch (err: unknown) {
      logger.error('Erro ao carregar orçamentos pendentes:', err);
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
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
              <h1 className="text-3xl font-bold text-[#D0D6DE]">Orçamentos Pendentes de Diagnóstico</h1>
              <p className="text-[#7E8691] mt-2">
                {quotes.length} {quotes.length === 1 ? 'orçamento aguardando' : 'orçamentos aguardando'} diagnóstico
              </p>
            </div>
            <Link href="/quotes">
              <Button variant="outline">Voltar</Button>
            </Link>
          </div>
        </div>

        {quotes.length === 0 ? (
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🔧</div>
            <h3 className="text-xl font-semibold text-[#D0D6DE] mb-2">
              Nenhum orçamento pendente
            </h3>
            <p className="text-[#7E8691]">
              Todos os orçamentos foram diagnosticados ou não há orçamentos aguardando diagnóstico.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 hover:border-[#00E0B8] transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#D0D6DE]">
                      {quote.number}
                    </h3>
                    <p className="text-sm text-[#7E8691]">
                      {formatDate(quote.createdAt)}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-[#FFA500] text-[#0F1115] text-xs font-semibold rounded">
                    Aguardando
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div>
                    <p className="text-sm text-[#7E8691]">Cliente</p>
                    <p className="text-[#D0D6DE] font-medium">
                      {quote.customer?.name || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#7E8691]">Veículo</p>
                    <p className="text-[#D0D6DE] font-medium">
                      {quote.vehicle
                        ? `${quote.vehicle.placa || 'Sem placa'} - ${quote.vehicle.make || ''} ${quote.vehicle.model || ''}`.trim() || 'Veículo'
                        : 'Não informado'}
                    </p>
                  </div>
                  {quote.reportedProblemCategory && (
                    <div>
                      <p className="text-sm text-[#7E8691]">Categoria</p>
                      <p className="text-[#D0D6DE] font-medium capitalize">
                        {quote.reportedProblemCategory.replace('_', ' ')}
                      </p>
                    </div>
                  )}
                </div>

                {quote.reportedProblemSymptoms && quote.reportedProblemSymptoms.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-[#7E8691] mb-2">Sintomas:</p>
                    <div className="flex flex-wrap gap-2">
                      {quote.reportedProblemSymptoms.slice(0, 3).map((symptom, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-[#2A3038] text-[#D0D6DE] rounded text-xs"
                        >
                          {symptom}
                        </span>
                      ))}
                      {quote.reportedProblemSymptoms.length > 3 && (
                        <span className="px-2 py-1 bg-[#2A3038] text-[#7E8691] rounded text-xs">
                          +{quote.reportedProblemSymptoms.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    onClick={() => router.push(`/quotes/${quote.id}/diagnose`)}
                    className="flex-1"
                  >
                    Avaliar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/quotes/${quote.id}`)}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

