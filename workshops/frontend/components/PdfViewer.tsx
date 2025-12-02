'use client';

import { useState } from 'react';
import { Button } from './ui/Button';

interface PdfViewerProps {
  quoteId: string;
  quoteNumber?: string;
  onClose?: () => void;
}

export function PdfViewer({ quoteId, quoteNumber, onClose }: PdfViewerProps) {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPdf = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { quotesApi } = await import('@/lib/api/quotes');
      const blob = await quotesApi.generatePdf(quoteId);
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error('Erro ao carregar PDF:', err);
      setError('Erro ao carregar PDF do orçamento');
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    try {
      setLoading(true);
      const { quotesApi } = await import('@/lib/api/quotes');
      const blob = await quotesApi.generatePdf(quoteId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orcamento-${quoteNumber || quoteId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Erro ao baixar PDF:', err);
      alert('Erro ao baixar PDF do orçamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A3038]">
          <h2 className="text-xl font-semibold text-[#D0D6DE]">
            PDF do Orçamento {quoteNumber || quoteId}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={downloadPdf} disabled={loading}>
              {loading ? 'Gerando...' : 'Download'}
            </Button>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading && !pdfUrl ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto mb-4"></div>
                <p className="text-[#7E8691]">Carregando PDF...</p>
                <Button variant="primary" onClick={loadPdf} className="mt-4">
                  Carregar PDF
                </Button>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-[#FF4E3D] mb-4">{error}</p>
                <Button variant="primary" onClick={loadPdf}>
                  Tentar Novamente
                </Button>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border border-[#2A3038] rounded-lg"
              title="PDF do Orçamento"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Button variant="primary" onClick={loadPdf}>
                Carregar PDF
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

