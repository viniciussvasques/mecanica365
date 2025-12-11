'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { knowledgeApi, KnowledgeBase, RateKnowledgeData } from '@/lib/api/knowledge';
import { Button } from '@/components/ui/Button';
import { useNotification } from '@/components/NotificationProvider';
import {
  ArrowLeftIcon,
  CheckBadgeIcon,
  ClockIcon,
  UsersIcon,
  StarIcon,
  CheckIcon,
  CrossIcon,
  EyeOpenIcon,
  Pencil1Icon,
} from '@/components/icons/MechanicIcons';
import { logger } from '@/lib/utils/logger';

const categoryLabels: Record<string, string> = {
  motor: 'Motor',
  freios: 'Freios',
  suspensao: 'Suspensão',
  eletrica: 'Elétrica',
  ar_condicionado: 'Ar Condicionado',
  transmissao: 'Transmissão',
  direcao: 'Direção',
  pneus: 'Pneus',
  carroceria: 'Carroceria',
  exaustao: 'Exaustão',
  outros: 'Outros',
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const RatingStars = ({ rating, interactive = false, onRate }: {
  rating?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating ?? rating ?? 0;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={interactive ? 'button' : undefined}
          onClick={interactive ? () => onRate?.(star) : undefined}
          onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
          onMouseLeave={interactive ? () => setHoverRating(null) : undefined}
          className={`w-5 h-5 ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''} ${
            star <= displayRating ? 'text-yellow-400 fill-current' : 'text-gray-400'
          }`}
        >
          <StarIcon />
        </button>
      ))}
      {rating && (
        <span className="text-sm text-[#7E8691] ml-1">({rating.toFixed(1)})</span>
      )}
    </div>
  );
};

