'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { invoicingApi, Invoice, InvoiceFilters, InvoiceStatus, PaymentStatus, InvoiceType } from '@/lib/api/invoicing';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { logger } from '@/lib/utils/logger';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (date: string | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getStatusBadge = (status: InvoiceStatus) => {
  const badges = {
    [InvoiceStatus.DRAFT]: { label: 'Rascunho', className: 'bg-[#7E8691]/20 text-[#7E8691]' },
    [InvoiceStatus.ISSUED]: { label: 'Emitida', className: 'bg-[#3ABFF8]/20 text-[#3ABFF8]' },
    [InvoiceStatus.PAID]: { label: 'Paga', className: 'bg-[#00E0B8]/20 text-[#00E0B8]' },
    [InvoiceStatus.OVERDUE]: { label: 'Vencida', className: 'bg-[#FF4E3D]/20 text-[#FF4E3D]' },
    [InvoiceStatus.CANCELLED]: { label: 'Cancelada', className: 'bg-[#7E8691]/20 text-[#7E8691]' },
  };
  const badge = badges[status];
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
      {badge.label}
    </span>
  );
};

const getPaymentStatusBadge = (status: PaymentStatus) => {
  const badges = {
    [PaymentStatus.PENDING]: { label: 'Pendente', className: 'bg-[#FFA500]/20 text-[#FFA500]' },
    [PaymentStatus.PARTIAL]: { label: 'Parcial', className: 'bg-[#3ABFF8]/20 text-[#3ABFF8]' },
    [PaymentStatus.PAID]: { label: 'Paga', className: 'bg-[#00E0B8]/20 text-[#00E0B8]' },
    [PaymentStatus.OVERDUE]: { label: 'Vencida', className: 'bg-[#FF4E3D]/20 text-[#FF4E3D]' },
    [PaymentStatus.CANCELLED]: { label: 'Cancelada', className: 'bg-[#7E8691]/20 text-[#7E8691]' },
  };
  const badge = badges[status];
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
      {badge.label}
    </span>
  );
};

