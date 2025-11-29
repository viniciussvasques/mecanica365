'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { vehiclesApi, Vehicle, UpdateVehicleDto } from '@/lib/api/vehicles';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { VEHICLE_BRANDS, VEHICLE_MODELS, VEHICLE_COLORS } from '@/lib/constants/vehicles';

export default function EditVehiclePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<{
    vin: string;
    renavan: string;
    placa: string;
    make: string;
    model: string;
    year: number | undefined;
    color: string;
    mileage: number | undefined;
    isDefault: boolean;
  }>({
    vin: '',
    renavan: '',
    placa: '',
    make: '',
    model: '',
    year: undefined,
    color: '',
    mileage: undefined,
    isDefault: false,
  });
  const [customMake, setCustomMake] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [customColor, setCustomColor] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadVehicle();
  }, [id]);

  const loadVehicle = async () => {
    try {
      setLoadingVehicle(true);
      const vehicle = await vehiclesApi.findOne(id);
      
      // Verificar se os valores são "Outro" ou valores customizados
      const makeValue = vehicle.make || '';
      const modelValue = vehicle.model || '';
      const colorValue = vehicle.color || '';
      
      // Se o valor não está na lista, considerar como customizado
      const isCustomMake = makeValue && !VEHICLE_BRANDS.includes(makeValue);
      const isCustomColor = colorValue && !VEHICLE_COLORS.includes(colorValue);
      
      setFormData({
        vin: vehicle.vin || '',
        renavan: vehicle.renavan || '',
        placa: vehicle.placa || '',
        make: isCustomMake ? 'Outro' : makeValue,
        model: modelValue,
        year: vehicle.year || undefined,
        color: isCustomColor ? 'Outro' : colorValue,
        mileage: vehicle.mileage || undefined,
        isDefault: vehicle.isDefault,
      });
      
      // Verificar se modelo é customizado (depois de definir make)
      const finalMake = isCustomMake ? 'Outro' : makeValue;
      const isCustomModel = modelValue && finalMake && VEHICLE_MODELS[finalMake] && !VEHICLE_MODELS[finalMake].includes(modelValue);
      
      if (isCustomModel) {
        setFormData(prev => ({ ...prev, model: 'Outro' }));
        setCustomModel(modelValue);
      }
      
      // Se for customizado, preencher o campo custom
      if (isCustomMake) setCustomMake(makeValue);
      if (isCustomColor) setCustomColor(colorValue);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar veículo';
      alert(errorMessage);
      console.error('Erro ao carregar veículo:', err);
      router.push('/vehicles');
    } finally {
      setLoadingVehicle(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Pelo menos um identificador deve ser informado (VIN, RENAVAN ou Placa)
    if (!formData.vin && !formData.renavan && !formData.placa) {
      newErrors.vin = 'Informe pelo menos um: VIN, RENAVAN ou Placa';
      newErrors.renavan = 'Informe pelo menos um: VIN, RENAVAN ou Placa';
      newErrors.placa = 'Informe pelo menos um: VIN, RENAVAN ou Placa';
    }

    if (formData.vin && formData.vin.length !== 17) {
      newErrors.vin = 'VIN deve ter exatamente 17 caracteres';
    }

    if (formData.renavan && formData.renavan.length !== 11) {
      newErrors.renavan = 'RENAVAN deve ter exatamente 11 dígitos';
    }

    if (formData.placa && !/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/i.test(formData.placa)) {
      newErrors.placa = 'Placa inválida. Use o formato ABC1234 (Mercosul) ou ABC1D23';
    }

    if (formData.year && (formData.year < 1900 || formData.year > new Date().getFullYear() + 1)) {
      newErrors.year = `Ano deve estar entre 1900 e ${new Date().getFullYear() + 1}`;
    }

    if (formData.mileage !== undefined && formData.mileage < 0) {
      newErrors.mileage = 'Quilometragem deve ser maior ou igual a 0';
    }

    // Validar campos customizados quando "Outro" é selecionado
    if (formData.make === 'Outro' && !customMake.trim()) {
      newErrors.customMake = 'Especifique a marca';
    }

    if (formData.model === 'Outro' && !customModel.trim()) {
      newErrors.customModel = 'Especifique o modelo';
    }

    if (formData.color === 'Outro' && !customColor.trim()) {
      newErrors.customColor = 'Especifique a cor';
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

      const data: UpdateVehicleDto = {
        vin: formData.vin.trim().toUpperCase() || undefined,
        renavan: formData.renavan.trim() || undefined,
        placa: formData.placa.trim().toUpperCase() || undefined,
        make: formData.make === 'Outro' ? customMake.trim() : (formData.make.trim() || undefined),
        model: formData.model === 'Outro' ? customModel.trim() : (formData.model.trim() || undefined),
        year: formData.year || undefined,
        color: formData.color === 'Outro' ? customColor.trim() : (formData.color.trim() || undefined),
        mileage: formData.mileage || undefined,
        isDefault: formData.isDefault,
      };

      console.log('[EditVehicle] Enviando dados:', data);
      await vehiclesApi.update(id, data);
      router.push(`/vehicles/${id}`);
    } catch (err: unknown) {
      console.error('Erro ao atualizar veículo:', err);
      let errorMessage = 'Erro ao atualizar veículo';

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

  if (loadingVehicle) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto"></div>
            <p className="mt-4 text-[#7E8691]">Carregando veículo...</p>
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
          <Link href={`/vehicles/${id}`} className="text-[#00E0B8] hover:text-[#3ABFF8] mb-4 inline-block text-sm sm:text-base">
            ← Voltar para detalhes
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#D0D6DE]">Editar Veículo</h1>
          <p className="text-[#7E8691] mt-2 text-sm sm:text-base">Atualize as informações do veículo</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <Input
                label="VIN"
                placeholder="1HGBH41JXMN109186"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17) })}
                error={errors.vin}
                maxLength={17}
              />
              <Input
                label="RENAVAN"
                placeholder="12345678901"
                value={formData.renavan}
                onChange={(e) => setFormData({ ...formData, renavan: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                error={errors.renavan}
                maxLength={11}
              />
              <Input
                label="Placa"
                placeholder="ABC1234"
                value={formData.placa}
                onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7) })}
                error={errors.placa}
                maxLength={7}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <Select
                  label="Marca"
                  value={formData.make || ''}
                  onChange={(e) => {
                    const selectedMake = e.target.value;
                    setFormData({
                      ...formData,
                      make: selectedMake || undefined,
                      model: selectedMake ? formData.model : undefined, // Limpar modelo se mudar marca
                    });
                    if (selectedMake !== 'Outro') {
                      setCustomMake('');
                    }
                  }}
                  options={[
                    { value: '', label: 'Selecione uma marca' },
                    ...VEHICLE_BRANDS.map((brand) => ({ value: brand, label: brand })),
                  ]}
                  error={errors.customMake}
                />
                {formData.make === 'Outro' && (
                  <Input
                    label="Especifique a marca *"
                    placeholder="Digite a marca"
                    value={customMake}
                    onChange={(e) => setCustomMake(e.target.value)}
                    error={errors.customMake}
                    required
                    className="mt-2"
                  />
                )}
              </div>
              <div>
                {formData.make && VEHICLE_MODELS[formData.make] && (!formData.model || VEHICLE_MODELS[formData.make].includes(formData.model)) ? (
                  <>
                    <Select
                      label="Modelo"
                      value={formData.model || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({ ...formData, model: value || undefined });
                        if (value !== 'Outro') {
                          setCustomModel('');
                        }
                      }}
                      options={[
                        { value: '', label: 'Selecione um modelo' },
                        ...VEHICLE_MODELS[formData.make].map((model) => ({ value: model, label: model })),
                      ]}
                      error={errors.customModel}
                    />
                    {formData.model === 'Outro' && (
                      <Input
                        label="Especifique o modelo *"
                        placeholder="Digite o modelo"
                        value={customModel}
                        onChange={(e) => setCustomModel(e.target.value)}
                        error={errors.customModel}
                        required
                        className="mt-2"
                      />
                    )}
                  </>
                ) : (
                  <Input
                    label="Modelo"
                    placeholder="Digite o modelo"
                    value={formData.model || ''}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value || undefined })}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <Input
                label="Ano"
                type="number"
                placeholder="2020"
                value={formData.year || ''}
                onChange={(e) => setFormData({ ...formData, year: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                error={errors.year}
                min={1900}
                max={new Date().getFullYear() + 1}
              />
              <Select
                label="Cor"
                value={formData.color || ''}
                onChange={(e) => setFormData({ ...formData, color: e.target.value || undefined })}
                options={[
                  { value: '', label: 'Selecione uma cor' },
                  ...VEHICLE_COLORS.map((color) => ({ value: color, label: color })),
                ]}
              />
              <Input
                label="Quilometragem"
                type="number"
                placeholder="50000"
                value={formData.mileage || ''}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                error={errors.mileage}
                min={0}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4 rounded border-[#3A4048] bg-[#1A1E23] text-[#00E0B8] focus:ring-[#00E0B8] focus:ring-2"
              />
              <label htmlFor="isDefault" className="text-sm text-[#D0D6DE]">
                Marcar como veículo padrão do cliente
              </label>
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#2A3038]">
            <Link href={`/vehicles/${id}`} className="w-full sm:w-auto">
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

