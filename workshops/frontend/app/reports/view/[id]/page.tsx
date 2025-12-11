'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { reportsApi, ReportResponse } from '@/lib/api/reports';
import { Button } from '@/components/ui/Button';
import { useNotification } from '@/components/NotificationProvider';
import { logger } from '@/lib/utils/logger';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export const dynamic = 'force-dynamic';

const COLORS = ['#00E0B8', '#3ABFF8', '#FFCB2B', '#FF4E3D', '#7E8691'];

export default function ReportViewPage() {
  const router = useRouter();
  const params = useParams();
  const { showNotification } = useNotification();
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    if (params.id && typeof params.id === 'string') {
      loadReport(params.id);
    }
  }, [params, router]);

  const loadReport = async (id: string) => {
    try {
      setLoading(true);
      const reportData = await reportsApi.findOne(id);
      
      setReport({
        id: reportData.id,
        type: reportData.type,
        format: reportData.format,
        downloadUrl: reportData.downloadUrl || `/api/reports/${reportData.id}/download`,
        filename: reportData.filename,
        fileSize: reportData.fileSize,
        generatedAt: reportData.generatedAt,
        summary: reportData.summary,
      });
      
      // Processar dados para gráficos
      if (reportData.summary) {
        processChartData(reportData.type, reportData.summary);
      }
    } catch (error: unknown) {
      logger.error('[ReportViewPage] Erro ao carregar relatório:', error);
      showNotification('Relatório não encontrado', 'error');
      router.push('/reports/history');
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (type: string, summary: Record<string, unknown>) => {
    switch (type) {
      case 'sales':
        setChartData({
          type: 'bar',
          data: [
            { name: 'Ordens de Serviço', value: Number(summary.totalServiceOrders) || 0 },
            { name: 'Faturas', value: Number(summary.totalInvoices) || 0 },
            { name: 'Receita Total', value: Number(summary.totalRevenue) || 0 },
          ],
        });
        break;
      case 'financial':
        setChartData({
          type: 'pie',
          data: [
            { name: 'Faturado', value: Number(summary.totalInvoiced) || 0 },
            { name: 'Recebido', value: Number(summary.totalPaid) || 0 },
            { name: 'Pendente', value: Number(summary.totalPending) || 0 },
          ],
        });
        break;
      case 'services':
        if (summary.byStatus && typeof summary.byStatus === 'object') {
          const byStatus = summary.byStatus as Record<string, unknown>;
          setChartData({
            type: 'bar',
            data: Object.entries(byStatus).map(([name, value]) => ({
              name,
              value: Number(value) || 0,
            })),
          });
        }
        break;
      case 'inventory':
        setChartData({
          type: 'bar',
          data: [
            { name: 'Total de Itens', value: Number(summary.totalParts) || 0 },
            { name: 'Estoque Baixo', value: Number(summary.lowStock) || 0 },
            { name: 'Valor Total', value: Number(summary.totalValue) || 0 },
          ],
        });
        break;
      default:
        setChartData(null);
    }
  };

  const handleDownload = async () => {
    if (!report) return;
    
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
      showNotification('Download iniciado!', 'success');
    } catch (error: unknown) {
      logger.error('[ReportViewPage] Erro ao baixar relatório:', error);
      showNotification('Erro ao baixar relatório', 'error');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#2A3038] border-t-[#00E0B8] mx-auto"></div>
          <p className="mt-4 text-[#7E8691]">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#7E8691] mb-4">Relatório não encontrado</p>
          <Link href="/reports/history">
            <Button variant="primary">Voltar ao Histórico</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#D0D6DE] mb-2">Visualização do Relatório</h1>
            <p className="text-[#7E8691]">
              {report.filename} • Gerado em {new Date(report.generatedAt).toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="flex gap-4">
            <Button variant="secondary" onClick={handleDownload}>
              Download
            </Button>
            <Link href="/reports/history">
              <Button variant="secondary">Voltar</Button>
            </Link>
          </div>
        </div>

        {/* Resumo */}
        {report.summary && (
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Resumo</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(report.summary).map(([key, value]) => (
                <div key={key} className="bg-[#2A3038] rounded-lg p-4">
                  <p className="text-sm text-[#7E8691] mb-1">{key}</p>
                  <p className="text-2xl font-bold text-[#00E0B8]">
                    {typeof value === 'number' && key.toLowerCase().includes('total') && key.toLowerCase().includes('value')
                      ? formatCurrency(value)
                      : typeof value === 'number'
                      ? value.toLocaleString('pt-BR')
                      : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gráficos */}
        {chartData && (
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#D0D6DE] mb-6">Visualizações</h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                {chartData.type === 'pie' ? (
                  <PieChart>
                    <Pie
                      data={chartData.data}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => {
                        const percent = entry.percent || 0;
                        return `${entry.name}: ${(percent * 100).toFixed(0)}%`;
                      }}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.data.map((_entry: unknown, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1A1E23',
                        border: '1px solid #2A3038',
                        borderRadius: '8px',
                        color: '#D0D6DE',
                      }}
                    />
                    <Legend />
                  </PieChart>
                ) : (
                  <BarChart data={chartData.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A3038" />
                    <XAxis
                      dataKey="name"
                      stroke="#7E8691"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis
                      stroke="#7E8691"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1A1E23',
                        border: '1px solid #2A3038',
                        borderRadius: '8px',
                        color: '#D0D6DE',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="value" fill="#00E0B8" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