export default function InvoicingPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<InvoiceFilters>({
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

    loadInvoices();
  }, [filters]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = authStorage.getToken();
      const subdomain = authStorage.getSubdomain();
      
      if (!token) {
        setError('Token de autenticação não encontrado. Faça login novamente.');
        router.push('/login');
        return;
      }
      
      if (!subdomain) {
        setError('Subdomain não encontrado. Faça login novamente.');
        router.push('/login');
        return;
      }
      
      logger.log('[InvoicingPage] Carregando faturas com subdomain:', subdomain);
      const response = await invoicingApi.findAll(filters);
      setInvoices(response.data);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      });
    } catch (err: unknown) {
      logger.error('[InvoicingPage] Erro ao carregar faturas:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar faturas';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof InvoiceFilters, value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : value,
      page: 1, // Reset para primeira página ao filtrar
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleIssue = async (id: string) => {
    if (!confirm('Tem certeza que deseja emitir esta fatura? Após emitida, ela não poderá ser editada.')) {
      return;
    }

    try {
      await invoicingApi.issue(id);
      await loadInvoices();
      alert('Fatura emitida com sucesso!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao emitir fatura';
      alert(errorMessage);
      logger.error('Erro ao emitir fatura:', err);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta fatura?')) {
      return;
    }

    try {
      await invoicingApi.cancel(id);
      await loadInvoices();
      alert('Fatura cancelada com sucesso!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao cancelar fatura';
      alert(errorMessage);
      logger.error('Erro ao cancelar fatura:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta fatura?')) {
      return;
    }

    try {
      await invoicingApi.remove(id);
      await loadInvoices();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir fatura';
      alert(errorMessage);
      logger.error('Erro ao excluir fatura:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-[#D0D6DE]">Faturas</h1>
            <Link href="/invoicing/new">
              <Button variant="primary">
                + Nova Fatura
              </Button>
            </Link>
          </div>
          <p className="text-[#7E8691]">Gerencie faturas e notas fiscais</p>
        </div>

        {/* Filtros */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Número da Fatura"
              placeholder="FAT-001..."
              value={filters.invoiceNumber || ''}
              onChange={(e) => handleFilterChange('invoiceNumber', e.target.value)}
            />
            <Select
              label="Status"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value === '' ? undefined : e.target.value as InvoiceStatus)}
              options={[
                { value: '', label: 'Todos' },
                { value: InvoiceStatus.DRAFT, label: 'Rascunho' },
                { value: InvoiceStatus.ISSUED, label: 'Emitida' },
                { value: InvoiceStatus.PAID, label: 'Paga' },
                { value: InvoiceStatus.OVERDUE, label: 'Vencida' },
                { value: InvoiceStatus.CANCELLED, label: 'Cancelada' },
              ]}
            />
            <Select
              label="Status do Pagamento"
              value={filters.paymentStatus || ''}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value === '' ? undefined : e.target.value as PaymentStatus)}
              options={[
                { value: '', label: 'Todos' },
                { value: PaymentStatus.PENDING, label: 'Pendente' },
                { value: PaymentStatus.PARTIAL, label: 'Parcial' },
                { value: PaymentStatus.PAID, label: 'Paga' },
                { value: PaymentStatus.OVERDUE, label: 'Vencida' },
                { value: PaymentStatus.CANCELLED, label: 'Cancelada' },
              ]}
            />
            <Select
              label="Tipo"
              value={filters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value === '' ? undefined : e.target.value as InvoiceType)}
              options={[
                { value: '', label: 'Todos' },
                { value: InvoiceType.SERVICE, label: 'Serviço' },
                { value: InvoiceType.SALE, label: 'Venda' },
                { value: InvoiceType.PART, label: 'Peça' },
              ]}
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
          {loading && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto"></div>
              <p className="mt-4 text-[#7E8691]">Carregando faturas...</p>
            </div>
          )}
          {!loading && invoices.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-[#7E8691]">Nenhuma fatura encontrada</p>
            </div>
          )}
          {!loading && invoices.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#2A3038]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Número</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Cliente</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Tipo</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Valor Total</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Pagamento</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Vencimento</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A3038]">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-[#2A3038]/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-[#D0D6DE] font-medium">{invoice.invoiceNumber}</td>
                        <td className="px-6 py-4 text-sm text-[#D0D6DE]">
                          {invoice.customer ? (
                            <Link href={`/customers/${invoice.customer.id}`} className="text-[#00E0B8] hover:text-[#3ABFF8]">
                              {invoice.customer.name}
                            </Link>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">
                          {(() => {
                            if (invoice.type === InvoiceType.SERVICE) return 'Serviço';
                            if (invoice.type === InvoiceType.SALE) return 'Venda';
                            return 'Peça';
                          })()}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#D0D6DE] font-medium">
                          {formatCurrency(invoice.total)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {getPaymentStatusBadge(invoice.paymentStatus)}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">
                          {formatDate(invoice.dueDate)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Link href={`/invoicing/${invoice.id}`}>
                              <Button variant="outline" size="sm">
                                Ver
                              </Button>
                            </Link>
                            {invoice.status === InvoiceStatus.DRAFT && (
                              <>
                                <Link href={`/invoicing/${invoice.id}/edit`}>
                                  <Button variant="secondary" size="sm">
                                    Editar
                                  </Button>
                                </Link>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleIssue(invoice.id)}
                                >
                                  Emitir
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(invoice.id)}
                                  className="text-[#FF4E3D] border-[#FF4E3D] hover:bg-[#FF4E3D]/10"
                                >
                                  Excluir
                                </Button>
                              </>
                            )}
                            {(invoice.status === InvoiceStatus.ISSUED || invoice.status === InvoiceStatus.OVERDUE) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancel(invoice.id)}
                                className="text-[#FFA500] border-[#FFA500] hover:bg-[#FFA500]/10"
                              >
                                Cancelar
                              </Button>
                            )}
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
                    {pagination.total} faturas
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

