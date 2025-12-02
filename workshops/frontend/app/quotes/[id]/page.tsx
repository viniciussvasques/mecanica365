'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { quotesApi, Quote, QuoteStatus, QuoteItem, QuoteItemType, UpdateQuoteDto } from '@/lib/api/quotes';
import { diagnosticApi, DiagnosticSuggestion } from '@/lib/api/diagnostic';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PdfViewer } from '@/components/PdfViewer';
import { SendQuoteModal } from '@/components/SendQuoteModal';
import { ManualApproveModal } from '@/components/ManualApproveModal';
import { useNotification } from '@/components/NotificationProvider';
import { AttachmentsPanel } from '@/components/AttachmentsPanel';
import { ChecklistPanel } from '@/components/ChecklistPanel';

export const dynamic = 'force-dynamic';

export default function QuoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [approvingManually, setApprovingManually] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showManualApproveModal, setShowManualApproveModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItems, setEditingItems] = useState<QuoteItem[]>([]);
  const [editingLaborCost, setEditingLaborCost] = useState<number>(0);
  const [editingPartsCost, setEditingPartsCost] = useState<number>(0);
  const [editingDiscount, setEditingDiscount] = useState<number>(0);
  const [editingTaxAmount, setEditingTaxAmount] = useState<number>(0);
  const [suggestions, setSuggestions] = useState<DiagnosticSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadQuote();
  }, [id]);

  const loadQuote = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await quotesApi.findOne(id);
      setQuote(data);
      
      // Se estiver em modo de diagnóstico, carregar sugestões e preparar edição
      if (data.status === QuoteStatus.DIAGNOSED) {
        setEditingItems(data.items || []);
        setEditingLaborCost(data.laborCost || 0);
        setEditingPartsCost(data.partsCost || 0);
        setEditingDiscount(data.discount || 0);
        setEditingTaxAmount(data.taxAmount || 0);
        setIsEditing(true);
        loadSuggestions(data);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar orçamento';
      setError(errorMessage);
      console.error('Erro ao carregar orçamento:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async (quoteData: Quote) => {
    try {
      setLoadingSuggestions(true);
      if (quoteData.identifiedProblemDescription || (quoteData.reportedProblemSymptoms && quoteData.reportedProblemSymptoms.length > 0)) {
        const symptomsToSuggest = quoteData.reportedProblemSymptoms || [];
        if (quoteData.identifiedProblemDescription) {
          symptomsToSuggest.push(quoteData.identifiedProblemDescription);
        }
        const diagnosticSuggestions = await diagnosticApi.suggestProblems({
          symptoms: symptomsToSuggest,
          category: quoteData.identifiedProblemCategory as any,
        });
        setSuggestions(diagnosticSuggestions);
      }
    } catch (err) {
      console.error('Erro ao carregar sugestões:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSendForDiagnosis = async () => {
    if (!quote) return;
    
    try {
      setLoading(true);
      await quotesApi.sendForDiagnosis(quote.id);
      showNotification('Orçamento enviado para diagnóstico com sucesso!', 'success');
      await loadQuote(); // Recarregar para atualizar o status
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar para diagnóstico';
      showNotification(errorMessage, 'error');
      console.error('Erro ao enviar para diagnóstico:', err);
    } finally {
      setLoading(false);
    }
  };

  const [sending, setSending] = useState(false);

  const handleSendToCustomer = async (method: 'email' | 'whatsapp' | 'sms' | 'link') => {
    if (!quote) return;

    try {
      setSending(true);
      
      // Primeiro, atualizar status para SENT se ainda não estiver (isso gera o token)
      let updatedQuote = quote;
      if (quote.status !== QuoteStatus.SENT) {
        updatedQuote = await quotesApi.sendToCustomer(id);
      }

      // Obter token público (pode estar no quote atualizado)
      const publicToken = updatedQuote.publicToken || quote.publicToken;
      if (!publicToken) {
        throw new Error('Token público não foi gerado. Tente novamente.');
      }

      const publicLink = `${window.location.origin}/quotes/view?token=${publicToken}`;

      // Depois, enviar pelo método escolhido
      switch (method) {
        case 'email':
          if (!quote.customer?.email) {
            throw new Error('Email do cliente não cadastrado');
          }
          // Abrir cliente de email com mensagem pré-formatada
          const emailSubject = encodeURIComponent(`Orçamento ${quote.number} - ${quote.customer.name}`);
          const emailBody = encodeURIComponent(
            `Olá ${quote.customer.name},\n\n` +
            `Segue o link do seu orçamento ${quote.number}.\n` +
            `Você pode visualizar e aprovar online:\n\n` +
            `${publicLink}\n\n` +
            `Atenciosamente,\n` +
            `Equipe da Oficina`
          );
          window.open(`mailto:${quote.customer.email}?subject=${emailSubject}&body=${emailBody}`, '_blank');
          break;
        case 'whatsapp':
          if (!quote.customer?.phone) {
            throw new Error('Telefone do cliente não cadastrado');
          }
          // Abrir WhatsApp Web com mensagem pré-formatada
          const phoneNumber = quote.customer.phone.replace(/\D/g, '');
          const whatsappMessage = encodeURIComponent(
            `Olá! 👋\n\n` +
            `Segue o link do seu orçamento *${quote.number}*.\n` +
            `Você pode visualizar e aprovar online:\n\n` +
            `${publicLink}\n\n` +
            `Aguardamos sua aprovação! 😊`
          );
          window.open(`https://wa.me/${phoneNumber}?text=${whatsappMessage}`, '_blank');
          break;
        case 'sms':
          if (!quote.customer?.phone) {
            throw new Error('Telefone do cliente não cadastrado');
          }
          // Abrir SMS com mensagem pré-formatada
          window.open(`sms:${quote.customer.phone}?body=${encodeURIComponent(`Orçamento ${quote.number}: ${publicLink}`)}`, '_blank');
          break;
        case 'link':
          // Já foi copiado no modal
          break;
      }

      await loadQuote(); // Recarregar para atualizar o status
    } catch (err: unknown) {
      console.error('Erro ao enviar orçamento:', err);
      throw err; // Re-throw para o modal tratar
    } finally {
      setSending(false);
    }
  };

  const autoFillFromSuggestion = (suggestion: DiagnosticSuggestion) => {
    if (!suggestion || !quote) return;

    const newItems: QuoteItem[] = [];

    // Adicionar item principal baseado no problema (com preço inteligente)
    if (suggestion.estimatedCost) {
      newItems.push({
        type: QuoteItemType.SERVICE,
        name: suggestion.name,
        description: suggestion.description || quote.identifiedProblemDescription || '',
        quantity: 1,
        unitCost: suggestion.estimatedCost,
        totalCost: suggestion.estimatedCost,
      });
      
      // Preencher automaticamente mão de obra se for serviço
      if (suggestion.estimatedCost > 0) {
        setEditingLaborCost(Math.round(suggestion.estimatedCost * 0.4 * 100) / 100);
        setEditingPartsCost(Math.round(suggestion.estimatedCost * 0.6 * 100) / 100);
      }
    }

    // Adicionar soluções como itens adicionais
    suggestion.solutions.forEach((solution) => {
      let estimatedSolutionCost = 0;
      
      if (suggestion.estimatedCost) {
        const severityMultiplier = {
          high: 0.5,
          medium: 0.3,
          low: 0.15,
        }[suggestion.severity.toLowerCase()] || 0.3;
        
        estimatedSolutionCost = Math.round(suggestion.estimatedCost * severityMultiplier * 100) / 100;
      } else {
        if (solution.toLowerCase().includes('troca') || solution.toLowerCase().includes('substitui')) {
          estimatedSolutionCost = 150;
        } else if (solution.toLowerCase().includes('repar') || solution.toLowerCase().includes('consert')) {
          estimatedSolutionCost = 100;
        } else {
          estimatedSolutionCost = 80;
        }
      }

      newItems.push({
        type: QuoteItemType.SERVICE,
        name: solution,
        description: `Solução recomendada: ${solution}`,
        quantity: 1,
        unitCost: estimatedSolutionCost,
        totalCost: estimatedSolutionCost,
      });
    });

    if (editingItems.length === 0) {
      setEditingItems(newItems);
      showNotification(`✅ Orçamento preenchido automaticamente com ${newItems.length} item(ns)!`, 'success');
    } else {
      setEditingItems((prev) => [...prev, ...newItems]);
      showNotification(`✅ ${newItems.length} item(ns) adicionado(s) automaticamente!`, 'success');
    }
  };

  const addItem = () => {
    const newItem: QuoteItem = {
      type: QuoteItemType.SERVICE,
      name: '',
      description: '',
      quantity: 1,
      unitCost: 0,
      totalCost: 0,
    };
    setEditingItems([...editingItems, newItem]);
  };

  const updateEditingItem = (index: number, field: keyof QuoteItem, value: any) => {
    const updatedItems = [...editingItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    
    if (field === 'quantity' || field === 'unitCost') {
      updatedItems[index].totalCost = 
        (updatedItems[index].quantity || 1) * (updatedItems[index].unitCost || 0);
    }
    
    setEditingItems(updatedItems);
  };

  const removeEditingItem = (index: number) => {
    setEditingItems(editingItems.filter((_, i) => i !== index));
  };

  const handleSaveItems = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingItems.length === 0) {
      showNotification('Adicione pelo menos um item ao orçamento', 'error');
      return;
    }

    try {
      setSaving(true);
      
      // Formatar items corretamente antes de enviar (remover totalCost que é calculado no backend)
      const formattedItems = editingItems.map(item => {
        const { totalCost, id, ...itemData } = item;
        return {
          type: itemData.type || QuoteItemType.SERVICE,
          name: itemData.name || '',
          description: itemData.description || undefined,
          quantity: itemData.quantity || 1,
          unitCost: itemData.unitCost || 0,
          hours: itemData.hours || undefined,
          serviceId: itemData.serviceId || undefined,
          partId: itemData.partId || undefined,
        };
      }).filter(item => item.name && item.unitCost > 0); // Remover itens inválidos

      if (formattedItems.length === 0) {
        showNotification('Adicione pelo menos um item válido ao orçamento', 'error');
        return;
      }
      
      const updateData: UpdateQuoteDto = {
        items: formattedItems,
        laborCost: editingLaborCost || 0,
        partsCost: editingPartsCost || 0,
        discount: editingDiscount || 0,
        taxAmount: editingTaxAmount || 0,
        status: QuoteStatus.SENT,
      };

      await quotesApi.update(id, updateData);
      showNotification('Orçamento preenchido com sucesso!', 'success');
      setIsEditing(false);
      await loadQuote();
    } catch (err: any) {
      console.error('Erro ao salvar orçamento:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao salvar orçamento';
      showNotification(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveManually = async () => {
    setShowManualApproveModal(true);
  };

  const confirmManualApprove = async (customerSignature?: string, notes?: string) => {
    try {
      setApprovingManually(true);
      const result = await quotesApi.approveManually(id, { customerSignature, notes });
      showNotification('Orçamento aprovado manualmente! Ordem de serviço criada com sucesso.', 'success');
      setShowManualApproveModal(false);
      await loadQuote();
      setTimeout(() => {
        router.push(`/service-orders/${result.serviceOrder.id}`);
      }, 1500);
    } catch (err: unknown) {
      console.error('Erro ao aprovar orçamento manualmente:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao aprovar orçamento';
      showNotification(errorMessage, 'error');
    } finally {
      setApprovingManually(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Tem certeza que deseja aprovar este orçamento? Uma ordem de serviço será criada automaticamente.')) {
      return;
    }

    try {
      setApproving(true);
      const result = await quotesApi.approve(id);
      showNotification('Orçamento aprovado! Ordem de serviço criada com sucesso.', 'success');
      setTimeout(() => {
        router.push(`/service-orders/${result.serviceOrder.id}`);
      }, 1500);
    } catch (err: unknown) {
      console.error('Erro ao aprovar orçamento:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao aprovar orçamento';
      showNotification(errorMessage, 'error');
    } finally {
      setApproving(false);
    }
  };

  const handleGeneratePdf = async () => {
    try {
      setGeneratingPdf(true);
      const blob = await quotesApi.generatePdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orcamento-${quote?.number || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar PDF do orçamento');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const getStatusBadge = (status: QuoteStatus | string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      [QuoteStatus.DRAFT]: { label: 'Rascunho', className: 'bg-[#7E8691] text-white' },
      [QuoteStatus.AWAITING_DIAGNOSIS]: { label: 'Aguardando Diagnóstico', className: 'bg-[#FFA500] text-[#0F1115]' },
      [QuoteStatus.DIAGNOSED]: { label: 'Diagnosticado', className: 'bg-[#3ABFF8] text-white' },
      [QuoteStatus.SENT]: { label: 'Enviado', className: 'bg-[#3ABFF8] text-white' },
      [QuoteStatus.VIEWED]: { label: 'Visualizado', className: 'bg-[#00E0B8] text-[#0F1115]' },
      [QuoteStatus.ACCEPTED]: { label: 'Aceito', className: 'bg-[#00E0B8] text-[#0F1115]' },
      [QuoteStatus.REJECTED]: { label: 'Rejeitado', className: 'bg-[#FF4E3D] text-white' },
      [QuoteStatus.EXPIRED]: { label: 'Expirado', className: 'bg-[#7E8691] text-white' },
      [QuoteStatus.CONVERTED]: { label: 'Convertido', className: 'bg-[#00E0B8] text-[#0F1115]' },
    };

    const config = statusConfig[status] || { 
      label: status || 'Desconhecido', 
      className: 'bg-[#7E8691] text-white' 
    };
    
    return (
      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8]"></div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#FF4E3D]/10 border border-[#FF4E3D] rounded-lg p-6">
            <p className="text-[#FF4E3D]">{error || 'Orçamento não encontrado'}</p>
            <Link href="/quotes" className="mt-4 inline-block">
              <Button variant="outline">Voltar para Orçamentos</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/quotes" className="text-[#00E0B8] hover:text-[#3ABFF8] mb-4 inline-block">
            ← Voltar para Orçamentos
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#D0D6DE]">Orçamento {quote.number}</h1>
              <p className="text-[#7E8691] mt-2">Criado em {formatDate(quote.createdAt)}</p>
            </div>
            <div className="flex items-center gap-4">
              {getStatusBadge(quote.status)}
              <div className="flex gap-2 flex-wrap">
                {quote.status === QuoteStatus.DRAFT && (
                  <Button variant="primary" onClick={handleSendForDiagnosis} disabled={loading}>
                    {loading ? 'Enviando...' : 'Enviar para Diagnóstico'}
                  </Button>
                )}
                {(quote.status === QuoteStatus.DIAGNOSED || quote.status === QuoteStatus.SENT) && (
                  <Button 
                    variant="primary" 
                    onClick={() => setShowSendModal(true)} 
                    disabled={quote.items.length === 0}
                  >
                    📧 Enviar ao Cliente
                  </Button>
                )}
                <Button variant="secondary" onClick={() => setShowPdfViewer(true)}>
                  Ver PDF
                </Button>
                <Button variant="secondary" onClick={handleGeneratePdf} disabled={generatingPdf}>
                  {generatingPdf ? 'Gerando...' : 'Download PDF'}
                </Button>
                {(quote.status === QuoteStatus.SENT || quote.status === QuoteStatus.VIEWED) && !quote.serviceOrderId && (
                  <Button 
                    variant="primary" 
                    onClick={handleApproveManually} 
                    disabled={approvingManually}
                    className="bg-[#3ABFF8] hover:bg-[#3ABFF8]/90 text-white font-bold px-6 py-2"
                  >
                    {approvingManually ? '⏳ Criando OS...' : '✍️ Aprovar Manualmente'}
                  </Button>
                )}
                {(quote.status === QuoteStatus.ACCEPTED || 
                  (quote.status === QuoteStatus.SENT && quote.acceptedAt)) && !quote.serviceOrderId && (
                  <Button 
                    variant="primary" 
                    onClick={handleApprove} 
                    disabled={approving}
                    className="bg-[#00E0B8] hover:bg-[#00C9A3] text-[#0F1115] font-bold px-6 py-2 shadow-lg shadow-[#00E0B8]/30"
                  >
                    {approving ? '⏳ Criando OS...' : '⚙️ Gerar Ordem de Serviço'}
                  </Button>
                )}
                {quote.serviceOrderId && (
                  <Link href={`/service-orders/${quote.serviceOrderId}`}>
                    <Button variant="primary" className="bg-[#00E0B8] hover:bg-[#00C9A3] text-[#0F1115]">
                      📋 Ver Ordem de Serviço
                    </Button>
                  </Link>
                )}
                <Link href={`/quotes/${id}/edit`}>
                  <Button variant="outline">Editar</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Alerta: Orçamento Aprovado - Pronto para Gerar OS */}
        {(quote.status === QuoteStatus.ACCEPTED || 
          quote.status === QuoteStatus.VIEWED || 
          (quote.status === QuoteStatus.SENT && quote.acceptedAt)) && !quote.serviceOrderId && (
          <div className="bg-gradient-to-r from-[#00E0B8]/20 to-[#3ABFF8]/20 border-2 border-[#00E0B8] rounded-lg p-6 mb-6 animate-pulse-glow">
            <div className="flex items-center gap-4">
              <div className="text-4xl">✅</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-[#D0D6DE] mb-2">
                  🎉 Orçamento Aprovado pelo Cliente!
                </h3>
                <p className="text-[#7E8691] mb-4">
                  O cliente aprovou este orçamento. Clique no botão abaixo para gerar a Ordem de Serviço automaticamente.
                </p>
                <Button 
                  variant="primary" 
                  onClick={handleApprove} 
                  disabled={approving}
                  className="bg-[#00E0B8] hover:bg-[#00C9A3] text-[#0F1115] font-bold px-8 py-3 text-lg shadow-lg shadow-[#00E0B8]/40"
                >
                  {approving ? '⏳ Criando Ordem de Serviço...' : '⚙️ Gerar Ordem de Serviço'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Alerta: OS já criada */}
        {quote.serviceOrderId && (
          <div className="bg-gradient-to-r from-[#00E0B8]/10 to-[#3ABFF8]/10 border border-[#00E0B8] rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="text-[#D0D6DE] font-semibold">Ordem de Serviço já criada</p>
                  <p className="text-sm text-[#7E8691]">Este orçamento já foi convertido em uma Ordem de Serviço</p>
                </div>
              </div>
              <Link href={`/service-orders/${quote.serviceOrderId}`}>
                <Button variant="primary" className="bg-[#00E0B8] hover:bg-[#00C9A3] text-[#0F1115]">
                  Ver OS
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Principais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cliente e Veículo */}
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
              <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Informações do Cliente</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#7E8691]">Cliente</p>
                  <p className="text-[#D0D6DE] font-medium">
                    {quote.customer ? (
                      <Link href={`/customers/${quote.customer.id}`} className="text-[#00E0B8] hover:text-[#3ABFF8]">
                        {quote.customer.name}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#7E8691]">Telefone</p>
                  <p className="text-[#D0D6DE]">{quote.customer?.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#7E8691]">Email</p>
                  <p className="text-[#D0D6DE]">{quote.customer?.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#7E8691]">Veículo</p>
                  <p className="text-[#D0D6DE] font-medium">
                    {quote.vehicle ? (
                      <Link href={`/vehicles/${quote.vehicle.id}`} className="text-[#00E0B8] hover:text-[#3ABFF8]">
                        {quote.vehicle.placa || `${quote.vehicle.make} ${quote.vehicle.model}`.trim() || 'Veículo'}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Problema Relatado */}
            {(quote.reportedProblemCategory || quote.reportedProblemDescription) && (
              <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
                <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Problema Relatado</h2>
                <div className="space-y-3">
                  {quote.reportedProblemCategory && (
                    <div>
                      <p className="text-sm text-[#7E8691]">Categoria</p>
                      <p className="text-[#D0D6DE] capitalize">{quote.reportedProblemCategory}</p>
                    </div>
                  )}
                  {quote.reportedProblemDescription && (
                    <div>
                      <p className="text-sm text-[#7E8691]">Descrição</p>
                      <p className="text-[#D0D6DE]">{quote.reportedProblemDescription}</p>
                    </div>
                  )}
                  {quote.reportedProblemSymptoms && quote.reportedProblemSymptoms.length > 0 && (
                    <div>
                      <p className="text-sm text-[#7E8691] mb-2">Sintomas</p>
                      <div className="flex flex-wrap gap-2">
                        {quote.reportedProblemSymptoms.map((symptom, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-[#2A3038] text-[#D0D6DE] rounded-full text-sm"
                          >
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Diagnóstico do Mecânico (quando diagnosticado) */}
            {quote.status === QuoteStatus.DIAGNOSED && quote.assignedMechanic && (
              <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
                <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Diagnóstico do Mecânico</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-[#7E8691]">Mecânico</p>
                    <p className="text-[#D0D6DE] font-medium">{quote.assignedMechanic.name}</p>
                  </div>
                  {quote.identifiedProblemCategory && (
                    <div>
                      <p className="text-sm text-[#7E8691]">Categoria</p>
                      <p className="text-[#D0D6DE] capitalize">{quote.identifiedProblemCategory.replace('_', ' ')}</p>
                    </div>
                  )}
                  {quote.identifiedProblemDescription && (
                    <div>
                      <p className="text-sm text-[#7E8691]">Problema Identificado</p>
                      <p className="text-[#D0D6DE]">{quote.identifiedProblemDescription}</p>
                    </div>
                  )}
                  {quote.diagnosticNotes && (
                    <div>
                      <p className="text-sm text-[#7E8691]">Notas</p>
                      <p className="text-[#D0D6DE]">{quote.diagnosticNotes}</p>
                    </div>
                  )}
                  {quote.recommendations && (
                    <div>
                      <p className="text-sm text-[#7E8691]">Recomendações</p>
                      <p className="text-[#D0D6DE]">{quote.recommendations}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sugestões Automáticas (quando em modo de edição) */}
            {isEditing && suggestions.length > 0 && (
              <div className="bg-[#1A1E23] border border-[#00E0B8] rounded-lg p-6">
                <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">
                  💡 Sugestões Automáticas Baseadas no Diagnóstico
                </h2>
                <p className="text-sm text-[#7E8691] mb-4">
                  Clique em uma sugestão para adicionar automaticamente os itens ao orçamento
                </p>
                {loadingSuggestions ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00E0B8]"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {suggestions.slice(0, 3).map((suggestion) => (
                      <div
                        key={suggestion.problemId}
                        className="bg-[#0F1115] border border-[#2A3038] rounded-lg p-4 hover:border-[#00E0B8]/50 transition-all cursor-pointer"
                        onClick={() => autoFillFromSuggestion(suggestion)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-[#D0D6DE] font-medium mb-1">{suggestion.name}</h3>
                            {suggestion.description && (
                              <p className="text-sm text-[#7E8691] mb-2">{suggestion.description}</p>
                            )}
                            {suggestion.estimatedCost && (
                              <p className="text-sm text-[#00E0B8] font-semibold">
                                {formatCurrency(suggestion.estimatedCost)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Itens do Orçamento */}
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#D0D6DE]">Itens do Orçamento</h2>
                {isEditing && (
                  <Button variant="outline" onClick={addItem} className="text-sm">
                    + Adicionar Item
                  </Button>
                )}
              </div>
              {isEditing ? (
                <form onSubmit={handleSaveItems} className="space-y-4">
                  {editingItems.map((item, index) => (
                    <div key={index} className="bg-[#0F1115] p-4 rounded-lg border border-[#2A3038]">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-4">
                          <Input
                            label="Nome do Item"
                            value={item.name || ''}
                            onChange={(e) => updateEditingItem(index, 'name', e.target.value)}
                            placeholder="Ex: Troca de óleo"
                            required
                          />
                        </div>
                        <div className="md:col-span-3">
                          <Input
                            label="Descrição"
                            value={item.description || ''}
                            onChange={(e) => updateEditingItem(index, 'description', e.target.value)}
                            placeholder="Descrição opcional"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Input
                            label="Quantidade"
                            type="number"
                            min="1"
                            value={item.quantity || 1}
                            onChange={(e) => updateEditingItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Input
                            label="Valor Unitário"
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitCost || 0}
                            onChange={(e) => updateEditingItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                            required
                          />
                        </div>
                        <div className="md:col-span-1 flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => removeEditingItem(index)}
                            className="w-full"
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 text-right">
                        <p className="text-sm text-[#7E8691]">
                          Total: <span className="text-[#00E0B8] font-semibold">{formatCurrency(item.totalCost || 0)}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                  {editingItems.length === 0 && (
                    <p className="text-[#7E8691] text-center py-8">Nenhum item adicionado. Clique em "Adicionar Item" para começar.</p>
                  )}
                  
                  {/* Campos de custos */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <Input
                      label="Mão de Obra"
                      type="number"
                      step="0.01"
                      value={editingLaborCost}
                      onChange={(e) => setEditingLaborCost(parseFloat(e.target.value) || 0)}
                    />
                    <Input
                      label="Peças"
                      type="number"
                      step="0.01"
                      value={editingPartsCost}
                      onChange={(e) => setEditingPartsCost(parseFloat(e.target.value) || 0)}
                    />
                    <Input
                      label="Desconto"
                      type="number"
                      step="0.01"
                      value={editingDiscount}
                      onChange={(e) => setEditingDiscount(parseFloat(e.target.value) || 0)}
                    />
                    <Input
                      label="Impostos"
                      type="number"
                      step="0.01"
                      value={editingTaxAmount}
                      onChange={(e) => setEditingTaxAmount(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button type="submit" variant="primary" disabled={saving || editingItems.length === 0}>
                      {saving ? 'Salvando...' : 'Salvar e Enviar'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                quote.items && quote.items.length > 0 ? (
                  <div className="space-y-3">
                    {quote.items.map((item, index) => (
                      <div key={index} className="bg-[#0F1115] p-4 rounded-lg border border-[#2A3038]">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[#D0D6DE] font-medium">{item.name}</span>
                              <span className="text-xs text-[#7E8691] px-2 py-1 bg-[#2A3038] rounded">
                                {item.type === 'service' ? 'Serviço' : 'Peça'}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-sm text-[#7E8691] mb-2">{item.description}</p>
                            )}
                            <div className="text-sm text-[#7E8691]">
                              Quantidade: {item.quantity} × {formatCurrency(item.unitCost)} = {formatCurrency(item.totalCost)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#7E8691]">Nenhum item adicionado</p>
                )
              )}
            </div>

            {/* Attachments */}
            <AttachmentsPanel
              entityType="quote"
              entityId={id}
              attachments={quote.attachments}
              onAttachmentsChange={(attachments) => {
                setQuote({ ...quote, attachments });
              }}
              readonly={quote.status === QuoteStatus.ACCEPTED || quote.status === QuoteStatus.REJECTED}
            />

            {/* Checklists */}
            <ChecklistPanel
              entityType="quote"
              entityId={id}
              checklists={quote.checklists}
              onChecklistsChange={(checklists) => {
                setQuote({ ...quote, checklists });
              }}
              readonly={quote.status === QuoteStatus.ACCEPTED || quote.status === QuoteStatus.REJECTED}
              canComplete={
                quote.status === QuoteStatus.AWAITING_DIAGNOSIS || 
                quote.status === QuoteStatus.DIAGNOSED ||
                (quote.status === QuoteStatus.PENDING && quote.assignedMechanicId)
              }
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resumo Financeiro */}
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
              <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Resumo Financeiro</h2>
              <div className="space-y-3">
                {(() => {
                  const laborCost = isEditing ? editingLaborCost : (quote.laborCost || 0);
                  const partsCost = isEditing ? editingPartsCost : (quote.partsCost || 0);
                  const discount = isEditing ? editingDiscount : (quote.discount || 0);
                  const taxAmount = isEditing ? editingTaxAmount : (quote.taxAmount || 0);
                  const items = isEditing ? editingItems : (quote.items || []);
                  const itemsTotal = items.reduce((sum, item) => sum + (item.totalCost || 0), 0);
                  const subtotal = itemsTotal + laborCost + partsCost;
                  const total = subtotal - discount + taxAmount;

                  return (
                    <>
                      {laborCost > 0 && (
                        <div className="flex justify-between">
                          <span className="text-[#7E8691]">Mão de Obra:</span>
                          <span className="text-[#D0D6DE]">{formatCurrency(laborCost)}</span>
                        </div>
                      )}
                      {partsCost > 0 && (
                        <div className="flex justify-between">
                          <span className="text-[#7E8691]">Peças:</span>
                          <span className="text-[#D0D6DE]">{formatCurrency(partsCost)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-[#7E8691]">Itens:</span>
                        <span className="text-[#D0D6DE]">{formatCurrency(itemsTotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7E8691]">Subtotal:</span>
                        <span className="text-[#D0D6DE]">{formatCurrency(subtotal)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-[#FF4E3D]">
                          <span>Desconto:</span>
                          <span>-{formatCurrency(discount)}</span>
                        </div>
                      )}
                      {taxAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-[#7E8691]">Impostos:</span>
                          <span className="text-[#D0D6DE]">{formatCurrency(taxAmount)}</span>
                        </div>
                      )}
                      <div className="mt-4 pt-4 border-t border-[#2A3038]">
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold text-[#D0D6DE]">Total:</span>
                          <span className="text-2xl font-bold text-[#00E0B8]">
                            {formatCurrency(total)}
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Informações Adicionais */}
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
              <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Informações Adicionais</h2>
              <div className="space-y-3">
                {quote.assignedMechanic && (
                  <div>
                    <p className="text-sm text-[#7E8691]">Mecânico Atribuído</p>
                    <p className="text-[#D0D6DE] font-medium">{quote.assignedMechanic.name}</p>
                    <p className="text-xs text-[#7E8691]">{quote.assignedMechanic.email}</p>
                  </div>
                )}
                {quote.elevator && (
                  <div>
                    <p className="text-sm text-[#7E8691]">Elevador</p>
                    <p className="text-[#D0D6DE]">
                      <Link href={`/elevators/${quote.elevator.id}`} className="text-[#00E0B8] hover:text-[#3ABFF8]">
                        {quote.elevator.name} ({quote.elevator.number})
                      </Link>
                    </p>
                  </div>
                )}
                {quote.validUntil && (
                  <div>
                    <p className="text-sm text-[#7E8691]">Válido até</p>
                    <p className="text-[#D0D6DE]">{formatDate(quote.validUntil)}</p>
                  </div>
                )}
                {quote.serviceOrderId && (
                  <div>
                    <p className="text-sm text-[#7E8691]">Ordem de Serviço</p>
                    <p className="text-[#D0D6DE]">
                      <Link href={`/service-orders/${quote.serviceOrderId}`} className="text-[#00E0B8] hover:text-[#3ABFF8]">
                        Ver OS #{quote.serviceOrderId.slice(0, 8)}
                      </Link>
                    </p>
                  </div>
                )}
                {(!quote.assignedMechanic && (quote.status === QuoteStatus.DRAFT || quote.status === QuoteStatus.AWAITING_DIAGNOSIS)) && (
                  <div className="pt-3 border-t border-[#2A3038]">
                    <Link href={`/quotes/${id}/assign`}>
                      <Button variant="primary" className="w-full">
                        Atribuir Mecânico
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showPdfViewer && (
        <PdfViewer
          quoteId={id}
          quoteNumber={quote.number}
          onClose={() => setShowPdfViewer(false)}
        />
      )}
      {showSendModal && quote && (
        <SendQuoteModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          quoteId={id}
          quoteNumber={quote.number}
          publicToken={quote.publicToken}
          customerEmail={quote.customer?.email}
          customerPhone={quote.customer?.phone}
          onSend={handleSendToCustomer}
          onRegenerateToken={async () => {
            const updated = await quotesApi.regenerateToken(id);
            await loadQuote();
          }}
        />
      )}
      {showManualApproveModal && quote && (
        <ManualApproveModal
          isOpen={showManualApproveModal}
          onClose={() => setShowManualApproveModal(false)}
          quoteNumber={quote.number}
          onConfirm={confirmManualApprove}
        />
      )}
    </div>
  );
}

