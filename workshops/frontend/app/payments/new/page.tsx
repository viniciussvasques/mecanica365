'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { paymentsApi, CreatePaymentDto, PaymentMethod, PaymentStatus } from '@/lib/api/payments';
import { invoicingApi, Invoice, InvoiceStatus } from '@/lib/api/invoicing';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useNotification } from '@/components/NotificationProvider';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function NewPaymentPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState<CreatePaymentDto>({
    amount: 0,
    method: PaymentMethod.PIX,
    status: PaymentStatus.PENDING,
    installments: 1,
  });

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    if (formData.invoiceId && selectedInvoice) {
      const remainingAmount = selectedInvoice.total - (selectedInvoice.total * 0); // TODO: calcular pagamentos existentes
      setFormData(prev => ({
        ...prev,
        amount: remainingAmount > 0 ? remainingAmount : selectedInvoice.total,
      }));
    }
  }, [formData.invoiceId, selectedInvoice]);

  const loadInvoices = async () => {
    try {
      setLoadingData(true);
      const response = await invoicingApi.findAll({ limit: 100, status: InvoiceStatus.ISSUED });
      setInvoices(response.data);
    } catch (err) {
      console.error('Erro ao carregar faturas:', err);
      showNotification('Erro ao carregar faturas', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Valor do pagamento é obrigatório';
    }

    if (selectedInvoice && formData.amount > selectedInvoice.total) {
      newErrors.amount = 'Valor do pagamento não pode ser maior que o valor da fatura';
    }

    if ((formData.method === PaymentMethod.CREDIT_CARD || formData.method === PaymentMethod.DEBIT_CARD) && (!formData.installments || formData.installments < 1)) {
      newErrors.installments = 'Número de parcelas inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showNotification('Preencha todos os campos obrigatórios corretamente', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const data: CreatePaymentDto = {
        ...formData,
        status: formData.status || PaymentStatus.PENDING,
      };

      const payment = await paymentsApi.create(data);
      showNotification('Pagamento criado com sucesso!', 'success');
      router.push(`/payments/${payment.id}`);
    } catch (err: unknown) {
      console.error('Erro ao criar pagamento:', err);
      let errorMessage = 'Erro ao criar pagamento';
      
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string | string[] } } };
        if (axiosError.response?.data?.message) {
          const message = axiosError.response.data.message;
          errorMessage = Array.isArray(message) ? message.join(', ') : message;
        }
      }
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto"></div>
            <p className="mt-4 text-[#7E8691]">Carregando dados...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#D0D6DE] mb-2">Novo Pagamento</h1>
          <p className="text-[#7E8691]">Registre um novo pagamento.</p>
        </div>

        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Fatura */}
            <Select
              label="Fatura (Opcional)"
              value={formData.invoiceId || ''}
              onChange={(e) => {
                const invoiceId = e.target.value || undefined;
                const invoice = invoices.find(inv => inv.id === invoiceId);
                setSelectedInvoice(invoice || null);
                setFormData({ ...formData, invoiceId });
                setErrors({ ...errors, invoiceId: '' });
              }}
              options={[
                { value: '', label: 'Nenhuma' },
                ...invoices.map(invoice => ({
                  value: invoice.id,
                  label: `${invoice.invoiceNumber} - ${formatCurrency(invoice.total)}`,
                })),
              ]}
              error={errors.invoiceId}
            />

            {selectedInvoice && (
              <div className="bg-[#0F1115] border border-[#2A3038] rounded-lg p-4">
                <p className="text-sm text-[#7E8691] mb-1">Valor da Fatura</p>
                <p className="text-lg font-semibold text-[#D0D6DE]">{formatCurrency(selectedInvoice.total)}</p>
              </div>
            )}

            {/* Valor */}
            <Input
              label="Valor do Pagamento"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount || ''}
              onChange={(e) => {
                setFormData({ ...formData, amount: Number.parseFloat(e.target.value) || 0 });
                setErrors({ ...errors, amount: '' });
              }}
              required
              error={errors.amount}
            />

            {/* Método */}
            <Select
              label="Método de Pagamento"
              value={formData.method}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  method: e.target.value as PaymentMethod,
                  installments: (e.target.value === PaymentMethod.CREDIT_CARD || e.target.value === PaymentMethod.DEBIT_CARD) ? formData.installments : 1,
                });
              }}
              options={[
                { value: PaymentMethod.CASH, label: 'Dinheiro' },
                { value: PaymentMethod.CREDIT_CARD, label: 'Cartão de Crédito' },
                { value: PaymentMethod.DEBIT_CARD, label: 'Cartão de Débito' },
                { value: PaymentMethod.PIX, label: 'PIX' },
                { value: PaymentMethod.BOLETO, label: 'Boleto' },
                { value: PaymentMethod.TRANSFER, label: 'Transferência Bancária' },
              ]}
              required
            />

            {/* Parcelas */}
            {(formData.method === PaymentMethod.CREDIT_CARD || formData.method === PaymentMethod.DEBIT_CARD) && (
              <Input
                label="Número de Parcelas"
                type="number"
                min="1"
                max="24"
                value={formData.installments || 1}
                onChange={(e) => {
                  setFormData({ ...formData, installments: Number.parseInt(e.target.value, 10) || 1 });
                  setErrors({ ...errors, installments: '' });
                }}
                error={errors.installments}
              />
            )}

            {/* Status */}
            <Select
              label="Status"
              value={formData.status || PaymentStatus.PENDING}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as PaymentStatus })}
              options={[
                { value: PaymentStatus.PENDING, label: 'Pendente' },
                { value: PaymentStatus.PROCESSING, label: 'Processando' },
                { value: PaymentStatus.COMPLETED, label: 'Pago' },
                { value: PaymentStatus.FAILED, label: 'Falhou' },
              ]}
            />

            {/* Transaction ID */}
            <Input
              label="ID da Transação (Opcional)"
              value={formData.transactionId || ''}
              onChange={(e) => setFormData({ ...formData, transactionId: e.target.value || undefined })}
              placeholder="ID da transação no gateway de pagamento"
            />

            {/* Observações */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-[#D0D6DE] mb-2">
                Observações (Opcional)
              </label>
              <textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value || undefined })}
                className="w-full px-4 py-2 bg-[#0F1115] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]"
                rows={3}
                placeholder="Observações sobre o pagamento..."
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-4 mt-6">
              <Link href="/payments">
                <Button variant="secondary" type="button">
                  Cancelar
                </Button>
              </Link>
              <Button variant="primary" type="submit" isLoading={loading}>
                {loading ? 'Salvando...' : 'Criar Pagamento'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

