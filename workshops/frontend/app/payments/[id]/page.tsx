'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { paymentsApi, Payment, PaymentStatus, PaymentMethod } from '@/lib/api/payments';
import { Button } from '@/components/ui/Button';
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

export default function PaymentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadPayment();
  }, [id]);

  const loadPayment = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await paymentsApi.findOne(id);
      setPayment(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar pagamento';
      setError(errorMessage);
      logger.error('Erro ao carregar pagamento:', err);
      router.push('/payments');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto"></div>
            <p className="mt-4 text-[#7E8691]">Carregando pagamento...</p>
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
          <Button onClick={() => router.push('/payments')}>Voltar para Pagamentos</Button>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#FFA500]/10 border border-[#FFA500] rounded-lg p-4 mb-6">
            <p className="text-[#FFA500]">Pagamento não encontrado.</p>
          </div>
          <Button onClick={() => router.push('/payments')}>Voltar para Pagamentos</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#D0D6DE] mb-2">Pagamento #{payment.id.slice(0, 8)}</h1>
            <p className="text-[#7E8691]">Criado em {formatDate(payment.createdAt)}</p>
          </div>
          <div className="flex space-x-3">
            {payment.status === PaymentStatus.PENDING && (
              <Link href={`/payments/${payment.id}/edit`}>
                <Button variant="secondary">Editar</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#7E8691]">Status:</span>
              {getStatusBadge(payment.status)}
            </div>
            <div className="text-right">
              <p className="text-sm text-[#7E8691]">Valor</p>
              <p className="text-2xl font-bold text-[#00E0B8]">{formatCurrency(payment.amount)}</p>
            </div>
          </div>
        </div>

        {/* Informações */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Informações</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[#7E8691]">Fatura</p>
              <p className="text-[#D0D6DE] font-medium">
                {payment.invoice ? (
                  <Link href={`/invoicing/${payment.invoice.id}`} className="text-[#00E0B8] hover:text-[#3ABFF8]">
                    {payment.invoice.invoiceNumber}
                  </Link>
                ) : (
                  '-'
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#7E8691]">Método de Pagamento</p>
              <p className="text-[#D0D6DE]">{getMethodLabel(payment.method)}</p>
            </div>
            <div>
              <p className="text-sm text-[#7E8691]">Parcelas</p>
              <p className="text-[#D0D6DE]">{payment.installments}x</p>
            </div>
            {payment.paidAt && (
              <div>
                <p className="text-sm text-[#7E8691]">Data de Pagamento</p>
                <p className="text-[#D0D6DE]">{formatDate(payment.paidAt)}</p>
              </div>
            )}
            {payment.transactionId && (
              <div>
                <p className="text-sm text-[#7E8691]">ID da Transação</p>
                <p className="text-[#D0D6DE] font-mono text-sm">{payment.transactionId}</p>
              </div>
            )}
          </div>
        </div>

        {/* Observações */}
        {payment.notes && (
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Observações</h2>
            <p className="text-[#D0D6DE] whitespace-pre-wrap">{payment.notes}</p>
          </div>
        )}

        <div className="mt-6">
          <Link href="/payments">
            <Button variant="secondary">Voltar para Pagamentos</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

