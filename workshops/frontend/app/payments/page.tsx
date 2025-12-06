'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { paymentsApi, Payment, PaymentFilters, PaymentStatus, PaymentMethod } from '@/lib/api/payments';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

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
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusBadge = (status: PaymentStatus) => {
  const badges = {
    [PaymentStatus.PENDING]: { label: 'Pendente', className: 'bg-[#FFA500]/20 text-[#FFA500]' },
    [PaymentStatus.PROCESSING]: { label: 'Processando', className: 'bg-[#3ABFF8]/20 text-[#3ABFF8]' },
    [PaymentStatus.COMPLETED]: { label: 'Pago', className: 'bg-[#00E0B8]/20 text-[#00E0B8]' },
    [PaymentStatus.FAILED]: { label: 'Falhou', className: 'bg-[#FF4E3D]/20 text-[#FF4E3D]' },
    [PaymentStatus.REFUNDED]: { label: 'Reembolsado', className: 'bg-[#7E8691]/20 text-[#7E8691]' },
    [PaymentStatus.CANCELLED]: { label: 'Cancelado', className: 'bg-[#7E8691]/20 text-[#7E8691]' },
  };
  const badge = badges[status];
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
      {badge.label}
    </span>
  );
};

const getMethodLabel = (method: PaymentMethod) => {
  const methods = {
    [PaymentMethod.CASH]: 'Dinheiro',
    [PaymentMethod.CREDIT_CARD]: 'Cartão de Crédito',
    [PaymentMethod.DEBIT_CARD]: 'Cartão de Débito',
    [PaymentMethod.PIX]: 'PIX',
    [PaymentMethod.BOLETO]: 'Boleto',
    [PaymentMethod.TRANSFER]: 'Transferência',
  };
  return methods[method] || method;
};

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaymentFilters>({
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

    loadPayments();
  }, [filters]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const subdomain = localStorage.getItem('subdomain');
      
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
      
      const response = await paymentsApi.findAll(filters);
      setPayments(response.data);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      });
    } catch (err: unknown) {
      console.error('[PaymentsPage] Erro ao carregar pagamentos:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar pagamentos';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof PaymentFilters, value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : value,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este pagamento?')) {
      return;
    }

    try {
      await paymentsApi.remove(id);
      await loadPayments();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir pagamento';
      alert(errorMessage);
      console.error('Erro ao excluir pagamento:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-[#D0D6DE]">Pagamentos</h1>
            <div className="flex space-x-2">
              <Link href="/payments/new">
                <Button variant="primary">
                  + Novo Pagamento
                </Button>
              </Link>
              <Link href="/payments/settings">
                <Button variant="secondary">
                  Configurar Gateways
                </Button>
              </Link>
            </div>
          </div>
          <p className="text-[#7E8691]">Gerencie pagamentos e configure gateways de pagamento</p>
        </div>

        {/* Filtros */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Status"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value === '' ? undefined : e.target.value as PaymentStatus)}
              options={[
                { value: '', label: 'Todos' },
                { value: PaymentStatus.PENDING, label: 'Pendente' },
                { value: PaymentStatus.PROCESSING, label: 'Processando' },
                { value: PaymentStatus.COMPLETED, label: 'Pago' },
                { value: PaymentStatus.FAILED, label: 'Falhou' },
                { value: PaymentStatus.REFUNDED, label: 'Reembolsado' },
                { value: PaymentStatus.CANCELLED, label: 'Cancelado' },
              ]}
            />
            <Select
              label="Método"
              value={filters.method || ''}
              onChange={(e) => handleFilterChange('method', e.target.value === '' ? undefined : e.target.value as PaymentMethod)}
              options={[
                { value: '', label: 'Todos' },
                { value: PaymentMethod.CASH, label: 'Dinheiro' },
                { value: PaymentMethod.CREDIT_CARD, label: 'Cartão de Crédito' },
                { value: PaymentMethod.DEBIT_CARD, label: 'Cartão de Débito' },
                { value: PaymentMethod.PIX, label: 'PIX' },
                { value: PaymentMethod.BOLETO, label: 'Boleto' },
                { value: PaymentMethod.TRANSFER, label: 'Transferência' },
              ]}
            />
            <Input
              label="ID da Fatura"
              placeholder="Filtrar por fatura..."
              value={filters.invoiceId || ''}
              onChange={(e) => handleFilterChange('invoiceId', e.target.value)}
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
              <p className="mt-4 text-[#7E8691]">Carregando pagamentos...</p>
            </div>
          )}
          {!loading && payments.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-[#7E8691]">Nenhum pagamento encontrado</p>
            </div>
          )}
          {!loading && payments.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#2A3038]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Fatura</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Valor</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Método</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Parcelas</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Data</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A3038]">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-[#2A3038]/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-[#D0D6DE] font-mono">{payment.id.slice(0, 8)}...</td>
                        <td className="px-6 py-4 text-sm text-[#D0D6DE]">
                          {payment.invoice ? (
                            <Link href={`/invoicing/${payment.invoice.id}`} className="text-[#00E0B8] hover:text-[#3ABFF8]">
                              {payment.invoice.invoiceNumber}
                            </Link>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#D0D6DE] font-medium">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">
                          {getMethodLabel(payment.method)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">
                          {payment.installments}x
                        </td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">
                          {formatDate(payment.paidAt || payment.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Link href={`/payments/${payment.id}`}>
                              <Button variant="outline" size="sm">
                                Ver
                              </Button>
                            </Link>
                            {payment.status === PaymentStatus.PENDING && (
                              <Link href={`/payments/${payment.id}/edit`}>
                                <Button variant="secondary" size="sm">
                                  Editar
                                </Button>
                              </Link>
                            )}
                            {payment.status !== PaymentStatus.COMPLETED && payment.status !== PaymentStatus.REFUNDED && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(payment.id)}
                                className="text-[#FF4E3D] border-[#FF4E3D] hover:bg-[#FF4E3D]/10"
                              >
                                Excluir
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
                    {pagination.total} pagamentos
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

