'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { quotesApi, Quote, QuoteFilters, QuoteStatus } from '@/lib/api/quotes';
import { notificationsApi } from '@/lib/api/notifications';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useNotification } from '@/components/NotificationProvider';

export const dynamic = 'force-dynamic';

export default function QuotesPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [diagnosedCount, setDiagnosedCount] = useState(0);
  const [filters, setFilters] = useState<QuoteFilters>({
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadQuotes();
    loadUnreadCount();
    loadDiagnosedCount();

    // Polling a cada 15 segundos para atualizar notificações e contadores
    const interval = setInterval(() => {
      loadQuotes();
      loadUnreadCount();
      loadDiagnosedCount();
    }, 15000);

    return () => clearInterval(interval);
  }, [filters]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const subdomain = localStorage.getItem('subdomain');
      
      if (!token || !subdomain) {
        setError('Token ou subdomain não encontrado. Faça login novamente.');
        router.push('/login');
        return;
      }
      
      const response = await quotesApi.findAll(filters);
      setQuotes(response.data);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      });
    } catch (err: unknown) {
      console.error('[QuotesPage] Erro ao carregar orçamentos:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar orçamentos';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const result = await notificationsApi.getUnreadCount();
      setUnreadCount(result.unreadCount || 0);
    } catch (err) {
      console.error('Erro ao carregar contador de notificações:', err);
    }
  };

  const loadDiagnosedCount = async () => {
    try {
      const response = await quotesApi.findAll({
        status: QuoteStatus.DIAGNOSED,
        limit: 1,
      });
      setDiagnosedCount(response.total || 0);
    } catch (err) {
      console.error('Erro ao carregar contador de diagnosticados:', err);
    }
  };

  const handleFilterChange = (key: keyof QuoteFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const getStatusBadge = (status: QuoteStatus) => {
    const statusConfig: Record<QuoteStatus, { label: string; className: string }> = {
      [QuoteStatus.DRAFT]: { label: 'Rascunho', className: 'bg-[#7E8691] text-white' },
      [QuoteStatus.AWAITING_DIAGNOSIS]: { label: 'Aguardando Diagnóstico', className: 'bg-[#FFA500] text-[#0F1115]' },
      [QuoteStatus.DIAGNOSED]: { label: 'Diagnosticado', className: 'bg-[#3ABFF8] text-white' },
      [QuoteStatus.SENT]: { label: 'Enviado', className: 'bg-[#3ABFF8] text-white' },
      [QuoteStatus.VIEWED]: { label: 'Visualizado', className: 'bg-[#00E0B8] text-[#0F1115]' },
      [QuoteStatus.ACCEPTED]: { label: 'Aceito', className: 'bg-[#00E0B8] text-[#0F1115]' },
      [QuoteStatus.REJECTED]: { label: 'Rejeitado', className: 'bg-[#FF4E3D] text-white' },
      [QuoteStatus.EXPIRED]: { label: 'Expirado', className: 'bg-[#7E8691] text-white' },
      [QuoteStatus.CONVERTED]: { label: 'Convertido', className: 'bg-[#00E0B8] text-[#0F1115]' },
    };

    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-[#D0D6DE]">Orçamentos</h1>
            <Link href="/quotes/new">
              <Button variant="primary">
                + Novo Orçamento
              </Button>
            </Link>
          </div>
          <p className="text-[#7E8691]">Gerencie seus orçamentos</p>
        </div>

        {/* Alerta: Orçamentos Diagnosticados */}
        {diagnosedCount > 0 && (
          <div className="bg-gradient-to-r from-[#3ABFF8]/30 to-[#00E0B8]/30 border-2 border-[#3ABFF8] rounded-lg p-6 mb-6 animate-pulse-glow shadow-lg shadow-[#3ABFF8]/20">
            <div className="flex items-center gap-3">
              <span className="text-4xl animate-bounce">🔔</span>
              <div className="flex-1">
                <p className="font-bold text-xl text-[#D0D6DE] mb-1">
                  ⚡ {diagnosedCount} orçamento{diagnosedCount !== 1 ? 's' : ''} diagnosticado{diagnosedCount !== 1 ? 's' : ''} aguardando preenchimento!
                </p>
                <p className="text-sm text-[#7E8691]">
                  Clique em um orçamento com status "Diagnosticado" abaixo para preencher e enviar ao cliente
                </p>
              </div>
              <div className="text-3xl animate-pulse">✨</div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Número"
              placeholder="Buscar por número..."
              value={filters.number || ''}
              onChange={(e) => handleFilterChange('number', e.target.value)}
            />
            <Select
              label="Status"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              options={[
                { value: '', label: 'Todos' },
                { value: QuoteStatus.DRAFT, label: 'Rascunho' },
                { value: QuoteStatus.AWAITING_DIAGNOSIS, label: 'Aguardando Diagnóstico' },
                { value: QuoteStatus.DIAGNOSED, label: 'Diagnosticado' },
                { value: QuoteStatus.SENT, label: 'Enviado' },
                { value: QuoteStatus.VIEWED, label: 'Visualizado' },
                { value: QuoteStatus.ACCEPTED, label: 'Aceito' },
                { value: QuoteStatus.REJECTED, label: 'Rejeitado' },
                { value: QuoteStatus.EXPIRED, label: 'Expirado' },
                { value: QuoteStatus.CONVERTED, label: 'Convertido' },
              ]}
            />
            <Input
              label="Data Inicial"
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
            <Input
              label="Data Final"
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="bg-[#FF4E3D]/10 border border-[#FF4E3D] rounded-lg p-4 mb-6">
            <p className="text-[#FF4E3D]">{error}</p>
          </div>
        )}

        {/* Tabela */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto"></div>
              <p className="mt-4 text-[#7E8691]">Carregando orçamentos...</p>
            </div>
          ) : quotes.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[#7E8691]">Nenhum orçamento encontrado</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#2A3038]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Número</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Cliente</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Veículo</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Total</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Data</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A3038]">
                    {quotes.map((quote) => (
                      <tr
                        key={quote.id}
                        className={`hover:bg-[#2A3038]/50 transition-colors ${
                          quote.status === QuoteStatus.DIAGNOSED
                            ? 'bg-[#3ABFF8]/10 border-l-4 border-[#3ABFF8] animate-pulse-glow'
                            : quote.status === QuoteStatus.ACCEPTED && !quote.serviceOrderId
                            ? 'bg-[#00E0B8]/5 border-l-4 border-[#00E0B8]'
                            : ''
                        }`}
                      >
                        <td className="px-6 py-4 text-sm text-[#D0D6DE] font-medium">{quote.number}</td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">
                          {quote.customer?.name || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">
                          {quote.vehicle?.placa || quote.vehicle?.make || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {getStatusBadge(quote.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#D0D6DE] font-medium">
                          {formatCurrency(quote.totalCost)}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">
                          {new Date(quote.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Link href={`/quotes/${quote.id}`}>
                              <Button variant="outline" size="sm">
                                Ver
                              </Button>
                            </Link>
                            <Link href={`/quotes/${quote.id}/edit`}>
                              <Button variant="secondary" size="sm">
                                Editar
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 bg-[#2A3038] flex items-center justify-between">
                  <p className="text-sm text-[#7E8691]">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                    {pagination.total} orçamentos
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-[#D0D6DE]">
                      Página {pagination.page} de {pagination.totalPages}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

