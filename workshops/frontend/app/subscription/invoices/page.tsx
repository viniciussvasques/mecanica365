'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useNotification } from '@/components/NotificationProvider';

interface Invoice {
  id: string;
  number: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  dueDate: string;
  paidAt?: string;
  description: string;
  plan: string;
  billingCycle: 'monthly' | 'annual';
  createdAt: string;
}

// Dados mockados - em produção viriam da API
const MOCK_INVOICES: Invoice[] = [
  {
    id: '1',
    number: 'INV-2024-001',
    amount: 199,
    status: 'paid',
    dueDate: '2024-12-15',
    paidAt: '2024-12-10',
    description: 'Assinatura Mecânica365 - Professional',
    plan: 'workshops_professional',
    billingCycle: 'monthly',
    createdAt: '2024-12-01',
  },
  {
    id: '2',
    number: 'INV-2024-002',
    amount: 199,
    status: 'paid',
    dueDate: '2024-11-15',
    paidAt: '2024-11-12',
    description: 'Assinatura Mecânica365 - Professional',
    plan: 'workshops_professional',
    billingCycle: 'monthly',
    createdAt: '2024-11-01',
  },
  {
    id: '3',
    number: 'INV-2024-003',
    amount: 99,
    status: 'paid',
    dueDate: '2024-10-15',
    paidAt: '2024-10-14',
    description: 'Assinatura Mecânica365 - Starter',
    plan: 'workshops_starter',
    billingCycle: 'monthly',
    createdAt: '2024-10-01',
  },
];

export default function InvoicesPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      // Em produção, buscar da API
      // const response = await billingApi.getInvoices();
      // setInvoices(response);
      
      // Usando dados mockados
      await new Promise(resolve => setTimeout(resolve, 500));
      setInvoices(MOCK_INVOICES);
    } catch (error) {
      console.error('Erro ao carregar faturas:', error);
      showNotification('Erro ao carregar histórico de faturas', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const styles = {
      paid: 'bg-[#4ADE80]/10 text-[#4ADE80]',
      pending: 'bg-[#F59E0B]/10 text-[#F59E0B]',
      overdue: 'bg-[#EF4444]/10 text-[#EF4444]',
      cancelled: 'bg-[#6B7280]/10 text-[#6B7280]',
    };
    const labels = {
      paid: 'Pago',
      pending: 'Pendente',
      overdue: 'Atrasado',
      cancelled: 'Cancelado',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (filter === 'all') return true;
    return invoice.status === filter;
  });

  const totalPaid = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalPending = invoices
    .filter(i => i.status === 'pending' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto mb-4"></div>
          <p className="text-[#7E8691]">Carregando faturas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/subscription" className="text-[#7E8691] hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-3xl font-bold text-white">Histórico de Faturas</h1>
            </div>
            <p className="text-[#7E8691]">Acompanhe todas as suas faturas e pagamentos</p>
          </div>
        </div>

        {/* Cards Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6">
            <p className="text-[#7E8691] text-sm mb-1">Total de Faturas</p>
            <p className="text-3xl font-bold text-white">{invoices.length}</p>
          </div>
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6">
            <p className="text-[#7E8691] text-sm mb-1">Total Pago</p>
            <p className="text-3xl font-bold text-[#4ADE80]">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6">
            <p className="text-[#7E8691] text-sm mb-1">Pendente</p>
            <p className="text-3xl font-bold text-[#F59E0B]">{formatCurrency(totalPending)}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', 'paid', 'pending', 'overdue'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-[#00E0B8] text-[#0F1115]'
                  : 'bg-[#1A1E23] text-[#7E8691] hover:text-white hover:bg-[#2A3038]'
              }`}
            >
              {f === 'all' && 'Todas'}
              {f === 'paid' && 'Pagas'}
              {f === 'pending' && 'Pendentes'}
              {f === 'overdue' && 'Atrasadas'}
            </button>
          ))}
        </div>

        {/* Lista de Faturas */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-[#2A3038] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-[#7E8691]">Nenhuma fatura encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2A3038]">
                    <th className="text-left p-4 text-[#7E8691] font-medium">Fatura</th>
                    <th className="text-left p-4 text-[#7E8691] font-medium">Descrição</th>
                    <th className="text-left p-4 text-[#7E8691] font-medium">Valor</th>
                    <th className="text-left p-4 text-[#7E8691] font-medium">Vencimento</th>
                    <th className="text-left p-4 text-[#7E8691] font-medium">Status</th>
                    <th className="text-right p-4 text-[#7E8691] font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-[#2A3038] hover:bg-[#2A3038]/30">
                      <td className="p-4">
                        <p className="text-white font-medium">{invoice.number}</p>
                        <p className="text-[#7E8691] text-sm">{formatDate(invoice.createdAt)}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-white">{invoice.description}</p>
                        <p className="text-[#7E8691] text-sm">
                          {invoice.billingCycle === 'annual' ? 'Anual' : 'Mensal'}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="text-white font-medium">{formatCurrency(invoice.amount)}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-white">{formatDate(invoice.dueDate)}</p>
                        {invoice.paidAt && (
                          <p className="text-[#4ADE80] text-sm">
                            Pago em {formatDate(invoice.paidAt)}
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="p-2 text-[#7E8691] hover:text-white hover:bg-[#2A3038] rounded-lg transition-colors"
                            title="Ver detalhes"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            className="p-2 text-[#7E8691] hover:text-white hover:bg-[#2A3038] rounded-lg transition-colors"
                            title="Baixar PDF"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                            <Button
                              variant="primary"
                              className="!py-1 !px-3 text-sm"
                            >
                              Pagar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-8 bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Informações de Pagamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[#7E8691] text-sm mb-2">Formas de Pagamento Aceitas</p>
              <div className="flex gap-3">
                <div className="px-3 py-2 bg-[#0F1115] rounded-lg text-sm text-white">
                  💳 Cartão de Crédito
                </div>
                <div className="px-3 py-2 bg-[#0F1115] rounded-lg text-sm text-white">
                  📱 PIX
                </div>
                <div className="px-3 py-2 bg-[#0F1115] rounded-lg text-sm text-white">
                  📄 Boleto
                </div>
              </div>
            </div>
            <div>
              <p className="text-[#7E8691] text-sm mb-2">Precisa de Ajuda?</p>
              <p className="text-[#D0D6DE] text-sm">
                Entre em contato com nosso suporte financeiro pelo email{' '}
                <a href="mailto:financeiro@mecanica365.com.br" className="text-[#00E0B8] hover:underline">
                  financeiro@mecanica365.com.br
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

