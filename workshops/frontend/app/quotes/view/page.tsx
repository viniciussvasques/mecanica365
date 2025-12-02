'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { quotesPublicApi } from '@/lib/api/quotes';
import { Quote, QuoteStatus } from '@/lib/api/quotes';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SignaturePad } from '@/components/SignaturePad';

export const dynamic = 'force-dynamic';

export default function QuoteViewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [approved, setApproved] = useState(false);
  const [rejected, setRejected] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token não fornecido');
      setLoading(false);
      return;
    }

    loadQuote();
  }, [token]);

  const loadQuote = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await quotesPublicApi.viewByToken(token!);
      setQuote(data);
      setSignature(data.customerSignature || null);
      
      // Se já foi aprovado ou rejeitado, mostrar status
      if (data.status === QuoteStatus.ACCEPTED) {
        setApproved(true);
      } else if (data.status === QuoteStatus.REJECTED) {
        setRejected(true);
      }
    } catch (err) {
      console.error('Erro ao carregar orçamento:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar orçamento');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!token || !signature) {
      alert('Por favor, assine o documento antes de aprovar');
      return;
    }

    if (!confirm('Tem certeza que deseja aprovar este orçamento?')) {
      return;
    }

    try {
      setApproving(true);
      await quotesPublicApi.approveByToken(token, signature);
      setApproved(true);
      alert('Orçamento aprovado com sucesso! Você receberá um retorno em breve.');
    } catch (err) {
      console.error('Erro ao aprovar orçamento:', err);
      alert(err instanceof Error ? err.message : 'Erro ao aprovar orçamento');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!token) return;

    if (!rejectReason.trim()) {
      alert('Por favor, informe o motivo da rejeição');
      return;
    }

    if (!confirm('Tem certeza que deseja rejeitar este orçamento?')) {
      return;
    }

    try {
      setRejecting(true);
      await quotesPublicApi.rejectByToken(token, rejectReason);
      setRejected(true);
      alert('Orçamento rejeitado. Entraremos em contato em breve.');
    } catch (err) {
      console.error('Erro ao rejeitar orçamento:', err);
      alert(err instanceof Error ? err.message : 'Erro ao rejeitar orçamento');
    } finally {
      setRejecting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto mb-4"></div>
          <p className="text-[#7E8691]">Carregando orçamento...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#1A1E23] border border-[#FF4E3D] rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-[#D0D6DE] mb-2">Erro ao carregar orçamento</h1>
          <p className="text-[#7E8691] mb-6">{error || 'Orçamento não encontrado'}</p>
          <p className="text-sm text-[#7E8691]">
            O link pode ter expirado ou ser inválido. Entre em contato com a oficina.
          </p>
        </div>
      </div>
    );
  }

  if (approved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F1115] via-[#141820] to-[#0F1115] text-[#D0D6DE] flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-gradient-to-br from-[#1A1E23] to-[#252932] border-2 border-[#00E0B8] rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-20 h-20 bg-[#00E0B8]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">✅</span>
          </div>
          <h1 className="text-3xl font-bold text-[#D0D6DE] mb-3">Orçamento Aprovado!</h1>
          <p className="text-[#7E8691] mb-2 text-lg">
            O orçamento <strong className="text-[#00E0B8]">{quote.number}</strong> foi aprovado com sucesso.
          </p>
          <div className="mt-6 p-4 bg-[#0F1115] rounded-lg border border-[#2A3038]">
            <p className="text-sm text-[#7E8691]">
              Você receberá um retorno em breve sobre o agendamento do serviço.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (rejected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F1115] via-[#141820] to-[#0F1115] text-[#D0D6DE] flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-gradient-to-br from-[#1A1E23] to-[#252932] border-2 border-[#FF4E3D] rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-20 h-20 bg-[#FF4E3D]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">❌</span>
          </div>
          <h1 className="text-3xl font-bold text-[#D0D6DE] mb-3">Orçamento Rejeitado</h1>
          <p className="text-[#7E8691] mb-2 text-lg">
            O orçamento <strong className="text-[#FF4E3D]">{quote.number}</strong> foi rejeitado.
          </p>
          <div className="mt-6 p-4 bg-[#0F1115] rounded-lg border border-[#2A3038]">
            <p className="text-sm text-[#7E8691]">
              Entraremos em contato em breve para discutir alternativas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1115] via-[#141820] to-[#0F1115] text-[#D0D6DE]">
      {/* Header Personalizado */}
      <div className="bg-gradient-to-r from-[#1A1E23] via-[#252932] to-[#1A1E23] border-b-2 border-[#2A3038] py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            {quote.workshopSettings?.logoUrl && quote.workshopSettings.showLogoOnQuotes && (
              <div className="mb-4">
                <img
                  src={quote.workshopSettings.logoUrl}
                  alt={quote.workshopSettings.displayName || quote.tenantName || 'Logo'}
                  className="h-16 sm:h-20 mx-auto object-contain"
                />
              </div>
            )}
            {(quote.workshopSettings?.displayName || quote.tenantName) && (
              <div className="mb-4">
                <p className="text-sm text-[#7E8691] uppercase tracking-wider mb-2">Oficina</p>
                <h2 className="text-xl sm:text-2xl font-bold text-[#D0D6DE]">
                  {quote.workshopSettings?.displayName || quote.tenantName}
                </h2>
              </div>
            )}
            <div
              className="inline-block rounded-full px-5 py-2.5 mb-5 border"
              style={{
                background: quote.workshopSettings?.primaryColor
                  ? `${quote.workshopSettings.primaryColor}20`
                  : 'linear-gradient(to right, rgba(0, 224, 184, 0.2), rgba(58, 191, 248, 0.2))',
                borderColor: quote.workshopSettings?.primaryColor
                  ? `${quote.workshopSettings.primaryColor}40`
                  : 'rgba(0, 224, 184, 0.4)',
              }}
            >
              <span
                className="font-semibold text-sm"
                style={{
                  color: quote.workshopSettings?.primaryColor || '#00E0B8',
                }}
              >
                Orçamento de Serviço Automotivo
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#D0D6DE] mb-4">
              Orçamento{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: quote.workshopSettings?.primaryColor && quote.workshopSettings?.secondaryColor
                    ? `linear-gradient(to right, ${quote.workshopSettings.primaryColor}, ${quote.workshopSettings.secondaryColor})`
                    : 'linear-gradient(to right, #00E0B8, #3ABFF8)',
                }}
              >
                {quote.number}
              </span>
            </h1>
            <p className="text-base sm:text-lg text-[#7E8691] max-w-2xl mx-auto">
              Revise os detalhes abaixo e aprove ou rejeite este orçamento digitalmente
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">

        {/* Informações do Cliente */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-5 sm:p-6 mb-5 sm:mb-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-8 bg-gradient-to-b from-[#00E0B8] to-[#3ABFF8] rounded-full"></div>
            <h2 className="text-lg sm:text-xl font-semibold text-[#D0D6DE]">Informações do Orçamento</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2A3038]">
              <p className="text-xs text-[#7E8691] mb-1 uppercase tracking-wide">Cliente</p>
              <p className="text-base text-[#D0D6DE] font-semibold">{quote.customer?.name || '-'}</p>
            </div>
            <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2A3038]">
              <p className="text-xs text-[#7E8691] mb-1 uppercase tracking-wide">Veículo</p>
              <p className="text-base text-[#D0D6DE] font-semibold">
                {quote.vehicle?.placa ? (
                  <>
                    <span className="text-[#00E0B8]">{quote.vehicle.placa}</span>
                    {quote.vehicle.make && quote.vehicle.model && (
                      <span className="text-[#7E8691] ml-2">
                        - {quote.vehicle.make} {quote.vehicle.model}
                      </span>
                    )}
                  </>
                ) : (
                  `${quote.vehicle?.make || ''} ${quote.vehicle?.model || ''}`.trim() || '-'
                )}
              </p>
            </div>
            <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2A3038]">
              <p className="text-xs text-[#7E8691] mb-1 uppercase tracking-wide">Data de Emissão</p>
              <p className="text-base text-[#D0D6DE] font-semibold">{formatDate(quote.createdAt)}</p>
            </div>
            <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2A3038]">
              <p className="text-xs text-[#7E8691] mb-1 uppercase tracking-wide">Validade</p>
              <p className="text-base text-[#D0D6DE] font-semibold">
                {quote.validUntil ? formatDate(quote.validUntil) : '30 dias'}
              </p>
            </div>
          </div>
        </div>

        {/* Itens do Orçamento */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-5 sm:p-6 mb-5 sm:mb-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-8 bg-gradient-to-b from-[#00E0B8] to-[#3ABFF8] rounded-full"></div>
            <h2 className="text-lg sm:text-xl font-semibold text-[#D0D6DE]">Serviços e Peças</h2>
          </div>
          <div className="space-y-3">
            {quote.items.map((item, index) => (
              <div key={index} className="bg-gradient-to-r from-[#0F1115] to-[#1A1E23] p-4 rounded-lg border border-[#2A3038] hover:border-[#00E0B8]/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-base text-[#D0D6DE] font-semibold">{item.name}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        item.type === 'service' 
                          ? 'bg-[#3ABFF8]/20 text-[#3ABFF8] border border-[#3ABFF8]/30' 
                          : 'bg-[#00E0B8]/20 text-[#00E0B8] border border-[#00E0B8]/30'
                      }`}>
                        {item.type === 'service' ? '🔧 Serviço' : '⚙️ Peça'}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-[#7E8691] mb-3 leading-relaxed">{item.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-[#7E8691]">
                        Qtd: <span className="text-[#D0D6DE] font-medium">{item.quantity}</span>
                      </span>
                      <span className="text-[#7E8691]">
                        Unit: <span className="text-[#D0D6DE] font-medium">{formatCurrency(item.unitCost)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#00E0B8]">{formatCurrency(item.totalCost)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="bg-gradient-to-br from-[#1A1E23] to-[#252932] border-2 border-[#00E0B8]/20 rounded-xl p-5 sm:p-6 mb-5 sm:mb-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-8 bg-gradient-to-b from-[#00E0B8] to-[#3ABFF8] rounded-full"></div>
            <h2 className="text-lg sm:text-xl font-semibold text-[#D0D6DE]">Resumo Financeiro</h2>
          </div>
          <div className="space-y-3">
            {quote.laborCost && quote.laborCost > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-[#2A3038]/50">
                <span className="text-sm text-[#7E8691]">Mão de Obra</span>
                <span className="text-base text-[#D0D6DE] font-medium">{formatCurrency(quote.laborCost)}</span>
              </div>
            )}
            {quote.partsCost && quote.partsCost > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-[#2A3038]/50">
                <span className="text-sm text-[#7E8691]">Peças</span>
                <span className="text-base text-[#D0D6DE] font-medium">{formatCurrency(quote.partsCost)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-[#2A3038]/50">
              <span className="text-sm text-[#7E8691]">Itens do Orçamento</span>
              <span className="text-base text-[#D0D6DE] font-medium">
                {formatCurrency(quote.items.reduce((sum, item) => sum + item.totalCost, 0))}
              </span>
            </div>
            {quote.discount > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-[#2A3038]/50">
                <span className="text-sm text-[#FF4E3D]">Desconto</span>
                <span className="text-base text-[#FF4E3D] font-medium">-{formatCurrency(quote.discount)}</span>
              </div>
            )}
            {quote.taxAmount > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-[#2A3038]/50">
                <span className="text-sm text-[#7E8691]">Impostos</span>
                <span className="text-base text-[#D0D6DE] font-medium">{formatCurrency(quote.taxAmount)}</span>
              </div>
            )}
            <div className="mt-4 pt-4 border-t-2 border-[#00E0B8]/30">
              <div className="flex justify-between items-center">
                <span className="text-xl sm:text-2xl font-bold text-[#D0D6DE]">Total</span>
                <span className="text-2xl sm:text-3xl font-bold text-[#00E0B8] bg-gradient-to-r from-[#00E0B8] to-[#3ABFF8] bg-clip-text text-transparent">
                  {formatCurrency(quote.totalCost)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Assinatura Digital */}
        <div className="bg-[#1A1E23] border-2 border-[#2A3038] rounded-xl p-5 sm:p-6 mb-5 sm:mb-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-8 bg-gradient-to-b from-[#00E0B8] to-[#3ABFF8] rounded-full"></div>
            <h2 className="text-lg sm:text-xl font-semibold text-[#D0D6DE]">Assinatura Digital</h2>
          </div>
          <div className="bg-[#0F1115] rounded-lg p-4 border border-[#2A3038] mb-4">
            <p className="text-sm text-[#7E8691] mb-1">
              <span className="text-[#00E0B8]">⚠️ Importante:</span> Sua assinatura confirma que você concorda com todos os valores e serviços descritos neste orçamento.
            </p>
          </div>
          <SignaturePad
            onSignatureChange={setSignature}
            initialSignature={signature}
          />
        </div>

        {/* Formulário de Rejeição */}
        {showRejectForm && (
          <div className="bg-[#1A1E23] border border-[#FF4E3D] rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Motivo da Rejeição</h2>
            <Input
              label="Por favor, informe o motivo da rejeição"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: Preço muito alto, não posso fazer agora, etc."
              className="mb-4"
            />
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleReject}
                disabled={rejecting || !rejectReason.trim()}
                className="bg-[#FF4E3D] hover:bg-[#FF4E3D]/90"
              >
                {rejecting ? 'Rejeitando...' : 'Confirmar Rejeição'}
              </Button>
              <Button variant="outline" onClick={() => setShowRejectForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-5 sm:p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
            <Button
              variant="primary"
              onClick={handleApprove}
              disabled={approving || !signature}
              className="flex-1 bg-gradient-to-r from-[#00E0B8] to-[#3ABFF8] hover:from-[#00C9A3] hover:to-[#2AA5D9] text-white font-bold py-4 sm:py-5 text-base sm:text-lg shadow-lg shadow-[#00E0B8]/30 transition-all transform hover:scale-[1.02]"
            >
              {approving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Aprovando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  ✅ Aprovar Orçamento
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowRejectForm(!showRejectForm)}
              disabled={approving || rejecting}
              className="flex-1 border-2 border-[#FF4E3D] text-[#FF4E3D] hover:bg-[#FF4E3D]/10 py-4 sm:py-5 text-base sm:text-lg font-semibold transition-all"
            >
              {showRejectForm ? 'Cancelar' : '❌ Rejeitar Orçamento'}
            </Button>
          </div>
          
          {/* Aviso */}
          <div className="bg-[#0F1115] rounded-lg p-4 border border-[#2A3038]">
            <p className="text-xs sm:text-sm text-[#7E8691] text-center leading-relaxed">
              <span className="text-[#00E0B8] font-semibold">ℹ️ Informação:</span> Ao aprovar este orçamento, você concorda com todos os valores e serviços descritos acima. Uma ordem de serviço será criada automaticamente e você receberá um retorno em breve.
            </p>
          </div>
        </div>

        {/* Rodapé com Informações da Oficina */}
        {(quote.workshopSettings?.showAddressOnQuotes ||
          quote.workshopSettings?.showContactOnQuotes ||
          quote.workshopSettings?.quoteFooterText) && (
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-5 sm:p-6 shadow-lg mt-6">
            <div className="space-y-3">
              {quote.workshopSettings?.showAddressOnQuotes &&
                quote.workshopSettings.address && (
                  <div className="text-sm text-[#7E8691]">
                    <strong className="text-[#D0D6DE]">Endereço:</strong>{' '}
                    {quote.workshopSettings.address}
                    {quote.workshopSettings.city && `, ${quote.workshopSettings.city}`}
                    {quote.workshopSettings.state && ` - ${quote.workshopSettings.state}`}
                    {quote.workshopSettings.zipCode && ` ${quote.workshopSettings.zipCode}`}
                  </div>
                )}
              {quote.workshopSettings?.showContactOnQuotes && (
                <div className="flex flex-wrap gap-4 text-sm text-[#7E8691]">
                  {quote.workshopSettings.phone && (
                    <div>
                      <strong className="text-[#D0D6DE]">Telefone:</strong>{' '}
                      {quote.workshopSettings.phone}
                    </div>
                  )}
                  {quote.workshopSettings.email && (
                    <div>
                      <strong className="text-[#D0D6DE]">Email:</strong>{' '}
                      {quote.workshopSettings.email}
                    </div>
                  )}
                  {quote.workshopSettings.whatsapp && (
                    <div>
                      <strong className="text-[#D0D6DE]">WhatsApp:</strong>{' '}
                      {quote.workshopSettings.whatsapp}
                    </div>
                  )}
                </div>
              )}
              {quote.workshopSettings?.quoteFooterText && (
                <div className="pt-3 border-t border-[#2A3038] text-sm text-[#7E8691] text-center">
                  {quote.workshopSettings.quoteFooterText}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

