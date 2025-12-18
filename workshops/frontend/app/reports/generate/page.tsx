'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { reportsApi, GenerateReportDto, ReportType, ReportFormat } from '@/lib/api/reports';
import { customersApi, Customer } from '@/lib/api/customers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useNotification } from '@/components/NotificationProvider';
import { logger } from '@/lib/utils/logger';

const REPORT_TYPES_INFO: Record<ReportType, { title: string; description: string; requiresDates: boolean }> = {
  [ReportType.SALES]: {
    title: 'Relatório de Vendas',
    description: 'Análise de vendas por período, serviço, cliente e veículo',
    requiresDates: true,
  },
  [ReportType.SERVICES]: {
    title: 'Relatório de Serviços',
    description: 'Ordens de serviço, serviços mais realizados e análise de eficiência',
    requiresDates: true,
  },
  [ReportType.FINANCIAL]: {
    title: 'Relatório Financeiro',
    description: 'Receitas, despesas, faturas, pagamentos e fluxo de caixa',
    requiresDates: true,
  },
  [ReportType.INVENTORY]: {
    title: 'Relatório de Estoque',
    description: 'Estoque atual, movimentações, peças com estoque baixo e fornecedores',
    requiresDates: false,
  },
  [ReportType.CUSTOMERS]: {
    title: 'Relatório de Clientes',
    description: 'Clientes cadastrados, frequência, histórico de serviços e análise de retenção',
    requiresDates: true,
  },
  [ReportType.MECHANICS]: {
    title: 'Relatório de Mecânicos',
    description: 'Desempenho dos mecânicos, serviços realizados e análise de produtividade',
    requiresDates: true,
  },
  [ReportType.QUOTES]: {
    title: 'Relatório de Orçamentos',
    description: 'Orçamentos criados, aprovados, rejeitados e análise de conversão',
    requiresDates: true,
  },
  [ReportType.INVOICES]: {
    title: 'Relatório de Faturas',
    description: 'Faturas emitidas, pagas, vencidas e análise de faturamento',
    requiresDates: true,
  },
  [ReportType.PAYMENTS]: {
    title: 'Relatório de Pagamentos',
    description: 'Pagamentos recebidos, métodos de pagamento e análise de recebimentos',
    requiresDates: true,
  },
};

