'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { knowledgeApi, KnowledgeSummary, KnowledgeFilters } from '@/lib/api/knowledge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useNotification } from '@/components/NotificationProvider';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  StarIcon,
  CheckBadgeIcon,
  ClockIcon,
  UsersIcon,
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
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
};

const RatingStars = ({ rating }: { rating?: number }) => {
  if (!rating) return null;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        />
      ))}
      <span className="text-sm text-[#7E8691] ml-1">({rating.toFixed(1)})</span>
    </div>
  );
};

const KnowledgeCard = ({ knowledge }: { knowledge: KnowledgeSummary }) => {
  return (
    <Link
      href={`/knowledge/${knowledge.id}`}
      className="block bg-[#1A1E23] border border-[#2A3038] rounded-xl p-4 hover:border-[#00E0B8]/50 transition-colors group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-[#D0D6DE] group-hover:text-[#00E0B8] transition-colors">
              {knowledge.problemTitle}
            </h3>
            {knowledge.isVerified && (
              <CheckBadgeIcon className="w-5 h-5 text-[#00E0B8]" />
            )}
          </div>
          <p className="text-sm text-[#7E8691] mb-2 line-clamp-2">
            {knowledge.solutionTitle}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="px-2 py-1 bg-[#0F1115] text-[#7E8691] rounded-md text-xs">
            {categoryLabels[knowledge.category] || knowledge.category}
          </span>
          <RatingStars rating={knowledge.rating} />
        </div>
        <div className="flex items-center gap-1 text-[#7E8691]">
          <UsersIcon className="w-4 h-4" />
          <span className="text-xs">{knowledge.createdByName}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2A3038]">
        <div className="flex items-center gap-4 text-xs text-[#7E8691]">
          <span className="flex items-center gap-1">
            <CheckBadgeIcon className="w-3 h-3" />
            {knowledge.successCount} sucessos
          </span>
          <span className="flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            {formatDate(knowledge.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default function KnowledgePage() {
  const router = useRouter();
  const { showNotification } = useNotification();

  const [knowledge, setKnowledge] = useState<KnowledgeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<KnowledgeFilters>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
    isActive: true,
  });

  const loadKnowledge = useCallback(async () => {
    try {
      setLoading(true);
      const data = await knowledgeApi.getAll(filters);
      setKnowledge(data);
    } catch (err: unknown) {
      logger.error('[KnowledgePage] Erro ao carregar base de conhecimento:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showNotification]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadKnowledge();
  }, [loadKnowledge, router]);

  const handleFilterChange = (key: keyof KnowledgeFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      sortBy: 'createdAt',
      sortOrder: 'desc',
      isActive: true,
    });
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <Link href="/" className="text-[#00E0B8] hover:text-[#3ABFF8] mb-2 inline-block text-sm">
              ← Voltar ao Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#D0D6DE]">Base de Conhecimento</h1>
            <p className="text-[#7E8691] mt-1">
              Soluções colaborativas compartilhadas pela equipe
            </p>
          </div>
          <Button
            onClick={() => router.push('/knowledge/new')}
            className="flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Compartilhar Solução
          </Button>
        </div>

        {/* Filtros */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Input
                label="Buscar"
                placeholder="Problema ou solução..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Select
                label="Categoria"
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                options={[
                  { value: '', label: 'Todas as Categorias' },
                  ...Object.entries(categoryLabels).map(([value, label]) => ({
                    value,
                    label,
                  }))
                ]}
              />
            </div>
            <div>
              <Select
                label="Ordenar por"
                value={filters.sortBy || 'createdAt'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                options={[
                  { value: 'createdAt', label: 'Data de Criação' },
                  { value: 'rating', label: 'Avaliação' },
                  { value: 'successCount', label: 'Sucessos' },
                  { value: 'viewCount', label: 'Visualizações' },
                ]}
              />
            </div>
            <div>
              <Select
                label="Ordem"
                value={filters.sortOrder || 'desc'}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                options={[
                  { value: 'desc', label: 'Mais Recente' },
                  { value: 'asc', label: 'Mais Antigo' },
                ]}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={clearFilters}
            >
              Limpar Filtros
            </Button>
            <div className="flex items-center gap-2 text-sm text-[#7E8691]">
              <input
                type="checkbox"
                id="verifiedOnly"
                checked={filters.isVerified || false}
                onChange={(e) => handleFilterChange('isVerified', e.target.checked)}
                className="rounded border-[#2A3038] bg-[#0F1115] text-[#00E0B8] focus:ring-[#00E0B8]"
              />
              <label htmlFor="verifiedOnly" className="flex items-center gap-1 cursor-pointer">
                <CheckBadgeIcon className="w-4 h-4" />
                Apenas verificadas
              </label>
            </div>
          </div>
        </div>

        {/* Lista de Soluções */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto mb-4"></div>
              <p className="text-[#7E8691]">Carregando soluções...</p>
            </div>
          </div>
        ) : knowledge.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-[#D0D6DE] mb-2">
              Nenhuma solução encontrada
            </h3>
            <p className="text-[#7E8691] mb-6">
              {filters.search || filters.category
                ? 'Tente ajustar os filtros ou seja o primeiro a compartilhar uma solução!'
                : 'Seja o primeiro a compartilhar uma solução com a equipe!'
              }
            </p>
            <Button onClick={() => router.push('/knowledge/new')}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Compartilhar Primeira Solução
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {knowledge.map((item) => (
              <KnowledgeCard key={item.id} knowledge={item} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8 mt-8">
          <p className="text-sm text-[#7E8691]">
            {knowledge.length} solução{knowledge.length !== 1 ? 'ões' : ''} compartilhada{knowledge.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
