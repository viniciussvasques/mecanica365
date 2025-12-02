'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { quotesApi, CreateQuoteDto, QuoteStatus, ProblemCategory } from '@/lib/api/quotes';
import { customersApi, Customer } from '@/lib/api/customers';
import { vehiclesApi, Vehicle } from '@/lib/api/vehicles';
import { elevatorsApi, Elevator } from '@/lib/api/elevators';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
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

export default function NewQuotePage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [elevators, setElevators] = useState<Elevator[]>([]);
  const [createdQuoteId, setCreatedQuoteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateQuoteDto>({
    status: QuoteStatus.DRAFT,
    items: [], // Itens só serão adicionados depois do diagnóstico
    discount: 0,
    taxAmount: 0,
    reportedProblemCategory: undefined,
    reportedProblemDescription: '',
    reportedProblemSymptoms: [],
  });
  const [symptomInput, setSymptomInput] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.customerId) {
      loadVehicles(formData.customerId);
    } else {
      setVehicles([]);
    }
  }, [formData.customerId]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      
      const customersResponse = await customersApi.findAll({ limit: 100 });
      setCustomers(customersResponse.data);

      const elevatorsResponse = await elevatorsApi.findAll({ limit: 100 });
      setElevators(elevatorsResponse.data);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      showNotification('Erro ao carregar dados', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  const loadVehicles = async (customerId: string) => {
    try {
      const response = await vehiclesApi.findAll({ customerId, limit: 100 });
      setVehicles(response.data);
    } catch (err) {
      console.error('Erro ao carregar veículos:', err);
    }
  };

  const addSymptom = () => {
    if (symptomInput.trim()) {
      setFormData({
        ...formData,
        reportedProblemSymptoms: [...(formData.reportedProblemSymptoms || []), symptomInput.trim()],
      });
      setSymptomInput('');
    }
  };

  const removeSymptom = (index: number) => {
    const newSymptoms = [...(formData.reportedProblemSymptoms || [])];
    newSymptoms.splice(index, 1);
    setFormData({ ...formData, reportedProblemSymptoms: newSymptoms });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerId) {
      newErrors.customerId = 'Cliente é obrigatório';
    }

    if (!formData.vehicleId) {
      newErrors.vehicleId = 'Veículo é obrigatório';
    }

    if (!formData.reportedProblemCategory) {
      newErrors.reportedProblemCategory = 'Categoria do problema é obrigatória';
    }

    if (!formData.reportedProblemSymptoms || formData.reportedProblemSymptoms.length === 0) {
      newErrors.symptoms = 'Adicione pelo menos um sintoma';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showNotification('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const data: CreateQuoteDto = {
        customerId: formData.customerId,
        vehicleId: formData.vehicleId,
        elevatorId: formData.elevatorId,
        status: QuoteStatus.DRAFT,
        reportedProblemCategory: formData.reportedProblemCategory,
        reportedProblemDescription: formData.reportedProblemDescription?.trim() || undefined,
        reportedProblemSymptoms: formData.reportedProblemSymptoms || [],
        items: [], // Sem itens ainda
        discount: 0,
        taxAmount: 0,
      };

      const quote = await quotesApi.create(data);
      setCreatedQuoteId(quote.id);
      showNotification('Orçamento criado com sucesso! Agora envie para diagnóstico.', 'success');
    } catch (err: unknown) {
      console.error('Erro ao criar orçamento:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar orçamento';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendForDiagnosis = async () => {
    if (!createdQuoteId) {
      showNotification('Crie o orçamento primeiro', 'error');
      return;
    }

    try {
      setLoading(true);
      await quotesApi.sendForDiagnosis(createdQuoteId);
      showNotification('Orçamento enviado para diagnóstico do mecânico!', 'success');
      router.push('/quotes');
    } catch (err: unknown) {
      console.error('Erro ao enviar para diagnóstico:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar para diagnóstico';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-[#D0D6DE">Novo Orçamento</h1>
            <Link href="/quotes">
              <Button variant="outline">Voltar</Button>
            </Link>
          </div>
          <p className="text-[#7E8691]">
            {createdQuoteId 
              ? 'Orçamento criado! Envie para diagnóstico do mecânico.'
              : 'Preencha os sintomas e envie para diagnóstico do mecânico. Os itens serão adicionados depois.'}
          </p>
        </div>

        <form onSubmit={handleCreateDraft} className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 space-y-6">
          {/* Cliente, Veículo e Elevador */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Select
                label="Cliente *"
                value={formData.customerId || ''}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value || undefined })}
                options={[
                  { value: '', label: 'Selecione um cliente' },
                  ...customers.map(c => ({ value: c.id, label: c.name })),
                ]}
                error={errors.customerId}
              />
            </div>
            <div>
              <Select
                label="Veículo *"
                value={formData.vehicleId || ''}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value || undefined })}
                options={[
                  { value: '', label: 'Selecione um veículo' },
                  ...vehicles.map(v => ({ 
                    value: v.id, 
                    label: `${v.placa || 'Sem placa'} - ${v.make || ''} ${v.model || ''}`.trim() || 'Veículo' 
                  })),
                ]}
                disabled={!formData.customerId}
                error={errors.vehicleId}
              />
            </div>
            <div>
              <Select
                label="Elevador (Opcional)"
                value={formData.elevatorId || ''}
                onChange={(e) => setFormData({ ...formData, elevatorId: e.target.value || undefined })}
                options={[
                  { value: '', label: 'Nenhum' },
                  ...elevators.map(e => ({ value: e.id, label: `${e.name} (${e.number})` })),
                ]}
              />
            </div>
          </div>

          {/* Problema Relatado */}
          <div className="border-t border-[#2A3038] pt-6">
            <h3 className="text-lg font-semibold text-[#D0D6DE] mb-4">Problema Relatado pelo Cliente</h3>
            <div className="space-y-4">
              <Select
                label="Categoria do Problema *"
                value={formData.reportedProblemCategory || ''}
                onChange={(e) => setFormData({ ...formData, reportedProblemCategory: e.target.value as ProblemCategory || undefined })}
                options={[
                  { value: '', label: 'Selecione uma categoria' },
                  ...PROBLEM_CATEGORIES,
                ]}
                error={errors.reportedProblemCategory}
              />
              <div>
                <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
                  Descrição do Problema
                </label>
                <textarea
                  className="w-full px-4 py-2 bg-[#0F1115] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]"
                  rows={3}
                  placeholder="Descreva o problema relatado pelo cliente..."
                  value={formData.reportedProblemDescription || ''}
                  onChange={(e) => setFormData({ ...formData, reportedProblemDescription: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
                  Sintomas *
                </label>
                {errors.symptoms && (
                  <p className="text-sm text-[#FF4E3D] mb-2">{errors.symptoms}</p>
                )}
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Ex: ruído no freio, barulho ao frear..."
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSymptom();
                      }
                    }}
                  />
                  <Button type="button" variant="secondary" onClick={addSymptom}>
                    Adicionar
                  </Button>
                </div>
                {formData.reportedProblemSymptoms && formData.reportedProblemSymptoms.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.reportedProblemSymptoms.map((symptom, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[#2A3038] text-[#D0D6DE] rounded-full text-sm flex items-center gap-2"
                      >
                        {symptom}
                        <button
                          type="button"
                          onClick={() => removeSymptom(index)}
                          className="text-[#FF4E3D] hover:text-[#FF6B5A]"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Informação sobre o fluxo */}
          <div className="bg-[#2A3038] border border-[#00E0B8] rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-[#00E0B8] text-xl">ℹ️</div>
              <div>
                <h4 className="font-semibold text-[#D0D6DE] mb-1">Fluxo de Orçamento</h4>
                <p className="text-sm text-[#7E8691]">
                  1. Preencha os sintomas e crie o orçamento<br/>
                  2. Envie para diagnóstico do mecânico<br/>
                  3. Após o diagnóstico, você poderá adicionar itens e valores na edição do orçamento
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-[#2A3038]">
            <Link href="/quotes">
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </Link>
            {!createdQuoteId ? (
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Criando...' : 'Criar Orçamento'}
              </Button>
            ) : (
              <Button 
                variant="primary" 
                type="button" 
                onClick={handleSendForDiagnosis}
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar para Diagnóstico'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