export default function GenerateReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reportType, setReportType] = useState<ReportType>(
    (searchParams.get('type') as ReportType) || ReportType.SALES
  );
  const [formData, setFormData] = useState<GenerateReportDto>({
    type: reportType,
    format: ReportFormat.PDF,
    startDate: undefined,
    endDate: undefined,
    filters: {},
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      type: reportType,
      filters: {}, // Resetar filtros ao mudar tipo
    }));
  }, [reportType]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      const customersResponse = await customersApi.findAll({ limit: 100 });
      setCustomers(customersResponse.data);
    } catch (err: unknown) {
      logger.error('Erro ao carregar dados:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const getFiltersForType = (type: ReportType) => {
    switch (type) {
      case ReportType.SALES:
      case ReportType.SERVICES:
        return [
          { key: 'serviceOrderStatus', label: 'Status da OS', type: 'select', options: [
            { value: '', label: 'Todos' },
            { value: 'scheduled', label: 'Agendada' },
            { value: 'in_progress', label: 'Em Andamento' },
            { value: 'completed', label: 'Concluída' },
            { value: 'cancelled', label: 'Cancelada' },
          ]},
          { key: 'customerId', label: 'Cliente', type: 'select', options: [
            { value: '', label: 'Todos' },
            ...customers.map(c => ({ value: c.id, label: c.name })),
          ]},
        ];
      case ReportType.INVENTORY:
        return [
          { key: 'lowStock', label: 'Apenas Estoque Baixo', type: 'checkbox' },
          { key: 'category', label: 'Categoria', type: 'text' },
          { key: 'brand', label: 'Marca', type: 'text' },
        ];
      case ReportType.CUSTOMERS:
        return [
          { key: 'customerId', label: 'Cliente Específico', type: 'select', options: [
            { value: '', label: 'Todos' },
            ...customers.map(c => ({ value: c.id, label: c.name })),
          ]},
        ];
      case ReportType.QUOTES:
        return [
          { key: 'status', label: 'Status', type: 'select', options: [
            { value: '', label: 'Todos' },
            { value: 'draft', label: 'Rascunho' },
            { value: 'sent', label: 'Enviado' },
            { value: 'approved', label: 'Aprovado' },
            { value: 'rejected', label: 'Rejeitado' },
          ]},
        ];
      case ReportType.INVOICES:
        return [
          { key: 'status', label: 'Status', type: 'select', options: [
            { value: '', label: 'Todos' },
            { value: 'draft', label: 'Rascunho' },
            { value: 'issued', label: 'Emitida' },
            { value: 'paid', label: 'Paga' },
            { value: 'overdue', label: 'Vencida' },
          ]},
        ];
      case ReportType.PAYMENTS:
        return [
          { key: 'status', label: 'Status', type: 'select', options: [
            { value: '', label: 'Todos' },
            { value: 'pending', label: 'Pendente' },
            { value: 'completed', label: 'Pago' },
            { value: 'failed', label: 'Falhou' },
          ]},
          { key: 'method', label: 'Método', type: 'select', options: [
            { value: '', label: 'Todos' },
            { value: 'cash', label: 'Dinheiro' },
            { value: 'credit_card', label: 'Cartão de Crédito' },
            { value: 'pix', label: 'PIX' },
          ]},
        ];
      default:
        return [];
    }
  };

  const validateForm = (): boolean => {
    const reportInfo = REPORT_TYPES_INFO[formData.type];
    
    if (reportInfo.requiresDates) {
      if (!formData.startDate || !formData.endDate) {
        showNotification('Por favor, selecione o período (data inicial e final)', 'error');
        return false;
      }
      
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        showNotification('Data inicial não pode ser maior que data final', 'error');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const report = await reportsApi.generate(formData);
      
      // Fazer download do relatório
      try {
        const blob = await reportsApi.download(report.id);
        const url = globalThis.window.URL.createObjectURL(blob);
        const a = globalThis.document.createElement('a');
        a.href = url;
        a.download = report.filename || `relatorio-${report.id}.${report.format}`;
        globalThis.document.body.appendChild(a);
        a.click();
        a.remove();
        globalThis.window.URL.revokeObjectURL(url);
        showNotification('Relatório gerado e baixado com sucesso!', 'success');
        
        // Redirecionar para histórico após 2 segundos
        setTimeout(() => {
          router.push('/reports/history');
        }, 2000);
      } catch (downloadError: unknown) {
        logger.error('Erro ao baixar relatório:', downloadError);
        showNotification('Relatório gerado, mas houve erro ao baixar. Acesse o histórico para baixar.', 'warning');
        // Redirecionar para histórico mesmo assim
        setTimeout(() => {
          router.push('/reports/history');
        }, 2000);
      }
    } catch (err: unknown) {
      logger.error('Erro ao gerar relatório:', err);
      let errorMessage = 'Erro ao gerar relatório';
      
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

  const reportInfo = REPORT_TYPES_INFO[formData.type];
  const filters = getFiltersForType(formData.type);

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#D0D6DE] mb-2">Gerar Relatório</h1>
          <p className="text-[#7E8691]">{reportInfo.description}</p>
        </div>

        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Relatório */}
            <Select
              label="Tipo de Relatório"
              value={formData.type}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              options={Object.entries(REPORT_TYPES_INFO).map(([value, info]) => ({
                value,
                label: info.title,
              }))}
              required
            />

            {/* Formato */}
            <Select
              label="Formato de Exportação"
              value={formData.format}
              onChange={(e) => setFormData({ ...formData, format: e.target.value as ReportFormat })}
              options={[
                { value: ReportFormat.PDF, label: 'PDF (Documento)' },
                { value: ReportFormat.EXCEL, label: 'Excel (CSV)' },
                { value: ReportFormat.CSV, label: 'CSV (Planilha)' },
                { value: ReportFormat.JSON, label: 'JSON (Dados)' },
              ]}
              required
            />

            {/* Período */}
            {reportInfo.requiresDates && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Data Inicial"
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value || undefined })}
                  required={reportInfo.requiresDates}
                />
                <Input
                  label="Data Final"
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value || undefined })}
                  required={reportInfo.requiresDates}
                />
              </div>
            )}

            {/* Filtros Específicos */}
            {filters.length > 0 && (
              <div className="bg-[#0F1115] border border-[#2A3038] rounded-lg p-4">
                <h3 className="text-lg font-semibold text-[#D0D6DE] mb-4">Filtros Adicionais</h3>
                <div className="space-y-4">
                  {filters.map((filter) => (
                    <div key={filter.key}>
                      {filter.type === 'checkbox' ? (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={filter.key}
                            checked={(formData.filters?.[filter.key] as boolean) || false}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                filters: {
                                  ...formData.filters,
                                  [filter.key]: e.target.checked,
                                },
                              });
                            }}
                            className="mr-2"
                          />
                          <label htmlFor={filter.key} className="text-sm text-[#D0D6DE]">
                            {filter.label}
                          </label>
                        </div>
                      ) : filter.type === 'select' ? (
                        <Select
                          label={filter.label}
                          value={(formData.filters?.[filter.key] as string) || ''}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              filters: {
                                ...formData.filters,
                                [filter.key]: e.target.value === '' ? undefined : e.target.value,
                              },
                            });
                          }}
                          options={'options' in filter ? (filter.options || []) : []}
                        />
                      ) : (
                        <Input
                          label={filter.label}
                          value={(formData.filters?.[filter.key] as string) || ''}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              filters: {
                                ...formData.filters,
                                [filter.key]: e.target.value || undefined,
                              },
                            });
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex justify-end space-x-4 mt-6">
              <Link href="/reports">
                <Button variant="secondary" type="button">
                  Cancelar
                </Button>
              </Link>
              <Button variant="primary" type="submit" isLoading={loading}>
                {loading ? 'Gerando...' : 'Gerar Relatório'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

