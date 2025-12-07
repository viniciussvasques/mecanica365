'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { knowledgeApi, CreateKnowledgeData } from '@/lib/api/knowledge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useNotification } from '@/components/NotificationProvider';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
} from '@/components/icons/MechanicIcons';

const categoryOptions = [
  { value: 'motor', label: 'Motor' },
  { value: 'freios', label: 'Freios' },
  { value: 'suspensao', label: 'Suspensão' },
  { value: 'eletrica', label: 'Elétrica' },
  { value: 'ar_condicionado', label: 'Ar Condicionado' },
  { value: 'transmissao', label: 'Transmissão' },
  { value: 'direcao', label: 'Direção' },
  { value: 'pneus', label: 'Pneus' },
  { value: 'carroceria', label: 'Carroceria' },
  { value: 'exaustao', label: 'Exaustão' },
  { value: 'outros', label: 'Outros' },
];

interface Symptom {
  symptom: string;
}

interface VehicleMake {
  make: string;
}

interface VehicleModel {
  model: string;
}

interface SolutionStep {
  step: number;
  description: string;
}

interface PartNeeded {
  name: string;
  partNumber?: string;
  avgCost?: number;
}

export default function NewKnowledgePage() {
  const router = useRouter();
  const { showNotification } = useNotification();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateKnowledgeData>({
    problemTitle: '',
    problemDescription: '',
    category: '',
    symptoms: [],
    vehicleMakes: [],
    vehicleModels: [],
    solutionTitle: '',
    solutionDescription: '',
    solutionSteps: [],
    partsNeeded: [],
  });

  const updateFormData = (field: keyof CreateKnowledgeData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSymptom = () => {
    const newSymptom: Symptom = { symptom: '' };
    updateFormData('symptoms', [...(formData.symptoms || []), newSymptom]);
  };

  const updateSymptom = (index: number, value: string) => {
    const updated = [...(formData.symptoms || [])];
    updated[index] = { symptom: value };
    updateFormData('symptoms', updated);
  };

  const removeSymptom = (index: number) => {
    const updated = [...(formData.symptoms || [])];
    updated.splice(index, 1);
    updateFormData('symptoms', updated);
  };

  const addVehicleMake = () => {
    const newMake: VehicleMake = { make: '' };
    updateFormData('vehicleMakes', [...(formData.vehicleMakes || []), newMake]);
  };

  const updateVehicleMake = (index: number, value: string) => {
    const updated = [...(formData.vehicleMakes || [])];
    updated[index] = { make: value };
    updateFormData('vehicleMakes', updated);
  };

  const removeVehicleMake = (index: number) => {
    const updated = [...(formData.vehicleMakes || [])];
    updated.splice(index, 1);
    updateFormData('vehicleMakes', updated);
  };

  const addVehicleModel = () => {
    const newModel: VehicleModel = { model: '' };
    updateFormData('vehicleModels', [...(formData.vehicleModels || []), newModel]);
  };

  const updateVehicleModel = (index: number, value: string) => {
    const updated = [...(formData.vehicleModels || [])];
    updated[index] = { model: value };
    updateFormData('vehicleModels', updated);
  };

  const removeVehicleModel = (index: number) => {
    const updated = [...(formData.vehicleModels || [])];
    updated.splice(index, 1);
    updateFormData('vehicleModels', updated);
  };

  const addSolutionStep = () => {
    const newStep: SolutionStep = {
      step: (formData.solutionSteps?.length || 0) + 1,
      description: ''
    };
    updateFormData('solutionSteps', [...(formData.solutionSteps || []), newStep]);
  };

  const updateSolutionStep = (index: number, description: string) => {
    const updated = [...(formData.solutionSteps || [])];
    updated[index] = { ...updated[index], description };
    updateFormData('solutionSteps', updated);
  };

  const removeSolutionStep = (index: number) => {
    const updated = [...(formData.solutionSteps || [])];
    updated.splice(index, 1);
    // Reordenar os passos
    updated.forEach((step, idx) => {
      step.step = idx + 1;
    });
    updateFormData('solutionSteps', updated);
  };

  const addPartNeeded = () => {
    const newPart: PartNeeded = { name: '' };
    updateFormData('partsNeeded', [...(formData.partsNeeded || []), newPart]);
  };

  const updatePartNeeded = (index: number, field: keyof PartNeeded, value: any) => {
    const updated = [...(formData.partsNeeded || [])];
    updated[index] = { ...updated[index], [field]: value };
    updateFormData('partsNeeded', updated);
  };

  const removePartNeeded = (index: number) => {
    const updated = [...(formData.partsNeeded || [])];
    updated.splice(index, 1);
    updateFormData('partsNeeded', updated);
  };

  const validateForm = (): string | null => {
    if (!formData.problemTitle.trim()) return 'Título do problema é obrigatório';
    if (!formData.problemDescription.trim()) return 'Descrição do problema é obrigatória';
    if (!formData.category) return 'Categoria é obrigatória';
    if (!formData.solutionTitle.trim()) return 'Título da solução é obrigatório';
    if (!formData.solutionDescription.trim()) return 'Descrição da solução é obrigatória';

    // Validar sintomas
    if (formData.symptoms?.some(s => !s.symptom.trim())) {
      return 'Todos os sintomas devem ser preenchidos';
    }

    // Validar marcas
    if (formData.vehicleMakes?.some(m => !m.make.trim())) {
      return 'Todas as marcas devem ser preenchidas';
    }

    // Validar modelos
    if (formData.vehicleModels?.some(m => !m.model.trim())) {
      return 'Todos os modelos devem ser preenchidos';
    }

    // Validar passos da solução
    if (formData.solutionSteps?.some(s => !s.description.trim())) {
      return 'Todos os passos da solução devem ser preenchidos';
    }

    // Validar peças
    if (formData.partsNeeded?.some(p => !p.name.trim())) {
      return 'Todas as peças devem ter nome preenchido';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      showNotification(validationError, 'error');
      return;
    }

    try {
      setLoading(true);

      // Limpar arrays vazios
      const cleanData: CreateKnowledgeData = {
        ...formData,
        symptoms: formData.symptoms?.filter(s => s.symptom.trim()) || [],
        vehicleMakes: formData.vehicleMakes?.filter(m => m.make.trim()) || [],
        vehicleModels: formData.vehicleModels?.filter(m => m.model.trim()) || [],
        solutionSteps: formData.solutionSteps?.filter(s => s.description.trim()) || [],
        partsNeeded: formData.partsNeeded?.filter(p => p.name.trim()) || [],
      };

      await knowledgeApi.create(cleanData);

      showNotification('Solução compartilhada com sucesso!', 'success');
      router.push('/knowledge');
    } catch (err: unknown) {
      console.error('[NewKnowledgePage] Erro ao criar solução:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao compartilhar solução';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="secondary"
            onClick={() => router.push('/knowledge')}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#D0D6DE]">
              Compartilhar Solução
            </h1>
            <p className="text-[#7E8691] mt-1">
              Ajude seus colegas compartilhando problemas e soluções
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Problema */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6">
            <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#FF4E3D] rounded-full" />{' '}
              Problema
            </h2>

            <div className="space-y-4">
              <Input
                label="Título do Problema"
                placeholder="Ex: Motor não pega"
                value={formData.problemTitle}
                onChange={(e) => updateFormData('problemTitle', e.target.value)}
                required
              />

              <Textarea
                label="Descrição Detalhada"
                placeholder="Descreva o problema em detalhes..."
                value={formData.problemDescription}
                onChange={(e) => updateFormData('problemDescription', e.target.value)}
                rows={4}
                required
              />

              <Select
                label="Categoria"
                value={formData.category}
                onChange={(e) => updateFormData('category', e.target.value)}
                options={categoryOptions}
                required
              />

              {/* Sintomas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#D0D6DE]">Sintomas (Opcional)</span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addSymptom}
                  >
                    <PlusIcon className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.symptoms?.map((symptom, index) => (
                    <div key={`symptom-${index}-${symptom.symptom}`} className="flex gap-2">
                      <Input
                        label=""
                        placeholder="Ex: Barulho estranho no motor"
                        value={symptom.symptom}
                        onChange={(e) => updateSymptom(index, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => removeSymptom(index)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Veículos Afetados */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6">
            <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#FFA500] rounded-full" />{' '}
              Veículos Afetados (Opcional)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Marcas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#D0D6DE]">Marcas</span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addVehicleMake}
                  >
                    <PlusIcon className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.vehicleMakes?.map((make, index) => (
                    <div key={`make-${index}-${make.make}`} className="flex gap-2">
                      <Input
                        label=""
                        placeholder="Ex: Fiat"
                        value={make.make}
                        onChange={(e) => updateVehicleMake(index, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => removeVehicleMake(index)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modelos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#D0D6DE]">Modelos</span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addVehicleModel}
                  >
                    <PlusIcon className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.vehicleModels?.map((model, index) => (
                    <div key={`model-${index}-${model.model}`} className="flex gap-2">
                      <Input
                        label=""
                        placeholder="Ex: Uno"
                        value={model.model}
                        onChange={(e) => updateVehicleModel(index, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => removeVehicleModel(index)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Solução */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6">
            <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#00E0B8] rounded-full" />{' '}
              Solução
            </h2>

            <div className="space-y-4">
              <Input
                label="Título da Solução"
                placeholder="Ex: Substituir velas de ignição"
                value={formData.solutionTitle}
                onChange={(e) => updateFormData('solutionTitle', e.target.value)}
                required
              />

              <Textarea
                label="Descrição Detalhada"
                placeholder="Descreva como resolver o problema..."
                value={formData.solutionDescription}
                onChange={(e) => updateFormData('solutionDescription', e.target.value)}
                rows={4}
                required
              />

              {/* Passos da Solução */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#D0D6DE]">Passos da Solução (Opcional)</span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addSolutionStep}
                  >
                    <PlusIcon className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.solutionSteps?.map((step, index) => (
                    <div key={`step-${index}-${step.step}`} className="flex gap-2">
                      <span className="flex-shrink-0 w-8 h-8 bg-[#00E0B8] text-[#0F1115] rounded-full flex items-center justify-center text-sm font-medium">
                        {step.step}
                      </span>
                      <Textarea
                        label=""
                        placeholder="Descreva o passo..."
                        value={step.description}
                        onChange={(e) => updateSolutionStep(index, e.target.value)}
                        rows={2}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => removeSolutionStep(index)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Peças e Custos */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6">
            <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#3ABFF8] rounded-full" />{' '}
              Peças e Custos (Opcional)
            </h2>

            {/* Peças Necessárias */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#D0D6DE]">Peças Necessárias</span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addPartNeeded}
                >
                  <PlusIcon className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {formData.partsNeeded?.map((part, index) => (
                  <div key={`part-${index}-${part.name}`} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 bg-[#0F1115] rounded-lg">
                    <Input
                      label=""
                      placeholder="Nome da peça"
                      value={part.name}
                      onChange={(e) => updatePartNeeded(index, 'name', e.target.value)}
                    />
                    <Input
                      label=""
                      placeholder="Código (opcional)"
                      value={part.partNumber || ''}
                      onChange={(e) => updatePartNeeded(index, 'partNumber', e.target.value)}
                    />
                    <Input
                      label=""
                      type="number"
                      step="0.01"
                      placeholder="Custo médio"
                      value={part.avgCost || ''}
                      onChange={(e) => updatePartNeeded(index, 'avgCost', Number.parseFloat(e.target.value) || undefined)}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => removePartNeeded(index)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Estimativas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="number"
                step="0.01"
                label="Custo Estimado Total (R$)"
                placeholder="Ex: 150.00"
                value={formData.estimatedCost || ''}
                onChange={(e) => updateFormData('estimatedCost', Number.parseFloat(e.target.value) || undefined)}
              />
              <Input
                type="number"
                step="0.1"
                label="Tempo Estimado (horas)"
                placeholder="Ex: 2.5"
                value={formData.estimatedTime || ''}
                onChange={(e) => updateFormData('estimatedTime', Number.parseFloat(e.target.value) || undefined)}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/knowledge')}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Compartilhando...
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Compartilhar Solução
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