const RatingModal = ({
  isOpen,
  onClose,
  onRate
}: {
  isOpen: boolean;
  onClose: () => void;
  onRate: (worked: boolean, rating: number) => void;
}) => {
  const [worked, setWorked] = useState<boolean | null>(null);
  const [rating, setRating] = useState(0);

  const handleSubmit = () => {
    if (worked !== null && rating > 0) {
      onRate(worked, rating);
      onClose();
      setWorked(null);
      setRating(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[#0F1115]/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1A1E23] border border-[#2A3038] rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-[#D0D6DE] mb-4">Avaliar Solução</h3>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-[#7E8691] mb-2">Esta solução funcionou?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setWorked(true)}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  worked === true
                    ? 'border-[#00E0B8] bg-[#00E0B8]/10 text-[#00E0B8]'
                    : 'border-[#2A3038] text-[#7E8691] hover:border-[#7E8691]'
                }`}
              >
                <CheckIcon className="w-4 h-4 inline mr-2" />
                Sim, funcionou
              </button>
              <button
                type="button"
                onClick={() => setWorked(false)}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  worked === false
                    ? 'border-[#FF4E3D] bg-[#FF4E3D]/10 text-[#FF4E3D]'
                    : 'border-[#2A3038] text-[#7E8691] hover:border-[#7E8691]'
                }`}
              >
                <CrossIcon className="w-4 h-4 inline mr-2" />
                Não funcionou
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm text-[#7E8691] mb-2">Avaliação (1-5 estrelas)</p>
            <RatingStars
              rating={rating}
              interactive
              onRate={setRating}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={worked === null || rating === 0}
            className="flex-1"
          >
            Avaliar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function KnowledgeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { showNotification } = useNotification();

  const [knowledge, setKnowledge] = useState<KnowledgeBase | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  const id = params.id as string;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadKnowledge();
  }, [id]);

  const loadKnowledge = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await knowledgeApi.getById(id);
      setKnowledge(data);
      // Simular se usuário já avaliou (em produção, viria do backend)
      setHasRated(Math.random() > 0.7); // 30% chance de já ter avaliado
    } catch (err: unknown) {
      logger.error('[KnowledgeDetailPage] Erro ao carregar solução:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar solução';
      showNotification(errorMessage, 'error');
      router.push('/knowledge');
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (worked: boolean, rating: number) => {
    if (!knowledge) return;

    try {
      const rateData: RateKnowledgeData = { worked, rating };
      const updated = await knowledgeApi.rate(knowledge.id, rateData);
      setKnowledge(updated);
      setHasRated(true);
      showNotification('Avaliação registrada com sucesso!', 'success');
    } catch (err: unknown) {
      logger.error('[KnowledgeDetailPage] Erro ao avaliar:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao registrar avaliação';
      showNotification(errorMessage, 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto mb-4"></div>
          <p className="text-[#7E8691]">Carregando solução...</p>
        </div>
      </div>
    );
  }

  if (!knowledge) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-[#D0D6DE] mb-2">Solução não encontrada</h1>
          <p className="text-[#7E8691] mb-6">Esta solução pode ter sido removida.</p>
          <Button onClick={() => router.push('/knowledge')}>
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Voltar à Base de Conhecimento
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="secondary"
            onClick={() => router.push('/knowledge')}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Voltar
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-[#1A1E23] border border-[#2A3038] text-[#7E8691] rounded-full text-sm">
                {categoryLabels[knowledge.category] || knowledge.category}
              </span>
              {knowledge.isVerified && (
                <span className="flex items-center gap-1 px-3 py-1 bg-[#00E0B8]/10 border border-[#00E0B8] text-[#00E0B8] rounded-full text-sm">
                  <CheckBadgeIcon className="w-4 h-4" />
                  Verificada
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Problema e Solução */}
          <div className="lg:col-span-2 space-y-6">
            {/* Problema */}
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6">
              <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#FF4E3D] rounded-full"></span>
                Problema
              </h2>
              <h3 className="text-lg font-medium text-[#D0D6DE] mb-3">
                {knowledge.problemTitle}
              </h3>
              <p className="text-[#7E8691] leading-relaxed mb-4">
                {knowledge.problemDescription}
              </p>

              {knowledge.symptoms.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[#D0D6DE] mb-2">Sintomas:</h4>
                  <ul className="space-y-1">
                    {knowledge.symptoms.map((symptom, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-[#7E8691]">
                        <span className="w-1.5 h-1.5 bg-[#FF4E3D] rounded-full"></span>
                        {symptom.symptom}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Solução */}
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6">
              <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#00E0B8] rounded-full"></span>
                Solução
              </h2>
              <h3 className="text-lg font-medium text-[#D0D6DE] mb-3">
                {knowledge.solutionTitle}
              </h3>
              <p className="text-[#7E8691] leading-relaxed mb-4">
                {knowledge.solutionDescription}
              </p>

              {knowledge.solutionSteps.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[#D0D6DE] mb-3">Passos da Solução:</h4>
                  <ol className="space-y-3">
                    {knowledge.solutionSteps
                      .sort((a, b) => a.step - b.step)
                      .map((step) => (
                        <li key={step.step} className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-[#00E0B8] text-[#0F1115] rounded-full flex items-center justify-center text-sm font-medium">
                            {step.step}
                          </span>
                          <p className="text-[#7E8691] leading-relaxed">{step.description}</p>
                        </li>
                      ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Peças Necessárias */}
            {knowledge.partsNeeded.length > 0 && (
              <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#FFA500] rounded-full"></span>
                  Peças Necessárias
                </h2>
                <div className="space-y-3">
                  {knowledge.partsNeeded.map((part, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-[#0F1115] rounded-lg">
                      <div>
                        <p className="font-medium text-[#D0D6DE]">{part.name}</p>
                        {part.partNumber && (
                          <p className="text-sm text-[#7E8691]">Código: {part.partNumber}</p>
                        )}
                      </div>
                      {part.avgCost && (
                        <span className="text-[#00E0B8] font-medium">
                          {formatCurrency(part.avgCost)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {(knowledge.estimatedCost || knowledge.estimatedTime) && (
                  <div className="mt-4 pt-4 border-t border-[#2A3038] flex gap-6">
                    {knowledge.estimatedCost && (
                      <div>
                        <p className="text-sm text-[#7E8691]">Custo Estimado</p>
                        <p className="text-lg font-semibold text-[#00E0B8]">
                          {formatCurrency(knowledge.estimatedCost)}
                        </p>
                      </div>
                    )}
                    {knowledge.estimatedTime && (
                      <div>
                        <p className="text-sm text-[#7E8691]">Tempo Estimado</p>
                        <p className="text-lg font-semibold text-[#3ABFF8]">
                          {knowledge.estimatedTime}h
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Estatísticas */}
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[#D0D6DE] mb-4">Estatísticas</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <EyeOpenIcon className="w-4 h-4 text-[#3ABFF8]" />
                    <span className="text-sm text-[#7E8691]">Visualizações</span>
                  </div>
                  <span className="font-medium text-[#D0D6DE]">{knowledge.viewCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-[#00E0B8]" />
                    <span className="text-sm text-[#7E8691]">Sucessos</span>
                  </div>
                  <span className="font-medium text-[#D0D6DE]">{knowledge.successCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CrossIcon className="w-4 h-4 text-[#FF4E3D]" />
                    <span className="text-sm text-[#7E8691]">Falhas</span>
                  </div>
                  <span className="font-medium text-[#D0D6DE]">{knowledge.failureCount}</span>
                </div>

                {knowledge.rating && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#7E8691]">Avaliação</span>
                    <RatingStars rating={knowledge.rating} />
                  </div>
                )}
              </div>
            </div>

            {/* Autor */}
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[#D0D6DE] mb-4">Autor</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#00E0B8]/20 rounded-full flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 text-[#00E0B8]" />
                </div>
                <div>
                  <p className="font-medium text-[#D0D6DE]">{knowledge.createdByName}</p>
                  <p className="text-sm text-[#7E8691]">{formatDate(knowledge.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Veículos Afetados */}
            {(knowledge.vehicleMakes.length > 0 || knowledge.vehicleModels.length > 0) && (
              <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[#D0D6DE] mb-4">Veículos Afetados</h3>
                <div className="space-y-3">
                  {knowledge.vehicleMakes.length > 0 && (
                    <div>
                      <p className="text-sm text-[#7E8691] mb-2">Marcas:</p>
                      <div className="flex flex-wrap gap-2">
                        {knowledge.vehicleMakes.map((make, index) => (
                          <span key={index} className="px-2 py-1 bg-[#0F1115] text-[#7E8691] rounded text-xs">
                            {make.make}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {knowledge.vehicleModels.length > 0 && (
                    <div>
                      <p className="text-sm text-[#7E8691] mb-2">Modelos:</p>
                      <div className="flex flex-wrap gap-2">
                        {knowledge.vehicleModels.map((model, index) => (
                          <span key={index} className="px-2 py-1 bg-[#0F1115] text-[#7E8691] rounded text-xs">
                            {model.model}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Avaliação */}
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[#D0D6DE] mb-4">Avaliar Solução</h3>
              {hasRated ? (
                <div className="text-center">
                  <div className="text-2xl mb-2">✅</div>
                  <p className="text-sm text-[#7E8691]">Você já avaliou esta solução</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-[#7E8691] mb-4">
                    Esta solução te ajudou a resolver o problema?
                  </p>
                  <Button onClick={() => setRatingModalOpen(true)}>
                    <Pencil1Icon className="w-4 h-4 mr-2" />
                    Avaliar Agora
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal de Avaliação */}
        <RatingModal
          isOpen={ratingModalOpen}
          onClose={() => setRatingModalOpen(false)}
          onRate={handleRate}
        />
      </div>
    </div>
  );
}
