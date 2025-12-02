'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { quotesApi, Quote, QuoteStatus, CompleteDiagnosisDto, ProblemCategory } from '@/lib/api/quotes';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DiagnosticPanel } from '@/components/DiagnosticPanel';
import { ChecklistPanel } from '@/components/ChecklistPanel';
import { useNotification } from '@/components/NotificationProvider';

export const dynamic = 'force-dynamic';

const PROBLEM_CATEGORIES = [
  { value: ProblemCategory.MOTOR, label: 'Motor' },
  { value: ProblemCategory.SUSPENSAO, label: 'Suspensão' },
  { value: ProblemCategory.ELETRICA, label: 'Elétrica' },
  { value: ProblemCategory.REFRIGERACAO, label: 'Refrigeração' },
  { value: ProblemCategory.FREIOS, label: 'Freios' },
  { value: ProblemCategory.TRANSMISSAO, label: 'Transmissão' },
  { value: ProblemCategory.PNEUS, label: 'Pneus' },
  { value: ProblemCategory.AR_CONDICIONADO, label: 'Ar Condicionado' },
  { value: ProblemCategory.COMBUSTIVEL, label: 'Combustível' },
  { value: ProblemCategory.ESCAPE, label: 'Escape' },
  { value: ProblemCategory.ILUMINACAO, label: 'Iluminação' },
  { value: ProblemCategory.BATERIA, label: 'Bateria' },
  { value: ProblemCategory.RADIADOR, label: 'Radiador' },
  { value: ProblemCategory.DIRECAO, label: 'Direção' },
  { value: ProblemCategory.OUTROS, label: 'Outros' },
];

