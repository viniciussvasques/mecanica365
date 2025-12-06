'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { partsApi, Part, UpdatePartDto } from '@/lib/api/parts';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function EditPartPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [loadingPart, setLoadingPart] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<UpdatePartDto>({
    partNumber: '',
    name: '',
    description: '',
    category: '',
    brand: '',
    supplierId: '',
    quantity: 0,
    minQuantity: 0,
    costPrice: 0,
    sellPrice: 0,
    location: '',
    isActive: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadPart();
  }, [id]);

  const loadPart = async () => {
    try {
      setLoadingPart(true);
      const part = await partsApi.findOne(id);
      setFormData({
        partNumber: part.partNumber || '',
        name: part.name,
        description: part.description || '',
        category: part.category || '',
        brand: part.brand || '',
        supplierId: part.supplierId || '',
        quantity: part.quantity,
        minQuantity: part.minQuantity,
        costPrice: part.costPrice,
        sellPrice: part.sellPrice,
        location: part.location || '',
        isActive: part.isActive,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar peça';
      alert(errorMessage);
      console.error('Erro ao carregar peça:', err);
      router.push('/parts');
    } finally {
      setLoadingPart(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.name && formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (formData.quantity !== undefined && formData.quantity < 0) {
      newErrors.quantity = 'Quantidade não pode ser negativa';
    }

    if (formData.minQuantity !== undefined && formData.minQuantity < 0) {
      newErrors.minQuantity = 'Quantidade mínima não pode ser negativa';
    }

    if (formData.costPrice !== undefined && formData.costPrice < 0) {
      newErrors.costPrice = 'Preço de custo não pode ser negativo';
    }

    if (formData.sellPrice !== undefined && formData.sellPrice < 0) {
      newErrors.sellPrice = 'Preço de venda não pode ser negativo';
    }

    if (
      formData.costPrice !== undefined &&
      formData.sellPrice !== undefined &&
      formData.sellPrice < formData.costPrice
    ) {
      newErrors.sellPrice = 'Preço de venda não pode ser menor que o preço de custo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const data: UpdatePartDto = {
        partNumber: formData.partNumber?.trim() || undefined,
        name: formData.name ? formData.name.trim() : undefined,
        description: formData.description?.trim() || undefined,
        category: formData.category?.trim() || undefined,
        brand: formData.brand?.trim() || undefined,
        supplierId: formData.supplierId?.trim() || undefined,
        quantity: formData.quantity,
        minQuantity: formData.minQuantity,
        costPrice: formData.costPrice,
        sellPrice: formData.sellPrice,
        location: formData.location?.trim() || undefined,
        isActive: formData.isActive,
      };

      console.log('[EditPart] Enviando dados:', data);
      await partsApi.update(id, data);
      router.push(`/parts/${id}`);
    } catch (err: unknown) {
      console.error('Erro ao atualizar peça:', err);
      let errorMessage = 'Erro ao atualizar peça';
      
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string | string[] } } };
        if (axiosError.response?.data?.message) {
          const message = axiosError.response.data.message;
          errorMessage = Array.isArray(message) ? message.join(', ') : message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loadingPart) {
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

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link href={`/parts/${id}`} className="text-[#00E0B8] hover:text-[#3ABFF8] mb-4 inline-block text-sm sm:text-base">
            ← Voltar para detalhes
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#D0D6DE]">Editar Peça</h1>
          <p className="text-[#7E8691] mt-2 text-sm sm:text-base">Atualize as informações da peça</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Informações Básicas */}
            <div>
              <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Informações Básicas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Input
                  label="Código da Peça"
                  placeholder="PEC-001 (opcional)"
                  value={formData.partNumber || ''}
                  onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                  maxLength={100}
                />
                <Input
                  label="Nome"
                  placeholder="Nome da peça"
                  value={formData.name ?? ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                />
              </div>
              <div className="mt-4 sm:mt-6">
                <label htmlFor="description" className="block text-sm font-medium text-[#D0D6DE] mb-2">
                  Descrição
                </label>
                <textarea
                  id="description"
                  rows={3}
                  placeholder="Descrição detalhada da peça..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg text-[#F0F4F8] placeholder:text-[#7E8691] placeholder:opacity-60 bg-[#1A1E23] border-[#3A4048] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]/50 focus:border-[#00E0B8] focus:bg-[#1F2329] transition-all duration-200"
                  style={{
                    WebkitTextFillColor: '#F0F4F8',
                    color: '#F0F4F8',
                  }}
                />
              </div>
            </div>

            {/* Categoria e Marca */}
            <div>
              <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Categoria e Marca</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Input
                  label="Categoria"
                  placeholder="Ex: Freios, Filtros, etc."
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  maxLength={100}
                />
                <Input
                  label="Marca"
                  placeholder="Ex: Bosch, Mann Filter, etc."
                  value={formData.brand || ''}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  maxLength={100}
                />
              </div>
            </div>

            {/* Estoque */}
            <div>
              <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Estoque</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Input
                  label="Quantidade em Estoque"
                  type="number"
                  placeholder="0"
                  value={formData.quantity?.toString() || '0'}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  error={errors.quantity}
                  min={0}
                />
                <Input
                  label="Quantidade Mínima"
                  type="number"
                  placeholder="0"
                  value={formData.minQuantity?.toString() || '0'}
                  onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 0 })}
                  error={errors.minQuantity}
                  min={0}
                />
              </div>
              <div className="mt-4 sm:mt-6">
                <Input
                  label="Localização"
                  placeholder="Ex: Estoque A - Prateleira 3"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  maxLength={100}
                />
              </div>
            </div>

            {/* Preços */}
            <div>
              <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Preços</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Input
                  label="Preço de Custo"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.costPrice?.toString() || '0'}
                  onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                  error={errors.costPrice}
                  min={0}
                />
                <Input
                  label="Preço de Venda"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.sellPrice?.toString() || '0'}
                  onChange={(e) => setFormData({ ...formData, sellPrice: parseFloat(e.target.value) || 0 })}
                  error={errors.sellPrice}
                  min={0}
                />
              </div>
              {formData.costPrice && formData.costPrice > 0 && formData.sellPrice && formData.sellPrice > 0 && (
                <div className="mt-4 p-3 bg-[#0F1115] border border-[#2A3038] rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#7E8691]">Margem de Lucro:</span>
                    <span className={`font-semibold ${
                      formData.sellPrice >= formData.costPrice
                        ? 'text-[#00E0B8]'
                        : 'text-[#FF4E3D]'
                    }`}>
                      {formData.sellPrice >= formData.costPrice
                        ? `${(((formData.sellPrice - formData.costPrice) / formData.costPrice) * 100).toFixed(2)}%`
                        : 'Inválido'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-[#7E8691]">Lucro Unitário:</span>
                    <span className={`font-semibold ${
                      formData.sellPrice >= formData.costPrice
                        ? 'text-[#00E0B8]'
                        : 'text-[#FF4E3D]'
                    }`}>
                      {formatCurrency(formData.sellPrice - formData.costPrice)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive ?? true}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-[#2A3038] bg-[#1A1E23] text-[#00E0B8] focus:ring-[#00E0B8] focus:ring-offset-[#0F1115]"
                />
                <span className="text-sm text-[#D0D6DE]">Peça ativa</span>
              </label>
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#2A3038]">
            <Link href={`/parts/${id}`} className="w-full sm:w-auto">
              <Button variant="secondary" type="button" className="w-full sm:w-auto">
                Cancelar
              </Button>
            </Link>
            <Button variant="primary" type="submit" isLoading={loading} className="w-full sm:w-auto">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

