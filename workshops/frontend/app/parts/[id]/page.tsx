'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { partsApi, Part } from '@/lib/api/parts';
import { Button } from '@/components/ui/Button';
import { logger } from '@/lib/utils/logger';
import { authStorage } from '@/lib/utils/localStorage';

export default function PartDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [part, setPart] = useState<Part | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = authStorage.getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    loadPart();
  }, [id]);

  const loadPart = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await partsApi.findOne(id);
      setPart(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar peça';
      setError(errorMessage);
      logger.error('Erro ao carregar peça:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta peça?')) {
      return;
    }

    try {
      await partsApi.remove(id);
      router.push('/parts');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir peça';
      alert(errorMessage);
      logger.error('Erro ao excluir peça:', err);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStockStatus = (quantity: number, minQuantity: number): { text: string; color: string; bgColor: string } => {
    if (quantity <= 0) {
      return { text: 'Sem estoque', color: 'text-[#FF4E3D]', bgColor: 'bg-[#FF4E3D]/20' };
    }
    if (quantity <= minQuantity) {
      return { text: 'Estoque baixo', color: 'text-[#FFA500]', bgColor: 'bg-[#FFA500]/20' };
    }
    return { text: 'Em estoque', color: 'text-[#00E0B8]', bgColor: 'bg-[#00E0B8]/20' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto"></div>
            <p className="mt-4 text-[#7E8691]">Carregando peça...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !part) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#FF4E3D]/10 border border-[#FF4E3D] rounded-lg p-6">
            <p className="text-[#FF4E3D]">{error || 'Peça não encontrada'}</p>
            <Link href="/parts" className="mt-4 inline-block">
              <Button variant="secondary">Voltar para peças</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus(part.quantity, part.minQuantity);
  const profitMargin = part.costPrice > 0
    ? (((part.sellPrice - part.costPrice) / part.costPrice) * 100).toFixed(2)
    : '0.00';
  const profitPerUnit = part.sellPrice - part.costPrice;

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/parts" className="text-[#00E0B8] hover:text-[#3ABFF8] mb-4 inline-block">
            ← Voltar para peças
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#D0D6DE]">{part.name}</h1>
              <p className="text-[#7E8691] mt-2">Detalhes da peça</p>
            </div>
            <div className="flex items-center space-x-2">
              <Link href={`/parts/${part.id}/edit`}>
                <Button variant="primary">Editar</Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-[#FF4E3D] border-[#FF4E3D] hover:bg-[#FF4E3D]/10"
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>

        {/* Informações */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 space-y-6">
          {/* Informações Básicas */}
          <div>
            <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Informações Básicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {part.partNumber && (
                <div>
                  <p className="text-sm text-[#7E8691] mb-1">Código da Peça</p>
                  <p className="text-[#D0D6DE] font-mono">{part.partNumber}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-[#7E8691] mb-1">Nome</p>
                <p className="text-[#D0D6DE]">{part.name}</p>
              </div>
              {part.category && (
                <div>
                  <p className="text-sm text-[#7E8691] mb-1">Categoria</p>
                  <p className="text-[#D0D6DE]">{part.category}</p>
                </div>
              )}
              {part.brand && (
                <div>
                  <p className="text-sm text-[#7E8691] mb-1">Marca</p>
                  <p className="text-[#D0D6DE]">{part.brand}</p>
                </div>
              )}
              {part.supplier && (
                <div>
                  <p className="text-sm text-[#7E8691] mb-1">Fornecedor</p>
                  <p className="text-[#D0D6DE]">{part.supplier.name}</p>
                </div>
              )}
              {part.location && (
                <div>
                  <p className="text-sm text-[#7E8691] mb-1">Localização</p>
                  <p className="text-[#D0D6DE]">{part.location}</p>
                </div>
              )}
            </div>
            {part.description && (
              <div className="mt-6">
                <p className="text-sm text-[#7E8691] mb-1">Descrição</p>
                <p className="text-[#D0D6DE] whitespace-pre-wrap">{part.description}</p>
              </div>
            )}
          </div>

          {/* Estoque */}
          <div className="pt-6 border-t border-[#2A3038]">
            <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Estoque</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-[#7E8691] mb-1">Quantidade Atual</p>
                <p className="text-2xl font-bold text-[#D0D6DE]">{part.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-[#7E8691] mb-1">Quantidade Mínima</p>
                <p className="text-2xl font-bold text-[#D0D6DE]">{part.minQuantity}</p>
              </div>
              <div>
                <p className="text-sm text-[#7E8691] mb-1">Status do Estoque</p>
                <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${stockStatus.color} ${stockStatus.bgColor}`}>
                  {stockStatus.text}
                </span>
              </div>
            </div>
          </div>

          {/* Preços */}
          <div className="pt-6 border-t border-[#2A3038]">
            <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Preços</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-[#7E8691] mb-1">Preço de Custo</p>
                <p className="text-2xl font-bold text-[#D0D6DE]">{formatCurrency(part.costPrice)}</p>
              </div>
              <div>
                <p className="text-sm text-[#7E8691] mb-1">Preço de Venda</p>
                <p className="text-2xl font-bold text-[#00E0B8]">{formatCurrency(part.sellPrice)}</p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-[#0F1115] border border-[#2A3038] rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#7E8691] mb-1">Margem de Lucro</p>
                  <p className={`text-xl font-semibold ${
                    profitMargin >= '0' ? 'text-[#00E0B8]' : 'text-[#FF4E3D]'
                  }`}>
                    {profitMargin}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#7E8691] mb-1">Lucro Unitário</p>
                  <p className={`text-xl font-semibold ${
                    profitPerUnit >= 0 ? 'text-[#00E0B8]' : 'text-[#FF4E3D]'
                  }`}>
                    {formatCurrency(profitPerUnit)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="pt-6 border-t border-[#2A3038]">
            <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Status</h2>
            <div>
              <span
                className={`px-3 py-1 rounded text-sm font-semibold ${
                  part.isActive
                    ? 'bg-[#00E0B8]/20 text-[#00E0B8]'
                    : 'bg-[#7E8691]/20 text-[#7E8691]'
                }`}
              >
                {part.isActive ? 'Ativa' : 'Inativa'}
              </span>
            </div>
          </div>

          {/* Datas */}
          <div className="pt-6 border-t border-[#2A3038]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-[#7E8691] mb-1">Criado em</p>
                <p className="text-[#D0D6DE]">
                  {new Date(part.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-[#7E8691] mb-1">Última atualização</p>
                <p className="text-[#D0D6DE]">
                  {new Date(part.updatedAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

