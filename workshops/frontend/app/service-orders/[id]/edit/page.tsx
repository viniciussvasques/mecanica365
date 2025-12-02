'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { serviceOrdersApi, ServiceOrder, UpdateServiceOrderDto, ServiceOrderStatus } from '@/lib/api/service-orders';
import { ProblemCategory } from '@/lib/api/quotes';
import { customersApi, Customer } from '@/lib/api/customers';
import { vehiclesApi, Vehicle } from '@/lib/api/vehicles';
import { elevatorsApi, Elevator } from '@/lib/api/elevators';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DiagnosticPanel } from '@/components/DiagnosticPanel';

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

export default function EditServiceOrderPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [elevators, setElevators] = useState<Elevator[]>([]);
  const [formData, setFormData] = useState<UpdateServiceOrderDto>({});
  const [symptomInput, setSymptomInput] = useState('');

  useEffect(() => {
    loadInitialData();
    loadServiceOrder();
  }, [id]);

  useEffect(() => {
    if (formData.customerId) {
      loadVehicles(formData.customerId);
    }
  }, [formData.customerId]);

  const loadInitialData = async () => {
    try {
      const [customersResponse, elevatorsResponse] = await Promise.all([
        customersApi.findAll({ limit: 100 }),
        elevatorsApi.findAll({ limit: 100 }),
      ]);
      setCustomers(customersResponse.data);
      setElevators(elevatorsResponse.data);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  const loadServiceOrder = async () => {
    try {
      setLoadingData(true);
      const data = await serviceOrdersApi.findOne(id);
      setFormData({
        customerId: data.customerId,
        vehicleId: data.vehicleId,
        technicianId: data.technicianId,
        elevatorId: data.elevatorId,
        status: data.status,
        priority: data.priority,
        scheduledStart: data.scheduledStart ? new Date(data.scheduledStart).toISOString().slice(0, 16) : undefined,
        scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd).toISOString().slice(0, 16) : undefined,
        laborCost: data.laborCost,
        partsCost: data.partsCost,
        discount: data.discount,
        taxAmount: data.taxAmount,
        reportedProblemCategory: data.reportedProblemCategory as ProblemCategory | undefined,
        reportedProblemDescription: data.reportedProblemDescription,
        reportedProblemSymptoms: data.reportedProblemSymptoms || [],
        identifiedProblemCategory: data.identifiedProblemCategory as ProblemCategory | undefined,
        identifiedProblemDescription: data.identifiedProblemDescription,
        diagnosticNotes: data.diagnosticNotes,
        recommendations: data.recommendations,
        notes: data.notes,
      });
      
      if (data.customerId) {
        await loadVehicles(data.customerId);
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar ordem de serviço:', err);
      alert('Erro ao carregar ordem de serviço');
      router.push('/service-orders');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      
      const data: UpdateServiceOrderDto = {
        ...formData,
        reportedProblemDescription: formData.reportedProblemDescription?.trim() || undefined,
        diagnosticNotes: formData.diagnosticNotes?.trim() || undefined,
        recommendations: formData.recommendations?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        reportedProblemSymptoms: formData.reportedProblemSymptoms?.length ? formData.reportedProblemSymptoms : undefined,
      };

      await serviceOrdersApi.update(id, data);
      router.push(`/service-orders/${id}`);
    } catch (err: unknown) {
      console.error('Erro ao atualizar ordem de serviço:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar ordem de serviço';
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
          <Link href={`/service-orders/${id}`} className="text-[#00E0B8] hover:text-[#3ABFF8] mb-4 inline-block">
            ← Voltar para Ordem de Serviço
          </Link>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-[#D0D6DE]">Editar Ordem de Serviço</h1>
            <Link href={`/service-orders/${id}`}>
              <Button variant="outline">Cancelar</Button>
            </Link>
          </div>
          <p className="text-[#7E8691]">Edite as informações da ordem de serviço</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 space-y-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
              <Select
                label="Status"
                value={formData.status || ServiceOrderStatus.SCHEDULED}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ServiceOrderStatus })}
                options={[
                  { value: ServiceOrderStatus.SCHEDULED, label: 'Agendada' },
                  { value: ServiceOrderStatus.IN_PROGRESS, label: 'Em Andamento' },
                  { value: ServiceOrderStatus.COMPLETED, label: 'Concluída' },
                  { value: ServiceOrderStatus.ON_HOLD, label: 'Em Espera' },
                  { value: ServiceOrderStatus.CANCELLED, label: 'Cancelada' },
                ]}
              />
            </div>
          </div>

          <div className="border-t border-[#2A3038] pt-6">
            <h3 className="text-lg font-semibold text-[#D0D6DE] mb-4">Problema Relatado</h3>
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
                  Sintomas
                </label>
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

          {/* Interface do Mecânico - Diagnóstico */}
          <div className="border-t border-[#2A3038] pt-6">
            <DiagnosticPanel
              symptoms={formData.reportedProblemSymptoms || []}
              category={formData.reportedProblemCategory}
              onUpdateDiagnosis={(diagnosis) => {
                setFormData({
                  ...formData,
                  identifiedProblemId: diagnosis.identifiedProblemId,
                  identifiedProblemCategory: diagnosis.identifiedProblemCategory as ProblemCategory | undefined,
                  identifiedProblemDescription: diagnosis.identifiedProblemDescription,
                  diagnosticNotes: diagnosis.diagnosticNotes,
                  recommendations: diagnosis.recommendations,
                });
              }}
              initialDiagnosis={{
                identifiedProblemId: formData.identifiedProblemId,
                identifiedProblemCategory: formData.identifiedProblemCategory,
                identifiedProblemDescription: formData.identifiedProblemDescription,
                diagnosticNotes: formData.diagnosticNotes,
                recommendations: formData.recommendations,
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
              Observações Gerais
            </label>
            <textarea
              className="w-full px-4 py-2 bg-[#0F1115] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]"
              rows={3}
              placeholder="Observações gerais sobre a ordem de serviço..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-[#2A3038]">
            <Link href={`/service-orders/${id}`}>
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </Link>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

