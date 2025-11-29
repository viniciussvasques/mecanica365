'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { customersApi, CreateCustomerDto, DocumentType } from '@/lib/api/customers';
import { vehiclesApi, CreateVehicleDto } from '@/lib/api/vehicles';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { VEHICLE_BRANDS, VEHICLE_COLORS } from '@/lib/constants/vehicles';

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [formData, setFormData] = useState<CreateCustomerDto>({
    name: '',
    email: '',
    phone: '',
    documentType: DocumentType.CPF,
    cpf: '',
    cnpj: '',
    address: '',
    notes: '',
  });
  const [vehicleData, setVehicleData] = useState<Partial<CreateVehicleDto>>({
    placa: '',
    make: '',
    model: '',
    year: undefined,
    color: '',
    vin: '',
    renavan: '',
  });
  const [customMake, setCustomMake] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [customColor, setCustomColor] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (!formData.phone || formData.phone.trim().length === 0) {
      newErrors.phone = 'Telefone é obrigatório';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validar CPF se documentType for CPF
    if (formData.documentType === DocumentType.CPF) {
      if (!formData.cpf || formData.cpf.length !== 11) {
        newErrors.cpf = 'CPF é obrigatório e deve ter 11 dígitos';
      }
    }

    // Validar CNPJ se documentType for CNPJ
    if (formData.documentType === DocumentType.CNPJ) {
      if (!formData.cnpj || formData.cnpj.length !== 14) {
        newErrors.cnpj = 'CNPJ é obrigatório e deve ter 14 dígitos';
      }
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
      
      // Formatar telefone para o padrão esperado pelo backend: (00) 00000-0000 ou (00) 0000-0000
      const formatPhone = (phone: string): string => {
        // Remover todos os caracteres não numéricos
        const numbers = phone.replace(/\D/g, '');
        
        // Se tiver 10 ou 11 dígitos, formatar
        if (numbers.length === 10) {
          // (00) 0000-0000
          return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
        } else if (numbers.length === 11) {
          // (00) 00000-0000
          return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
        }
        
        // Se não tiver formato válido, retornar como está (será validado no backend)
        return phone;
      };
      
      const data: CreateCustomerDto = {
        name: formData.name.trim(),
        phone: formatPhone(formData.phone.trim()),
        email: formData.email?.trim() || undefined,
        documentType: formData.documentType,
        cpf: formData.documentType === DocumentType.CPF ? formData.cpf?.trim() || undefined : undefined,
        cnpj: formData.documentType === DocumentType.CNPJ ? formData.cnpj?.trim() || undefined : undefined,
        address: formData.address?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      };

      console.log('[NewCustomer] Enviando dados:', data);
      const customer = await customersApi.create(data);
      
      // Se houver dados de veículo preenchidos, criar o veículo também
      if (showVehicleForm && (vehicleData.placa || vehicleData.vin || vehicleData.renavan)) {
        try {
          const vehiclePayload: CreateVehicleDto = {
            customerId: customer.id,
            ...(vehicleData.placa?.trim() && { placa: vehicleData.placa.trim().toUpperCase() }),
            ...(vehicleData.vin?.trim() && { vin: vehicleData.vin.trim().toUpperCase() }),
            ...(vehicleData.renavan?.trim() && { renavan: vehicleData.renavan.trim() }),
            ...(vehicleData.make === 'Outro' 
              ? (customMake.trim() && { make: customMake.trim() })
              : (vehicleData.make?.trim() && { make: vehicleData.make.trim() })),
            ...(vehicleData.model === 'Outro'
              ? (customModel.trim() && { model: customModel.trim() })
              : (vehicleData.model?.trim() && { model: vehicleData.model.trim() })),
            ...(vehicleData.year && { year: vehicleData.year }),
            ...(vehicleData.color === 'Outro'
              ? (customColor.trim() && { color: customColor.trim() })
              : (vehicleData.color?.trim() && { color: vehicleData.color.trim() })),
            isDefault: true, // Primeiro veículo é padrão
          };
          
          console.log('[NewCustomer] Criando veículo:', vehiclePayload);
          await vehiclesApi.create(vehiclePayload);
        } catch (vehicleError) {
          console.error('Erro ao criar veículo:', vehicleError);
          // Não bloquear o fluxo se o veículo falhar - cliente já foi criado
          alert('Cliente criado com sucesso, mas houve um erro ao adicionar o veículo. Você pode adicioná-lo depois.');
        }
      }
      
      router.push('/customers');
    } catch (err: unknown) {
      console.error('Erro ao criar cliente:', err);
      let errorMessage = 'Erro ao criar cliente';
      
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

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link href="/customers" className="text-[#00E0B8] hover:text-[#3ABFF8] mb-4 inline-block text-sm sm:text-base">
            ← Voltar para clientes
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#D0D6DE]">Novo Cliente</h1>
          <p className="text-[#7E8691] mt-2 text-sm sm:text-base">Cadastre um novo cliente</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Input
                label="Nome *"
                placeholder="Nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                required
              />
              <Input
                label="Telefone *"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  // Limitar a 11 dígitos
                  if (value.length > 11) value = value.slice(0, 11);
                  
                  // Formatar enquanto digita
                  let formatted = value;
                  if (value.length > 0) {
                    if (value.length <= 2) {
                      formatted = `(${value}`;
                    } else if (value.length <= 7) {
                      formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                    } else if (value.length <= 10) {
                      formatted = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
                    } else {
                      formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
                    }
                  }
                  
                  setFormData({ ...formData, phone: formatted });
                }}
                error={errors.phone}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Input
                label="Email"
                type="email"
                placeholder="email@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
              />
              <Select
                label="Tipo de Documento *"
                value={formData.documentType}
                onChange={(e) => {
                  const newDocType = e.target.value as DocumentType;
                  setFormData({
                    ...formData,
                    documentType: newDocType,
                    cpf: newDocType === DocumentType.CPF ? formData.cpf : '',
                    cnpj: newDocType === DocumentType.CNPJ ? formData.cnpj : '',
                  });
                }}
                options={[
                  { value: DocumentType.CPF, label: 'CPF (Pessoa Física)' },
                  { value: DocumentType.CNPJ, label: 'CNPJ (Pessoa Jurídica)' },
                ]}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {formData.documentType === DocumentType.CPF ? (
                <Input
                  label="CPF *"
                  placeholder="00000000000"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                  error={errors.cpf}
                  maxLength={11}
                  required
                />
              ) : (
                <Input
                  label="CNPJ *"
                  placeholder="00000000000000"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value.replace(/\D/g, '').slice(0, 14) })}
                  error={errors.cnpj}
                  maxLength={14}
                  required
                />
              )}
            </div>

            <Input
              label="Endereço"
              placeholder="Rua, número, bairro, cidade/estado"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-[#D0D6DE] mb-2">
                Observações
              </label>
              <textarea
                id="notes"
                rows={4}
                placeholder="Observações sobre o cliente..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg text-[#F0F4F8] placeholder:text-[#7E8691] placeholder:opacity-60 bg-[#1A1E23] border-[#3A4048] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]/50 focus:border-[#00E0B8] focus:bg-[#1F2329] transition-all duration-200"
                style={{
                  WebkitTextFillColor: '#F0F4F8',
                  color: '#F0F4F8',
                }}
              />
            </div>

            {/* Seção de Veículo (Opcional) */}
            <div className="border-t border-[#2A3038] pt-4 sm:pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#D0D6DE]">Veículo (Opcional)</h3>
                  <p className="text-sm text-[#7E8691] mt-1">Adicione um veículo para este cliente</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVehicleForm(!showVehicleForm)}
                  className="text-[#00E0B8] hover:text-[#3ABFF8] text-sm font-medium transition-colors"
                >
                  {showVehicleForm ? 'Ocultar' : 'Adicionar Veículo'}
                </button>
              </div>

              {showVehicleForm && (
                <div className="space-y-4 sm:space-y-6 bg-[#0F1115] p-4 rounded-lg border border-[#2A3038]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <Input
                      label="Placa"
                      placeholder="ABC1234"
                      value={vehicleData.placa || ''}
                      onChange={(e) => {
                        let value = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                        if (value.length > 7) value = value.slice(0, 7);
                        setVehicleData({ ...vehicleData, placa: value });
                      }}
                      maxLength={7}
                    />
                    <Input
                      label="VIN (Chassi)"
                      placeholder="17 caracteres"
                      value={vehicleData.vin || ''}
                      onChange={(e) => {
                        let value = e.target.value.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase();
                        if (value.length > 17) value = value.slice(0, 17);
                        setVehicleData({ ...vehicleData, vin: value });
                      }}
                      maxLength={17}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <Input
                      label="RENAVAN"
                      placeholder="11 dígitos"
                      value={vehicleData.renavan || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setVehicleData({ ...vehicleData, renavan: value });
                      }}
                      maxLength={11}
                    />
                    <Select
                      label="Marca"
                      id="vehicle-make"
                      value={vehicleData.make || ''}
                      onChange={(e) => setVehicleData({ ...vehicleData, make: e.target.value, model: '' })}
                      options={[
                        { value: '', label: 'Selecione...' },
                        ...VEHICLE_BRANDS.map(brand => ({ value: brand, label: brand })),
                        { value: 'Outro', label: 'Outro' },
                      ]}
                    />
                  </div>

                  {vehicleData.make && vehicleData.make !== 'Outro' && (
                    <Input
                      label="Modelo"
                      placeholder="Digite o modelo"
                      value={vehicleData.model === 'Outro' ? '' : (vehicleData.model || '')}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === 'Outro' || !VEHICLE_BRANDS.some(b => b === value)) {
                          setVehicleData({ ...vehicleData, model: value });
                        } else {
                          setVehicleData({ ...vehicleData, model: value });
                        }
                      }}
                    />
                  )}
                  {vehicleData.make === 'Outro' && (
                    <Input
                      label="Marca (Personalizada) *"
                      placeholder="Digite a marca"
                      value={customMake}
                      onChange={(e) => setCustomMake(e.target.value)}
                      required
                    />
                  )}
                  {vehicleData.model === 'Outro' && vehicleData.make !== 'Outro' && (
                    <Input
                      label="Modelo (Personalizado) *"
                      placeholder="Digite o modelo"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      required
                    />
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <Input
                      label="Ano"
                      type="text"
                      placeholder="2020"
                      value={vehicleData.year || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Permitir apenas números
                        const numbersOnly = value.replace(/\D/g, '');
                        if (numbersOnly === '') {
                          setVehicleData({ ...vehicleData, year: undefined });
                        } else {
                          const year = parseInt(numbersOnly);
                          if (!isNaN(year)) {
                            setVehicleData({ ...vehicleData, year });
                          }
                        }
                      }}
                    />
                    <Select
                      label="Cor"
                      id="vehicle-color"
                      value={vehicleData.color || ''}
                      onChange={(e) => setVehicleData({ ...vehicleData, color: e.target.value })}
                      options={[
                        { value: '', label: 'Selecione...' },
                        ...VEHICLE_COLORS.map(color => ({ value: color, label: color })),
                        { value: 'Outro', label: 'Outro' },
                      ]}
                    />
                  </div>

                  {vehicleData.color === 'Outro' && (
                    <Input
                      label="Cor (Personalizada) *"
                      placeholder="Digite a cor"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      required
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#2A3038]">
            <Link href="/customers" className="w-full sm:w-auto">
              <Button variant="secondary" type="button" className="w-full sm:w-auto">
                Cancelar
              </Button>
            </Link>
            <Button variant="primary" type="submit" isLoading={loading} className="w-full sm:w-auto">
              Criar Cliente
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