export default function DiagnoseQuotePage() {
  const router = useRouter();
  const params = useParams();
  const { showNotification } = useNotification();
  const quoteId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [diagnosis, setDiagnosis] = useState<CompleteDiagnosisDto>({
    identifiedProblemCategory: undefined,
    identifiedProblemDescription: '',
    identifiedProblemId: undefined,
    recommendations: '',
    diagnosticNotes: '',
    estimatedHours: undefined,
  });

  useEffect(() => {
    if (quoteId) {
      loadQuote();
    }
  }, [quoteId]);

  const loadQuote = async () => {
    try {
      setLoading(true);
      const data = await quotesApi.findOne(quoteId);
      setQuote(data);

      // Verificar se o status permite diagnóstico
      if (data.status !== QuoteStatus.AWAITING_DIAGNOSIS) {
        showNotification('Este orçamento não está aguardando diagnóstico', 'error');
        router.push(`/quotes/${quoteId}`);
        return;
      }

      // Se o orçamento não tem mecânico atribuído, atribuir automaticamente ao mecânico atual
      const userId = localStorage.getItem('userId');
      if (!data.assignedMechanicId && userId) {
        try {
          await quotesApi.assignMechanic(quoteId, undefined, 'Mecânico iniciou diagnóstico');
          // Recarregar o orçamento para ter os dados atualizados
          const updatedData = await quotesApi.findOne(quoteId);
          setQuote(updatedData);
        } catch (err) {
          console.error('Erro ao atribuir orçamento:', err);
          // Continuar mesmo se falhar a atribuição
        }
      }

      // Preencher diagnóstico inicial se já existir
      if (data.identifiedProblemCategory || data.estimatedHours) {
        setDiagnosis({
          identifiedProblemCategory: data.identifiedProblemCategory as ProblemCategory,
          identifiedProblemDescription: data.identifiedProblemDescription || '',
          identifiedProblemId: data.identifiedProblemId,
          recommendations: data.recommendations || '',
          diagnosticNotes: data.diagnosticNotes || '',
          estimatedHours: data.estimatedHours,
        });
      }
    } catch (err) {
      console.error('Erro ao carregar orçamento:', err);
      showNotification('Erro ao carregar orçamento', 'error');
      router.push('/quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteDiagnosis = async () => {
    if (!quote) return;

    try {
      setSaving(true);
      await quotesApi.completeDiagnosis(quoteId, diagnosis);
      showNotification('Diagnóstico concluído com sucesso!', 'success');
      router.push(`/quotes/${quoteId}`);
    } catch (err) {
      console.error('Erro ao completar diagnóstico:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao completar diagnóstico';
      showNotification(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDiagnosisUpdate = useCallback((updatedDiagnosis: {
    identifiedProblemId?: string;
    identifiedProblemCategory?: string;
    identifiedProblemDescription?: string;
    diagnosticNotes?: string;
    recommendations?: string;
  }) => {
    setDiagnosis((prev) => ({
      ...prev,
      ...updatedDiagnosis,
    }));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8]"></div>
      </div>
    );
  }

  if (!quote) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#D0D6DE]">Diagnóstico do Orçamento</h1>
              <p className="text-[#7E8691] mt-2">{quote.number}</p>
            </div>
            <Link href="/quotes/pending-diagnosis">
              <Button variant="outline">Voltar</Button>
            </Link>
          </div>
        </div>

        {/* Informações do Orçamento */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Informações do Orçamento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[#7E8691]">Cliente</p>
              <p className="text-[#D0D6DE] font-medium">{quote.customer?.name || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm text-[#7E8691]">Veículo</p>
              <p className="text-[#D0D6DE] font-medium">
                {quote.vehicle 
                  ? `${quote.vehicle.placa || 'Sem placa'} - ${quote.vehicle.make || ''} ${quote.vehicle.model || ''}`.trim() || 'Veículo'
                  : 'Não informado'}
              </p>
            </div>
            {quote.reportedProblemCategory && (
              <div>
                <p className="text-sm text-[#7E8691]">Categoria do Problema Relatado</p>
                <p className="text-[#D0D6DE] font-medium capitalize">
                  {quote.reportedProblemCategory.replace('_', ' ')}
                </p>
              </div>
            )}
            {quote.reportedProblemDescription && (
              <div>
                <p className="text-sm text-[#7E8691]">Descrição do Problema</p>
                <p className="text-[#D0D6DE]">{quote.reportedProblemDescription}</p>
              </div>
            )}
          </div>

          {quote.reportedProblemSymptoms && quote.reportedProblemSymptoms.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-[#7E8691] mb-2">Sintomas Relatados:</p>
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

        {/* Painel de Diagnóstico */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Diagnóstico</h2>
          
          <DiagnosticPanel
            symptoms={quote.reportedProblemSymptoms || []}
            category={quote.reportedProblemCategory as ProblemCategory}
            onUpdateDiagnosis={handleDiagnosisUpdate}
            initialDiagnosis={{
              identifiedProblemId: quote.identifiedProblemId,
              identifiedProblemCategory: quote.identifiedProblemCategory as ProblemCategory,
              identifiedProblemDescription: quote.identifiedProblemDescription,
              diagnosticNotes: quote.diagnosticNotes,
              recommendations: quote.recommendations,
            }}
          />

          {/* Campos adicionais de diagnóstico */}
          <div className="mt-6 space-y-4 border-t border-[#2A3038] pt-6">
            <div>
              <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
                Categoria do Problema Identificado
              </label>
              <Select
                value={diagnosis.identifiedProblemCategory || ''}
                onChange={(e) => setDiagnosis({ 
                  ...diagnosis, 
                  identifiedProblemCategory: e.target.value as ProblemCategory || undefined 
                })}
                options={[
                  { value: '', label: 'Selecione uma categoria' },
                  ...PROBLEM_CATEGORIES,
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
                Descrição do Problema Identificado
              </label>
              <textarea
                className="w-full px-4 py-2 bg-[#0F1115] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]"
                rows={3}
                placeholder="Descreva o problema identificado..."
                value={diagnosis.identifiedProblemDescription || ''}
                onChange={(e) => setDiagnosis({ 
                  ...diagnosis, 
                  identifiedProblemDescription: e.target.value 
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
                Notas de Diagnóstico
              </label>
              <textarea
                className="w-full px-4 py-2 bg-[#0F1115] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]"
                rows={4}
                placeholder="Anotações durante o diagnóstico..."
                value={diagnosis.diagnosticNotes || ''}
                onChange={(e) => setDiagnosis({ 
                  ...diagnosis, 
                  diagnosticNotes: e.target.value 
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
                Recomendações
              </label>
              <textarea
                className="w-full px-4 py-2 bg-[#0F1115] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]"
                rows={4}
                placeholder="Recomendações do mecânico (troca de peça, manutenção preventiva, etc.)..."
                value={diagnosis.recommendations || ''}
                onChange={(e) => setDiagnosis({ 
                  ...diagnosis, 
                  recommendations: e.target.value 
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
                Tempo Estimado de Serviço (horas) <span className="text-[#7E8691] text-xs font-normal">(opcional)</span>
              </label>
              <Input
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                placeholder="Ex: 3.5 (3 horas e 30 minutos)"
                value={diagnosis.estimatedHours?.toString() || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setDiagnosis({
                    ...diagnosis,
                    estimatedHours: value ? parseFloat(value) : undefined,
                  });
                }}
              />
              <p className="text-xs text-[#7E8691] mt-1">
                Informe o tempo estimado que levará para realizar o serviço. Isso ajudará no agendamento e cálculo de fila.
              </p>
            </div>
          </div>
        </div>

        {/* Checklist Pré-Diagnóstico */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 mb-6">
          <ChecklistPanel
            entityType="quote"
            entityId={quoteId}
            checklists={quote.checklists}
            onChecklistsChange={(checklists) => {
              setQuote({ ...quote, checklists });
            }}
            readonly={false}
            canComplete={true}
          />
        </div>

        {/* Botões de ação */}
        <div className="flex items-center justify-end space-x-4">
          <Link href="/quotes/pending-diagnosis">
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button 
            variant="primary" 
            onClick={handleCompleteDiagnosis}
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Concluir Diagnóstico'}
          </Button>
        </div>
      </div>
    </div>
  );
}

