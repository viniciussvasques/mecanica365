'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { quotesApi, Quote, QuoteStatus } from '@/lib/api/quotes';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

export const dynamic = 'force-dynamic';

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: QuoteStatus.AWAITING_DIAGNOSIS, label: 'Aguardando Diagnóstico' },
  { value: QuoteStatus.DIAGNOSED, label: 'Diagnosticado' },
  { value: QuoteStatus.SENT, label: 'Enviado' },
  { value: QuoteStatus.ACCEPTED, label: 'Aprovado' },
];

export default function MechanicQuotesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filterStatus, setFilterStatus] = useState<QuoteStatus | ''>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadQuotes();
  }, [filterStatus]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      
      const userId = localStorage.getItem('userId');
      if (!userId) {
        router.push('/login');
        return;
      }

      const response = await quotesApi.findAll({ 
        status: filterStatus || undefined,
        limit: 100 
      });
      
      // Filtrar apenas os atribuídos ao mecânico atual
      const myQuotes = response.data.filter(
        (q: Quote) => q.assignedMechanicId === userId
      );
      
      setQuotes(myQuotes);
    } catch (err) {
      console.error('Erro ao carregar orçamentos:', err);
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

  const getStatusBadge = (status: QuoteStatus) => {
    const badges: Record<QuoteStatus, { label: string; className: string }> = {
      [QuoteStatus.DRAFT]: { label: 'Rascunho', className: 'bg-[#7E8691]/20 text-[#7E8691]' },
      [QuoteStatus.AWAITING_DIAGNOSIS]: { label: 'Aguardando', className: 'bg-[#FFA500]/20 text-[#FFA500]' },
      [QuoteStatus.DIAGNOSED]: { label: 'Diagnosticado', className: 'bg-[#00E0B8]/20 text-[#00E0B8]' },
      [QuoteStatus.SENT]: { label: 'Enviado', className: 'bg-[#3ABFF8]/20 text-[#3ABFF8]' },
      [QuoteStatus.ACCEPTED]: { label: 'Aprovado', className: 'bg-[#00E0B8]/20 text-[#00E0B8]' },
      [QuoteStatus.REJECTED]: { label: 'Rejeitado', className: 'bg-[#FF4E3D]/20 text-[#FF4E3D]' },
      [QuoteStatus.EXPIRED]: { label: 'Expirado', className: 'bg-[#7E8691]/20 text-[#7E8691]' },
      [QuoteStatus.CONVERTED]: { label: 'Convertido', className: 'bg-[#3ABFF8]/20 text-[#3ABFF8]' },
    };

    const badge = badges[status] || badges[QuoteStatus.DRAFT];
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${badge.className}`}>
        {badge.label}
      </span>
    );
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#D0D6DE]">Meus Orçamentos</h1>
              <p className="text-[#7E8691] mt-2">
                {quotes.length} {quotes.length === 1 ? 'orçamento atribuído' : 'orçamentos atribuídos'}
              </p>
            </div>
            <Link href="/mechanic/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </div>

          {/* Filtros */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-4">
            <Select
              label="Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as QuoteStatus | '')}
              options={statusOptions}
            />
          </div>
        </div>

        {/* Lista de Orçamentos */}
        {quotes.length === 0 ? (
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🔧</div>
            <h3 className="text-xl font-semibold text-[#D0D6DE] mb-2">
              Nenhum orçamento encontrado
            </h3>
            <p className="text-[#7E8691]">
              {filterStatus 
                ? 'Não há orçamentos com este status atribuídos a você.'
                : 'Você não tem orçamentos atribuídos no momento.'}
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
                  {getStatusBadge(quote.status)}
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
                  {quote.status === QuoteStatus.AWAITING_DIAGNOSIS ? (
                    <Button
                      variant="primary"
                      onClick={() => router.push(`/quotes/${quote.id}/diagnose`)}
                      className="flex-1"
                    >
                      Fazer Diagnóstico
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/quotes/${quote.id}`)}
                      className="flex-1"
                    >
                      Ver Detalhes
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

