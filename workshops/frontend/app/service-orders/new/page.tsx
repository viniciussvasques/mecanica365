'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { serviceOrdersApi, CreateServiceOrderDto, ServiceOrderStatus } from '@/lib/api/service-orders';
import { ProblemCategory, Quote } from '@/lib/api/quotes';
import { customersApi, Customer } from '@/lib/api/customers';
import { vehiclesApi, Vehicle } from '@/lib/api/vehicles';
import { elevatorsApi, Elevator } from '@/lib/api/elevators';
import { quotesApi } from '@/lib/api/quotes';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

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

export default function NewServiceOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [elevators, setElevators] = useState<Elevator[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [formData, setFormData] = useState<CreateServiceOrderDto>({
    status: ServiceOrderStatus.SCHEDULED,
    priority: 'normal',
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
      
      // Carregar clientes
      const customersResponse = await customersApi.findAll({ limit: 100 });
      setCustomers(customersResponse.data);

      // Carregar elevadores disponíveis
      const elevatorsResponse = await elevatorsApi.findAll({ limit: 100 });
      setElevators(elevatorsResponse.data);

      // Carregar orçamentos pendentes
      const quotesResponse = await quotesApi.findAll({ limit: 100 });
      setQuotes(quotesResponse.data.filter(q => q.status === 'accepted' || q.status === 'sent'));
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
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

  const removeSymptom = (symptomToRemove: string) => {
    const newSymptoms = (formData.reportedProblemSymptoms || []).filter((symptom) => symptom !== symptomToRemove);
    setFormData({ ...formData, reportedProblemSymptoms: newSymptoms });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      
      const data: CreateServiceOrderDto = {
        ...formData,
        reportedProblemDescription: formData.reportedProblemDescription?.trim() || undefined,
        diagnosticNotes: formData.diagnosticNotes?.trim() || undefined,
        recommendations: formData.recommendations?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        reportedProblemSymptoms: formData.reportedProblemSymptoms?.length ? formData.reportedProblemSymptoms : undefined,
      };

      await serviceOrdersApi.create(data);
      router.push('/service-orders');
    } catch (err: unknown) {
      console.error('Erro ao criar ordem de serviço:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar ordem de serviço';
      alert(errorMessage);
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-[#D0D6DE]">Nova Ordem de Serviço</h1>
            <Link href="/service-orders">
              <Button variant="outline">Voltar</Button>
            </Link>
          </div>
          <p className="text-[#7E8691]">Crie uma nova ordem de serviço</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 space-y-6">
          {/* Cliente e Veículo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select
                label="Cliente"
                value={formData.customerId || ''}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value || undefined })}
                options={[
                  { value: '', label: 'Selecione um cliente' },
                  ...customers.map(c => ({ value: c.id, label: c.name })),
                ]}
              />
            </div>
            <div>
              <Select
                label="Veículo"
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
              />
            </div>
          </div>

          {/* Orçamento e Elevador */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select
                label="Orçamento (Opcional)"
                value={formData.quoteId || ''}
                onChange={(e) => setFormData({ ...formData, quoteId: e.target.value || undefined })}
                options={[
                  { value: '', label: 'Nenhum' },
                  ...quotes.map(q => ({ value: q.id, label: `${q.number} - ${q.customer?.name || ''}` })),
                ]}
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

          {/* Status e Prioridade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select
                label="Status"
                value={formData.status || ServiceOrderStatus.SCHEDULED}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ServiceOrderStatus })}
                options={[
                  { value: ServiceOrderStatus.SCHEDULED, label: 'Agendada' },
                  { value: ServiceOrderStatus.IN_PROGRESS, label: 'Em Andamento' },
                  { value: ServiceOrderStatus.ON_HOLD, label: 'Em Espera' },
                ]}
              />
            </div>
            <div>
              <Select
                label="Prioridade"
                value={formData.priority || 'normal'}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                options={[
                  { value: 'low', label: 'Baixa' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'high', label: 'Alta' },
                  { value: 'urgent', label: 'Urgente' },
                ]}
              />
            </div>
          </div>

          {/* Problema Relatado */}
          <div className="border-t border-[#2A3038] pt-6">
            <h3 className="text-lg font-semibold text-[#D0D6DE] mb-4">Problema Relatado pelo Cliente</h3>
            <div className="space-y-4">
              <Select
                label="Categoria do Problema"
                value={formData.reportedProblemCategory || ''}
                onChange={(e) => setFormData({ ...formData, reportedProblemCategory: e.target.value as ProblemCategory || undefined })}
                options={[
                  { value: '', label: 'Selecione uma categoria' },
                  ...PROBLEM_CATEGORIES,
                ]}
              />
              <div>
                <label htmlFor="reportedProblemDescription" className="block text-sm font-medium text-[#D0D6DE] mb-2">
                  Descrição do Problema
                </label>
                <textarea
                  id="reportedProblemDescription"
                  className="w-full px-4 py-2 bg-[#0F1115] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]"
                  rows={3}
                  placeholder="Descreva o problema relatado pelo cliente..."
                  value={formData.reportedProblemDescription || ''}
                  onChange={(e) => setFormData({ ...formData, reportedProblemDescription: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="symptoms-input" className="block text-sm font-medium text-[#D0D6DE] mb-2">
                  Sintomas
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    label=""
                    id="symptoms-input"
                    placeholder="Ex: ruído no freio, barulho ao frear..."
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                    onKeyDown={(e) => {
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
                    {formData.reportedProblemSymptoms.map((symptom) => (
                      <span
                        key={symptom}
                        className="px-3 py-1 bg-[#2A3038] text-[#D0D6DE] rounded-full text-sm flex items-center gap-2"
                      >
                        {symptom}
                        <button
                          type="button"
                          onClick={() => removeSymptom(symptom)}
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

          {/* Observações Gerais */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-[#D0D6DE] mb-2">
              Observações
            </label>
            <textarea
              id="notes"
              className="w-full px-4 py-2 bg-[#0F1115] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]"
              rows={3}
              placeholder="Observações gerais sobre a ordem de serviço..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-[#2A3038]">
            <Link href="/service-orders">
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </Link>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Criar Ordem de Serviço'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

