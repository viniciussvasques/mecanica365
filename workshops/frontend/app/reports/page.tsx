'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { ReportType } from '@/lib/api/reports';
import { Button } from '@/components/ui/Button';

const REPORT_TYPES = [
  {
    type: ReportType.SALES,
    title: 'Relatório de Vendas',
    description: 'Análise de vendas por período, serviço, cliente e veículo',
    icon: '💰',
    color: 'bg-[#00E0B8]/20 border-[#00E0B8]',
  },
  {
    type: ReportType.SERVICES,
    title: 'Relatório de Serviços',
    description: 'Ordens de serviço, serviços mais realizados e análise de eficiência',
    icon: '🔧',
    color: 'bg-[#3ABFF8]/20 border-[#3ABFF8]',
  },
  {
    type: ReportType.FINANCIAL,
    title: 'Relatório Financeiro',
    description: 'Receitas, despesas, faturas, pagamentos e fluxo de caixa',
    icon: '💳',
    color: 'bg-[#00E0B8]/20 border-[#00E0B8]',
  },
  {
    type: ReportType.INVENTORY,
    title: 'Relatório de Estoque',
    description: 'Estoque atual, movimentações, peças com estoque baixo e fornecedores',
    icon: '📦',
    color: 'bg-[#FFA500]/20 border-[#FFA500]',
  },
  {
    type: ReportType.CUSTOMERS,
    title: 'Relatório de Clientes',
    description: 'Clientes cadastrados, frequência, histórico de serviços e análise de retenção',
    icon: '👥',
    color: 'bg-[#3ABFF8]/20 border-[#3ABFF8]',
  },
  {
    type: ReportType.MECHANICS,
    title: 'Relatório de Mecânicos',
    description: 'Desempenho dos mecânicos, serviços realizados e análise de produtividade',
    icon: '👨‍🔧',
    color: 'bg-[#7E8691]/20 border-[#7E8691]',
  },
  {
    type: ReportType.QUOTES,
    title: 'Relatório de Orçamentos',
    description: 'Orçamentos criados, aprovados, rejeitados e análise de conversão',
    icon: '📋',
    color: 'bg-[#3ABFF8]/20 border-[#3ABFF8]',
  },
  {
    type: ReportType.INVOICES,
    title: 'Relatório de Faturas',
    description: 'Faturas emitidas, pagas, vencidas e análise de faturamento',
    icon: '🧾',
    color: 'bg-[#00E0B8]/20 border-[#00E0B8]',
  },
  {
    type: ReportType.PAYMENTS,
    title: 'Relatório de Pagamentos',
    description: 'Pagamentos recebidos, métodos de pagamento e análise de recebimentos',
    icon: '💵',
    color: 'bg-[#00E0B8]/20 border-[#00E0B8]',
  },
];

export default function ReportsPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#D0D6DE] mb-2">Relatórios</h1>
            <p className="text-[#7E8691]">
              Gere relatórios detalhados sobre vendas, serviços, estoque, financeiro e muito mais
            </p>
          </div>
          <Link href="/reports/history">
            <Button variant="secondary">Ver Histórico</Button>
          </Link>
        </div>

        {/* Grid de Tipos de Relatórios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REPORT_TYPES.map((report) => (
            <Link
              key={report.type}
              href={`/reports/generate?type=${report.type}`}
              className="block"
            >
              <div className={`bg-[#1A1E23] border-2 ${report.color} rounded-lg p-6 hover:scale-105 transition-transform cursor-pointer h-full`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{report.icon}</div>
                </div>
                <h3 className="text-xl font-semibold text-[#D0D6DE] mb-2">
                  {report.title}
                </h3>
                <p className="text-sm text-[#7E8691]">
                  {report.description}
                </p>
                <div className="mt-4">
                  <Button variant="primary" className="w-full">
                    Gerar Relatório
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Informações */}
        <div className="mt-8 bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Sobre os Relatórios</h2>
          <div className="space-y-2 text-sm text-[#7E8691]">
            <p>
              • Os relatórios podem ser exportados em PDF, Excel (CSV) ou JSON
            </p>
            <p>
              • Você pode filtrar por período, cliente, mecânico e outros critérios
            </p>
            <p>
              • Relatórios grandes podem levar alguns minutos para serem gerados
            </p>
            <p>
              • Os relatórios são gerados sob demanda e podem ser baixados imediatamente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

