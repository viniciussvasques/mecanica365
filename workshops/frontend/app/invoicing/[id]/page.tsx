'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { invoicingApi, Invoice, InvoiceStatus, PaymentStatus } from '@/lib/api/invoicing';
import { Button } from '@/components/ui/Button';

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

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invoicingApi.findOne(id);
      setInvoice(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar fatura';
      setError(errorMessage);
      console.error('Erro ao carregar fatura:', err);
      router.push('/invoicing');
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async () => {
    if (!confirm('Tem certeza que deseja emitir esta fatura? Após emitida, ela não poderá ser editada.')) {
      return;
    }

    try {
      setProcessing(true);
      await invoicingApi.issue(id);
      await loadInvoice();
      alert('Fatura emitida com sucesso!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao emitir fatura';
      alert(errorMessage);
      console.error('Erro ao emitir fatura:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Tem certeza que deseja cancelar esta fatura?')) {
      return;
    }

    try {
      setProcessing(true);
      await invoicingApi.cancel(id);
      await loadInvoice();
      alert('Fatura cancelada com sucesso!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao cancelar fatura';
      alert(errorMessage);
      console.error('Erro ao cancelar fatura:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta fatura?')) {
      return;
    }

    try {
      setProcessing(true);
      await invoicingApi.remove(id);
      router.push('/invoicing');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir fatura';
      alert(errorMessage);
      console.error('Erro ao excluir fatura:', err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto"></div>
            <p className="mt-4 text-[#7E8691]">Carregando fatura...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#FF4E3D]/10 border border-[#FF4E3D] rounded-lg p-4 mb-6">
            <p className="text-[#FF4E3D]">{error}</p>
          </div>
          <Button onClick={() => router.push('/invoicing')}>Voltar para Faturas</Button>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#FFA500]/10 border border-[#FFA500] rounded-lg p-4 mb-6">
            <p className="text-[#FFA500]">Fatura não encontrada.</p>
          </div>
          <Button onClick={() => router.push('/invoicing')}>Voltar para Faturas</Button>
        </div>
      </div>
    );
  }

  const subtotal = invoice.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const total = subtotal - invoice.discount + invoice.taxAmount;

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#D0D6DE] mb-2">Fatura {invoice.invoiceNumber}</h1>
            <p className="text-[#7E8691]">Criada em {formatDate(invoice.createdAt)}</p>
          </div>
          <div className="flex space-x-3">
            {invoice.status === InvoiceStatus.DRAFT && (
              <>
                <Link href={`/invoicing/${invoice.id}/edit`}>
                  <Button variant="secondary">Editar</Button>
                </Link>
                <Button
                  variant="primary"
                  onClick={handleIssue}
                  disabled={processing}
                >
                  {processing ? 'Emitindo...' : 'Emitir Fatura'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={processing}
                  className="text-[#FF4E3D] border-[#FF4E3D] hover:bg-[#FF4E3D]/10"
                >
                  Excluir
                </Button>
              </>
            )}
            {(invoice.status === InvoiceStatus.ISSUED || invoice.status === InvoiceStatus.OVERDUE) && (
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={processing}
                className="text-[#FFA500] border-[#FFA500] hover:bg-[#FFA500]/10"
              >
                {processing ? 'Cancelando...' : 'Cancelar'}
              </Button>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#7E8691]">Status:</span>
              {getStatusBadge(invoice.status)}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#7E8691]">Pagamento:</span>
              {getPaymentStatusBadge(invoice.paymentStatus)}
            </div>
          </div>
        </div>

        {/* Informações */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Informações</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[#7E8691]">Cliente</p>
              <p className="text-[#D0D6DE] font-medium">
                {invoice.customer ? (
                  <Link href={`/customers/${invoice.customer.id}`} className="text-[#00E0B8] hover:text-[#3ABFF8]">
                    {invoice.customer.name}
                  </Link>
                ) : (
                  '-'
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#7E8691]">Ordem de Serviço</p>
              <p className="text-[#D0D6DE] font-medium">
                {invoice.serviceOrder ? (
                  <Link href={`/service-orders/${invoice.serviceOrder.id}`} className="text-[#00E0B8] hover:text-[#3ABFF8]">
                    OS-{invoice.serviceOrder.number}
                  </Link>
                ) : (
                  '-'
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#7E8691]">Tipo</p>
              <p className="text-[#D0D6DE]">
                {(() => {
                  if (invoice.type === 'service') return 'Serviço';
                  if (invoice.type === 'sale') return 'Venda';
                  return 'Peça';
                })()}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#7E8691]">Data de Vencimento</p>
              <p className="text-[#D0D6DE]">{formatDate(invoice.dueDate)}</p>
            </div>
            {invoice.issuedAt && (
              <div>
                <p className="text-sm text-[#7E8691]">Data de Emissão</p>
                <p className="text-[#D0D6DE]">{formatDate(invoice.issuedAt)}</p>
              </div>
            )}
            {invoice.paidAt && (
              <div>
                <p className="text-sm text-[#7E8691]">Data de Pagamento</p>
                <p className="text-[#D0D6DE]">{formatDate(invoice.paidAt)}</p>
              </div>
            )}
            {invoice.paymentMethod && (
              <div>
                <p className="text-sm text-[#7E8691]">Método de Pagamento</p>
                <p className="text-[#D0D6DE]">{invoice.paymentMethod}</p>
              </div>
            )}
          </div>
        </div>

        {/* Itens */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Itens</h2>
          <div className="space-y-3">
            {invoice.items.map((item) => (
              <div key={item.id || `${item.name}-${item.type}-${item.quantity}-${item.unitPrice}`} className="bg-[#0F1115] border border-[#2A3038] rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[#D0D6DE] font-medium">{item.name}</span>
                      <span className="text-xs text-[#7E8691] px-2 py-0.5 bg-[#2A3038] rounded">
                        {item.type === 'service' ? 'Serviço' : 'Peça'}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-[#7E8691] mb-2">{item.description}</p>
                    )}
                    <p className="text-sm text-[#7E8691]">
                      {item.quantity} × {formatCurrency(item.unitPrice)} = {formatCurrency(item.totalPrice)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totais */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Totais</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#7E8691]">Subtotal:</span>
              <span className="text-[#D0D6DE]">{formatCurrency(subtotal)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#7E8691]">Desconto:</span>
                <span className="text-[#D0D6DE]">-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            {invoice.taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#7E8691]">Impostos:</span>
                <span className="text-[#D0D6DE]">+{formatCurrency(invoice.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t border-[#2A3038] pt-2 mt-2">
              <span className="text-[#D0D6DE]">Total:</span>
              <span className="text-[#00E0B8]">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* NFe */}
        {invoice.nfeKey && (
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Nota Fiscal Eletrônica</h2>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-[#7E8691]">Chave NFe</p>
                <p className="text-[#D0D6DE] font-mono text-sm">{invoice.nfeKey}</p>
              </div>
              {invoice.nfeStatus && (
                <div>
                  <p className="text-sm text-[#7E8691]">Status NFe</p>
                  <p className="text-[#D0D6DE]">{invoice.nfeStatus}</p>
                </div>
              )}
              {invoice.nfePdfUrl && (
                <div>
                  <a
                    href={invoice.nfePdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00E0B8] hover:text-[#3ABFF8]"
                  >
                    Ver PDF da NFe
                  </a>
                </div>
              )}
              {invoice.nfeXmlUrl && (
                <div>
                  <a
                    href={invoice.nfeXmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00E0B8] hover:text-[#3ABFF8]"
                  >
                    Ver XML da NFe
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6">
          <Link href="/invoicing">
            <Button variant="secondary">Voltar para Faturas</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

