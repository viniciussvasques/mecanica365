'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { reportsApi, ReportListItem, ReportType, ReportFormat } from '@/lib/api/reports';
import { Button } from '@/components/ui/Button';
import { useNotification } from '@/components/NotificationProvider';

const REPORT_TYPE_NAMES: Record<ReportType, string> = {
  [ReportType.SALES]: 'Vendas',
  [ReportType.SERVICES]: 'Serviços',
  [ReportType.FINANCIAL]: 'Financeiro',
  [ReportType.INVENTORY]: 'Estoque',
  [ReportType.CUSTOMERS]: 'Clientes',
  [ReportType.MECHANICS]: 'Mecânicos',
  [ReportType.QUOTES]: 'Orçamentos',
  [ReportType.INVOICES]: 'Faturas',
  [ReportType.PAYMENTS]: 'Pagamentos',
};

const FORMAT_NAMES: Record<ReportFormat, string> = {
  [ReportFormat.PDF]: 'PDF',
  [ReportFormat.EXCEL]: 'Excel',
  [ReportFormat.CSV]: 'CSV',
  [ReportFormat.JSON]: 'JSON',
};

export default function ReportsHistoryPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadReports();
  }, [router, offset]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const result = await reportsApi.findAll(limit, offset);
      setReports(result.reports);
      setTotal(result.total);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      showNotification('Erro ao carregar histórico de relatórios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (report: ReportListItem) => {
    try {
      const blob = await reportsApi.download(report.id);
      const url = globalThis.window.URL.createObjectURL(blob);
      const a = globalThis.document.createElement('a');
      a.href = url;
      a.download = report.filename;
      globalThis.document.body.appendChild(a);
      a.click();
      a.remove();
      globalThis.window.URL.revokeObjectURL(url);
      showNotification('Download iniciado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao baixar relatório:', error);
      showNotification('Erro ao baixar relatório', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#D0D6DE] mb-2">Histórico de Relatórios</h1>
            <p className="text-[#7E8691]">
              Visualize e baixe relatórios gerados anteriormente
            </p>
          </div>
          <Link href="/reports">
            <Button variant="primary">Gerar Novo Relatório</Button>
          </Link>
        </div>

        {/* Lista de Relatórios */}
        {loading ? (
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-8 text-center">
            <p className="text-[#7E8691]">Carregando relatórios...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-8 text-center">
            <p className="text-[#7E8691] mb-4">Nenhum relatório gerado ainda.</p>
            <Link href="/reports">
              <Button variant="primary">Gerar Primeiro Relatório</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#2A3038]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#D0D6DE] uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#D0D6DE] uppercase tracking-wider">
                        Formato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#D0D6DE] uppercase tracking-wider">
                        Arquivo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#D0D6DE] uppercase tracking-wider">
                        Tamanho
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#D0D6DE] uppercase tracking-wider">
                        Gerado em
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#D0D6DE] uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A3038]">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-[#252930]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-[#D0D6DE]">
                            {REPORT_TYPE_NAMES[report.type] || report.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00E0B8]/20 text-[#00E0B8]">
                            {FORMAT_NAMES[report.format] || report.format}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[#D0D6DE] truncate block max-w-xs">
                            {report.filename}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#7E8691]">
                          {formatFileSize(report.fileSize)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#7E8691]">
                          {formatDate(report.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <Link href={`/reports/view/${report.id}`}>
                              <Button variant="primary" className="text-xs">
                                Visualizar
                              </Button>
                            </Link>
                            <Button
                              variant="secondary"
                              onClick={() => handleDownload(report)}
                              className="text-xs"
                            >
                              Download
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-[#7E8691]">
                  Mostrando {offset + 1} a {Math.min(offset + limit, total)} de {total} relatórios
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0}
                  >
                    Anterior
                  </Button>
                  <span className="px-4 py-2 text-sm text-[#D0D6DE]">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => setOffset(offset + limit)}
                    disabled={offset + limit >= total}
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
  );
}

