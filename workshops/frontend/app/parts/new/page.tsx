'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { partsApi, CreatePartDto } from '@/lib/api/parts';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { logger } from '@/lib/utils/logger';

export default function NewPartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<CreatePartDto>({
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (formData.quantity < 0) {
      newErrors.quantity = 'Quantidade não pode ser negativa';
    }

    if (formData.minQuantity < 0) {
      newErrors.minQuantity = 'Quantidade mínima não pode ser negativa';
    }

    if (formData.costPrice < 0) {
      newErrors.costPrice = 'Preço de custo não pode ser negativo';
    }

    if (formData.sellPrice < 0) {
      newErrors.sellPrice = 'Preço de venda não pode ser negativo';
    }

    if (formData.sellPrice < formData.costPrice) {
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
      
      const data: CreatePartDto = {
        partNumber: formData.partNumber?.trim() || undefined,
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        category: formData.category?.trim() || undefined,
        brand: formData.brand?.trim() || undefined,
        supplierId: formData.supplierId?.trim() || undefined,
        quantity: formData.quantity,
        minQuantity: formData.minQuantity,
        costPrice: formData.costPrice,
        sellPrice: formData.sellPrice,
        location: formData.location?.trim() || undefined,
        isActive: formData.isActive ?? true,
      };

      logger.log('[NewPart] Enviando dados:', data);
      await partsApi.create(data);
      router.push('/parts');
    } catch (err: unknown) {
      logger.error('Erro ao criar peça:', err);
      let errorMessage = 'Erro ao criar peça';
      
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

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link href="/parts" className="text-[#00E0B8] hover:text-[#3ABFF8] mb-4 inline-block text-sm sm:text-base">
            ← Voltar para peças
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#D0D6DE]">Nova Peça</h1>
          <p className="text-[#7E8691] mt-2 text-sm sm:text-base">Cadastre uma nova peça no estoque</p>
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
                  label="Nome *"
                  placeholder="Nome da peça"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                  required
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
                  label="Quantidade em Estoque *"
                  type="number"
                  placeholder="0"
                  value={formData.quantity.toString()}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  error={errors.quantity}
                  min={0}
                  required
                />
                <Input
                  label="Quantidade Mínima *"
                  type="number"
                  placeholder="0"
                  value={formData.minQuantity.toString()}
                  onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 0 })}
                  error={errors.minQuantity}
                  min={0}
                  required
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
                  label="Preço de Custo *"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.costPrice.toString()}
                  onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                  error={errors.costPrice}
                  min={0}
                  required
                />
                <Input
                  label="Preço de Venda *"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.sellPrice.toString()}
                  onChange={(e) => setFormData({ ...formData, sellPrice: parseFloat(e.target.value) || 0 })}
                  error={errors.sellPrice}
                  min={0}
                  required
                />
              </div>
              {formData.costPrice > 0 && formData.sellPrice > 0 && (
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
            <Link href="/parts" className="w-full sm:w-auto">
              <Button variant="secondary" type="button" className="w-full sm:w-auto">
                Cancelar
              </Button>
            </Link>
            <Button variant="primary" type="submit" isLoading={loading} className="w-full sm:w-auto">
              Criar Peça
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

