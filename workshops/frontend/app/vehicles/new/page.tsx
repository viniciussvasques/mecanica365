'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { vehiclesApi, CreateVehicleDto } from '@/lib/api/vehicles';
import { customersApi, Customer } from '@/lib/api/customers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { VEHICLE_BRANDS, VEHICLE_MODELS, VEHICLE_COLORS } from '@/lib/constants/vehicles';

export default function NewVehiclePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<CreateVehicleDto>({
    customerId: '',
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

    // Verificar se há customerId na URL
    const customerIdFromUrl = searchParams.get('customerId');
    if (customerIdFromUrl) {
      setFormData((prev) => ({ ...prev, customerId: customerIdFromUrl }));
    }

    loadCustomers();
  }, [searchParams]);

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const allCustomers: Customer[] = [];
      let page = 1;
      let hasMore = true;
      const limit = 100; // Limite máximo permitido pelo backend

      // Buscar todos os clientes paginadamente
      while (hasMore) {
        const response = await customersApi.findAll({ page, limit });
        allCustomers.push(...response.data);
        
        if (response.data.length < limit || page >= Math.ceil(response.total / limit)) {
          hasMore = false;
        } else {
          page++;
        }
      }

      setCustomers(allCustomers);
    } catch (err: unknown) {
      console.error('Erro ao carregar clientes:', err);
      alert('Erro ao carregar lista de clientes');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerId) {
      newErrors.customerId = 'Cliente é obrigatório';
    }

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

    if (formData.placa && !/^[A-Z]{3}\d[A-Z\d]\d{2}$/i.test(formData.placa)) {
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

      // Validar que pelo menos um identificador seja fornecido
      const hasVin = formData.vin?.trim();
      const hasRenavan = formData.renavan?.trim();
      const hasPlaca = formData.placa?.trim();
      
      if (!hasVin && !hasRenavan && !hasPlaca) {
        setErrors({ 
          ...errors, 
          vin: 'Informe pelo menos um identificador: VIN, RENAVAN ou Placa',
          renavan: 'Informe pelo menos um identificador: VIN, RENAVAN ou Placa',
          placa: 'Informe pelo menos um identificador: VIN, RENAVAN ou Placa',
        });
        return;
      }

      // Preparar dados removendo campos undefined e strings vazias
      const data: CreateVehicleDto = {
        customerId: formData.customerId,
        ...(hasVin && formData.vin && { vin: formData.vin.trim().toUpperCase() }),
        ...(hasRenavan && formData.renavan && { renavan: formData.renavan.trim() }),
        ...(hasPlaca && formData.placa && { placa: formData.placa.trim().toUpperCase() }),
        ...(formData.make === 'Outro' 
          ? (customMake.trim() && { make: customMake.trim() })
          : (formData.make?.trim() && { make: formData.make.trim() })),
        ...(formData.model === 'Outro'
          ? (customModel.trim() && { model: customModel.trim() })
          : (formData.model?.trim() && { model: formData.model.trim() })),
        ...(formData.year && { year: formData.year }),
        ...(formData.color === 'Outro'
          ? (customColor.trim() && { color: customColor.trim() })
          : (formData.color?.trim() && { color: formData.color.trim() })),
        ...(formData.mileage !== undefined && { mileage: formData.mileage }),
        isDefault: formData.isDefault,
      };

      console.log('[NewVehicle] Enviando dados:', data);
      console.log('[NewVehicle] Dados serializados:', JSON.stringify(data, null, 2));
      await vehiclesApi.create(data);
      router.push('/vehicles');
    } catch (err: unknown) {
      console.error('Erro ao criar veículo:', err);
      console.error('Erro completo:', JSON.stringify(err, null, 2));
      let errorMessage = 'Erro ao criar veículo';

      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { 
          response?: { 
            data?: { 
              message?: string | string[];
              error?: string;
              statusCode?: number;
            };
            status?: number;
          } 
        };
        
        console.error('[NewVehicle] Response error:', axiosError.response);
        
        if (axiosError.response?.data) {
          const data = axiosError.response.data;
          console.error('[NewVehicle] Error data:', data);
          
          if (data.message) {
            const message = data.message;
            errorMessage = Array.isArray(message) 
              ? message.map((m: string) => `• ${m}`).join('\n')
              : message;
          } else if (data.error) {
            errorMessage = data.error;
          } else {
            errorMessage = `Erro ${axiosError.response.status || 400}: ${JSON.stringify(data, null, 2)}`;
          }
        } else if (axiosError.response?.status) {
          errorMessage = `Erro ${axiosError.response.status}: Requisição falhou`;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      console.error('Mensagem de erro detalhada:', errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingCustomers) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto"></div>
            <p className="mt-4 text-[#7E8691]">Carregando clientes...</p>
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
          <Link href="/vehicles" className="text-[#00E0B8] hover:text-[#3ABFF8] mb-4 inline-block text-sm sm:text-base">
            ← Voltar para veículos
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#D0D6DE]">Novo Veículo</h1>
          <p className="text-[#7E8691] mt-2 text-sm sm:text-base">Cadastre um novo veículo</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <Select
              label="Cliente *"
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              options={[
                { value: '', label: 'Selecione um cliente' },
                ...customers.map((customer) => ({
                  value: customer.id,
                  label: customer.phone ? `${customer.name} - ${customer.phone}` : customer.name,
                })),
              ]}
              error={errors.customerId}
              required
            />

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
                onChange={async (e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                  setFormData({ ...formData, renavan: value });
                  
                  // Buscar dados automaticamente quando RENAVAN tiver 11 dígitos
                  if (value.length === 11) {
                    try {
                      const vehicleData = await vehiclesApi.queryByRenavan(value);
                      if (vehicleData) {
                        setFormData((prev) => ({
                          ...prev,
                          make: vehicleData.make || prev.make,
                          model: vehicleData.model || prev.model,
                          year: vehicleData.year || prev.year,
                          color: vehicleData.color || prev.color,
                          vin: vehicleData.vin || prev.vin,
                          placa: vehicleData.placa || prev.placa,
                        }));
                      }
                    } catch (err) {
                      // Silenciosamente ignora erros (API pode não estar configurada)
                      console.log('Não foi possível buscar dados por RENAVAN:', err);
                    }
                  }
                }}
                error={errors.renavan}
                maxLength={11}
              />
              <Input
                label="Placa"
                placeholder="ABC1234"
                value={formData.placa}
                onChange={async (e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z\d]/g, '').slice(0, 7);
                  setFormData({ ...formData, placa: value });
                  
                  // Buscar dados automaticamente quando placa tiver 7 caracteres
                  if (value.length === 7) {
                    try {
                      const vehicleData = await vehiclesApi.queryByPlaca(value);
                      if (vehicleData) {
                        setFormData((prev) => ({
                          ...prev,
                          make: vehicleData.make || prev.make,
                          model: vehicleData.model || prev.model,
                          year: vehicleData.year || prev.year,
                          color: vehicleData.color || prev.color,
                          vin: vehicleData.vin || prev.vin,
                          renavan: vehicleData.renavan || prev.renavan,
                        }));
                      }
                    } catch (err) {
                      // Silenciosamente ignora erros (API pode não estar configurada)
                      console.log('Não foi possível buscar dados por placa:', err);
                    }
                  }
                }}
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
              <div>
                <Select
                  label="Cor"
                  value={formData.color || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, color: value || undefined });
                    if (value !== 'Outro') {
                      setCustomColor('');
                    }
                  }}
                  options={[
                    { value: '', label: 'Selecione uma cor' },
                    ...VEHICLE_COLORS.map((color) => ({ value: color, label: color })),
                  ]}
                  error={errors.customColor}
                />
                {formData.color === 'Outro' && (
                  <Input
                    label="Especifique a cor *"
                    placeholder="Digite a cor"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    error={errors.customColor}
                    required
                    className="mt-2"
                  />
                )}
              </div>
              <Input
                label="Quilometragem"
                type="number"
                placeholder="50000"
                value={formData.mileage || ''}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value ? Number.parseInt(e.target.value, 10) : undefined })}
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
            <Link href="/vehicles" className="w-full sm:w-auto">
              <Button variant="secondary" type="button" className="w-full sm:w-auto">
                Cancelar
              </Button>
            </Link>
            <Button variant="primary" type="submit" isLoading={loading} className="w-full sm:w-auto">
              Criar Veículo
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

