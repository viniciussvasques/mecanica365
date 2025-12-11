'use client';

import { useState, useEffect, useRef } from 'react';
import { diagnosticApi, DiagnosticSuggestion } from '@/lib/api/diagnostic';
import { ProblemCategory } from '@/lib/api/quotes';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { logger } from '@/lib/utils/logger';

interface DiagnosticPanelProps {
  symptoms: string[];
  category?: ProblemCategory;
  onSelectProblem?: (problem: DiagnosticSuggestion) => void;
  onUpdateDiagnosis?: (diagnosis: {
    identifiedProblemId?: string;
    identifiedProblemCategory?: string;
    identifiedProblemDescription?: string;
    diagnosticNotes?: string;
    recommendations?: string;
  }) => void;
  initialDiagnosis?: {
    identifiedProblemId?: string;
    identifiedProblemCategory?: string;
    identifiedProblemDescription?: string;
    diagnosticNotes?: string;
    recommendations?: string;
  };
}

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

export function DiagnosticPanel({
  symptoms,
  category,
  onSelectProblem,
  onUpdateDiagnosis,
  initialDiagnosis,
}: DiagnosticPanelProps) {
  const [suggestions, setSuggestions] = useState<DiagnosticSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProblemCategory | undefined>(category);
  const [diagnosis, setDiagnosis] = useState({
    identifiedProblemId: initialDiagnosis?.identifiedProblemId || '',
    identifiedProblemCategory: initialDiagnosis?.identifiedProblemCategory || '',
    identifiedProblemDescription: initialDiagnosis?.identifiedProblemDescription || '',
    diagnosticNotes: initialDiagnosis?.diagnosticNotes || '',
    recommendations: initialDiagnosis?.recommendations || '',
  });
  const isInitialMount = useRef(true);
  const onUpdateDiagnosisRef = useRef(onUpdateDiagnosis);

  // Atualizar ref quando a prop mudar (sem causar re-render)
  useEffect(() => {
    onUpdateDiagnosisRef.current = onUpdateDiagnosis;
  }, [onUpdateDiagnosis]);

  useEffect(() => {
    if (symptoms.length > 0) {
      loadSuggestions();
    }
  }, [symptoms, selectedCategory]);

  // Notificar o pai quando o diagnóstico mudar (usando useEffect para evitar setState durante render)
  // Pular a primeira renderização para evitar chamada desnecessária na inicialização
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (onUpdateDiagnosisRef.current) {
      onUpdateDiagnosisRef.current(diagnosis);
    }
  }, [diagnosis]); // Removido onUpdateDiagnosis das dependências

  // Função auxiliar para atualizar diagnóstico
  const updateDiagnosis = (updates: Partial<typeof diagnosis>) => {
    setDiagnosis((prev) => ({ ...prev, ...updates }));
  };

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const result = await diagnosticApi.suggestProblems({
        symptoms,
        category: selectedCategory,
      });
      setSuggestions(result);
    } catch (err: unknown) {
      logger.error('Erro ao carregar sugestões:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProblem = (problem: DiagnosticSuggestion) => {
    updateDiagnosis({
      identifiedProblemId: problem.problemId,
      identifiedProblemCategory: problem.category,
      identifiedProblemDescription: problem.description || problem.name,
    });
    onSelectProblem?.(problem);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig: Record<string, { label: string; className: string }> = {
      low: { label: 'Baixa', className: 'bg-[#00E0B8] text-[#0F1115]' },
      medium: { label: 'Média', className: 'bg-[#3ABFF8] text-white' },
      high: { label: 'Alta', className: 'bg-[#FF4E3D] text-white' },
    };

    const config = severityConfig[severity.toLowerCase()] || severityConfig.medium;
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sugestões de Problemas */}
      {symptoms.length > 0 && (
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#D0D6DE]">Sugestões de Diagnóstico</h3>
            <Select
              label=""
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value as ProblemCategory || undefined)}
              options={[
                { value: '', label: 'Todas as categorias' },
                ...PROBLEM_CATEGORIES,
              ]}
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00E0B8]"></div>
            </div>
          ) : suggestions.length === 0 ? (
            <p className="text-[#7E8691] text-center py-4">Nenhuma sugestão encontrada</p>
          ) : (
            <div className="space-y-3">
              {suggestions.slice(0, 5).map((suggestion) => (
                <div
                  key={suggestion.problemId}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    diagnosis.identifiedProblemId === suggestion.problemId
                      ? 'bg-[#00E0B8]/10 border-[#00E0B8]'
                      : 'bg-[#0F1115] border-[#2A3038] hover:border-[#00E0B8]/50'
                  }`}
                  onClick={() => handleSelectProblem(suggestion)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-[#D0D6DE] font-medium">{suggestion.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {getSeverityBadge(suggestion.severity)}
                        <span className="text-xs text-[#7E8691]">
                          {suggestion.matchScore}% de correspondência
                        </span>
                      </div>
                    </div>
                    {suggestion.estimatedCost && (
                      <span className="text-sm font-semibold text-[#00E0B8]">
                        {formatCurrency(suggestion.estimatedCost)}
                      </span>
                    )}
                  </div>
                  {suggestion.description && (
                    <p className="text-sm text-[#7E8691] mb-2">{suggestion.description}</p>
                  )}
                  {suggestion.solutions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-[#7E8691] mb-1">Soluções sugeridas:</p>
                      <ul className="list-disc list-inside text-xs text-[#7E8691] space-y-1">
                        {suggestion.solutions.slice(0, 3).map((solution, index) => (
                          <li key={index}>{solution}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Formulário de Diagnóstico */}
      <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[#D0D6DE] mb-4">Diagnóstico do Mecânico</h3>
        <div className="space-y-4">
            <Select
              label="Categoria do Problema Identificado"
              value={diagnosis.identifiedProblemCategory || ''}
              onChange={(e) => updateDiagnosis({ identifiedProblemCategory: e.target.value || undefined })}
              options={[
                { value: '', label: 'Selecione uma categoria' },
                ...PROBLEM_CATEGORIES,
              ]}
            />
          <div>
            <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
              Descrição do Problema Identificado
            </label>
            <textarea
              className="w-full px-4 py-2 bg-[#0F1115] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]"
              rows={3}
              placeholder="Descreva o problema identificado..."
              value={diagnosis.identifiedProblemDescription}
              onChange={(e) => updateDiagnosis({ identifiedProblemDescription: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
              Observações do Mecânico
            </label>
            <textarea
              className="w-full px-4 py-2 bg-[#0F1115] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]"
              rows={4}
              placeholder="Anote suas observações durante o diagnóstico..."
              value={diagnosis.diagnosticNotes}
              onChange={(e) => updateDiagnosis({ diagnosticNotes: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
              Recomendações
            </label>
            <textarea
              className="w-full px-4 py-2 bg-[#0F1115] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]"
              rows={3}
              placeholder="Recomendações (troca de peça, manutenção preventiva, etc.)..."
              value={diagnosis.recommendations}
              onChange={(e) => updateDiagnosis({ recommendations: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

