'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { quotesApi, Quote, UpdateQuoteDto, QuoteStatus, QuoteItem, QuoteItemType, ProblemCategory } from '@/lib/api/quotes';
import { customersApi, Customer } from '@/lib/api/customers';
import { vehiclesApi, Vehicle } from '@/lib/api/vehicles';
import { elevatorsApi, Elevator } from '@/lib/api/elevators';
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

export default function EditQuotePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [elevators, setElevators] = useState<Elevator[]>([]);
  const [formData, setFormData] = useState<UpdateQuoteDto>({});
  const [quote, setQuote] = useState<Quote | null>(null);
  const [symptomInput, setSymptomInput] = useState('');
  const [newItem, setNewItem] = useState<Partial<QuoteItem>>({
    type: QuoteItemType.SERVICE,
    name: '',
    quantity: 1,
    unitCost: 0,
  });

  useEffect(() => {
    loadInitialData();
    loadQuote();
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

  const loadQuote = async () => {
    try {
      setLoadingData(true);
      const data = await quotesApi.findOne(id);
      setQuote(data);
      setFormData({
        customerId: data.customerId,
        vehicleId: data.vehicleId,
        elevatorId: data.elevatorId,
        status: data.status,
        laborCost: data.laborCost,
        partsCost: data.partsCost,
        discount: data.discount,
        taxAmount: data.taxAmount,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString().slice(0, 16) : undefined,
        validUntil: data.validUntil ? new Date(data.validUntil).toISOString().slice(0, 16) : undefined,
        reportedProblemCategory: data.reportedProblemCategory as ProblemCategory | undefined,
        reportedProblemDescription: data.reportedProblemDescription,
        reportedProblemSymptoms: data.reportedProblemSymptoms || [],
        identifiedProblemCategory: data.identifiedProblemCategory as ProblemCategory | undefined,
        identifiedProblemDescription: data.identifiedProblemDescription,
        recommendations: data.recommendations,
        items: data.items || [],
      });
      
      if (data.customerId) {
        await loadVehicles(data.customerId);
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar orçamento:', err);
      alert('Erro ao carregar orçamento');
      router.push('/quotes');
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

  const addItem = () => {
    if (!newItem.name || !newItem.unitCost) {
      alert('Preencha nome e custo unitário do item');
      return;
    }

    const item: QuoteItem = {
      type: newItem.type || QuoteItemType.SERVICE,
      name: newItem.name,
      description: newItem.description,
      quantity: newItem.quantity || 1,
      unitCost: newItem.unitCost,
      totalCost: (newItem.quantity || 1) * newItem.unitCost,
      hours: newItem.hours,
    };

    setFormData({
      ...formData,
      items: [...(formData.items || []), item],
    });

    setNewItem({
      type: QuoteItemType.SERVICE,
      name: '',
      description: '',
      quantity: 1,
      unitCost: 0,
      hours: undefined,
    });
  };

  const removeItem = (index: number) => {
    const newItems = [...(formData.items || [])];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    const itemsTotal = (formData.items || []).reduce((sum, item) => sum + item.totalCost, 0);
    const laborCost = formData.laborCost || 0;
    const partsCost = formData.partsCost || 0;
    const subtotal = itemsTotal + laborCost + partsCost;
    const discount = formData.discount || 0;
    const tax = formData.taxAmount || 0;
    return subtotal - discount + tax;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar se pode editar itens/valores
    const canEditItems = quote && (
      quote.status === QuoteStatus.DIAGNOSED ||
      quote.status === QuoteStatus.SENT ||
      quote.status === QuoteStatus.VIEWED ||
      quote.status === QuoteStatus.ACCEPTED
    );

    if (!canEditItems && (formData.items && formData.items.length > 0)) {
      alert('Não é possível adicionar itens antes do diagnóstico. O orçamento deve estar com status DIAGNOSED ou superior.');
      return;
    }

    if (canEditItems && (!formData.items || formData.items.length === 0)) {
      alert('Adicione pelo menos um item ao orçamento');
      return;
    }

    try {
      setLoading(true);
      
      // Preparar dados para envio
      const data: UpdateQuoteDto = {
        ...formData,
        reportedProblemDescription: formData.reportedProblemDescription?.trim() || undefined,
        recommendations: formData.recommendations?.trim() || undefined,
        reportedProblemSymptoms: formData.reportedProblemSymptoms?.length ? formData.reportedProblemSymptoms : undefined,
        discount: formData.discount || 0,
        taxAmount: formData.taxAmount || 0,
      };

      // Se não pode editar itens, remover itens do payload
      if (!canEditItems) {
        delete data.items;
        delete data.laborCost;
        delete data.partsCost;
        delete data.discount;
        delete data.taxAmount;
      } else {
        // Validar e formatar itens antes de enviar
        if (data.items && data.items.length > 0) {
          data.items = data.items.map(item => {
            // Remover campos que não devem ser enviados (totalCost é calculado no backend)
            const { totalCost, ...itemData } = item;
            return {
              type: item.type || QuoteItemType.SERVICE,
              name: item.name || '',
              description: item.description || undefined,
              quantity: item.quantity || 1,
              unitCost: item.unitCost || 0,
              hours: item.hours || undefined,
              serviceId: item.serviceId || undefined,
              partId: item.partId || undefined,
            };
          }).filter(item => item.name && item.unitCost > 0); // Remover itens inválidos
        }
      }

      await quotesApi.update(id, data);
      router.push(`/quotes/${id}`);
    } catch (err: any) {
      console.error('Erro ao atualizar orçamento:', err);
      let errorMessage = 'Erro ao atualizar orçamento';
      
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href={`/quotes/${id}`} className="text-[#00E0B8] hover:text-[#3ABFF8] mb-4 inline-block">
            ← Voltar para Orçamento
          </Link>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-[#D0D6DE]">Editar Orçamento</h1>
            <Link href={`/quotes/${id}`}>
              <Button variant="outline">Cancelar</Button>
            </Link>
          </div>
          <p className="text-[#7E8691]">Edite as informações do orçamento</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          {/* Diagnóstico do Mecânico */}
          {quote && (quote.status === QuoteStatus.DIAGNOSED || quote.status === QuoteStatus.SENT || quote.status === QuoteStatus.VIEWED || quote.status === QuoteStatus.ACCEPTED) && (
            <div className="border-t border-[#2A3038] pt-6">
              <h3 className="text-lg font-semibold text-[#D0D6DE] mb-4">Diagnóstico do Mecânico</h3>
              <div className="bg-[#2A3038] border border-[#00E0B8] rounded-lg p-4 space-y-3">
                {quote.identifiedProblemCategory && (
                  <div>
                    <p className="text-sm text-[#7E8691]">Categoria do Problema Identificado</p>
                    <p className="text-[#D0D6DE] font-medium capitalize">
                      {quote.identifiedProblemCategory.replace('_', ' ')}
                    </p>
                  </div>
                )}
                {quote.identifiedProblemDescription && (
                  <div>
                    <p className="text-sm text-[#7E8691]">Descrição do Problema Identificado</p>
                    <p className="text-[#D0D6DE]">{quote.identifiedProblemDescription}</p>
                  </div>
                )}
                {quote.diagnosticNotes && (
                  <div>
                    <p className="text-sm text-[#7E8691]">Notas de Diagnóstico</p>
                    <p className="text-[#D0D6DE]">{quote.diagnosticNotes}</p>
                  </div>
                )}
                {quote.recommendations && (
                  <div>
                    <p className="text-sm text-[#7E8691]">Recomendações</p>
                    <p className="text-[#D0D6DE]">{quote.recommendations}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Itens do Orçamento - Só aparece depois do diagnóstico */}
          {quote && (quote.status === QuoteStatus.DIAGNOSED || quote.status === QuoteStatus.SENT || quote.status === QuoteStatus.VIEWED || quote.status === QuoteStatus.ACCEPTED) && (
          <div className="border-t border-[#2A3038] pt-6">
            <h3 className="text-lg font-semibold text-[#D0D6DE] mb-4">Itens do Orçamento</h3>
            
            <div className="bg-[#0F1115] p-4 rounded-lg border border-[#2A3038] mb-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <Select
                    label="Tipo"
                    value={newItem.type || QuoteItemType.SERVICE}
                    onChange={(e) => setNewItem({ ...newItem, type: e.target.value as QuoteItemType })}
                    options={[
                      { value: QuoteItemType.SERVICE, label: 'Serviço' },
                      { value: QuoteItemType.PART, label: 'Peça' },
                    ]}
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Nome"
                    placeholder="Nome do serviço ou peça"
                    value={newItem.name || ''}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  />
                </div>
                <div>
                  <Input
                    label="Quantidade"
                    type="number"
                    min="1"
                    value={newItem.quantity || 1}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Input
                    label="Custo Unitário"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItem.unitCost || 0}
                    onChange={(e) => setNewItem({ ...newItem, unitCost: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-end">
                  <Button type="button" variant="secondary" onClick={addItem}>
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>

            {formData.items && formData.items.length > 0 && (
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="bg-[#0F1115] p-4 rounded-lg border border-[#2A3038] flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#D0D6DE]">{item.name}</span>
                        <span className="text-xs text-[#7E8691]">
                          ({item.type === QuoteItemType.SERVICE ? 'Serviço' : 'Peça'})
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-[#7E8691] mt-1">{item.description}</p>
                      )}
                      <div className="text-sm text-[#7E8691] mt-1">
                        {item.quantity}x R$ {item.unitCost.toFixed(2)} = R$ {item.totalCost.toFixed(2)}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-[#FF4E3D] border-[#FF4E3D] hover:bg-[#FF4E3D]/10"
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Input
                label="Custo de Mão de Obra"
                type="number"
                step="0.01"
                min="0"
                value={formData.laborCost || 0}
                onChange={(e) => setFormData({ ...formData, laborCost: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="Custo de Peças"
                type="number"
                step="0.01"
                min="0"
                value={formData.partsCost || 0}
                onChange={(e) => setFormData({ ...formData, partsCost: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="Desconto"
                type="number"
                step="0.01"
                min="0"
                value={formData.discount || 0}
                onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="mt-4 p-4 bg-[#2A3038] rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-[#D0D6DE]">Total:</span>
                <span className="text-2xl font-bold text-[#00E0B8]">
                  R$ {calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          )}

          {/* Mensagem se não pode editar itens ainda */}
          {quote && (quote.status === QuoteStatus.DRAFT || quote.status === QuoteStatus.AWAITING_DIAGNOSIS) && (
            <div className="border-t border-[#2A3038] pt-6">
              <div className="bg-[#2A3038] border border-[#FFA500] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-[#FFA500] text-xl">⚠️</div>
                  <div>
                    <h4 className="font-semibold text-[#D0D6DE] mb-1">Aguardando Diagnóstico</h4>
                    <p className="text-sm text-[#7E8691]">
                      {quote.status === QuoteStatus.DRAFT 
                        ? 'Envie o orçamento para diagnóstico do mecânico primeiro.'
                        : 'O mecânico ainda está avaliando o orçamento. Após o diagnóstico, você poderá adicionar itens e valores.'}
                    </p>
                    {quote.status === QuoteStatus.DRAFT && (
                      <Link href={`/quotes/${id}`}>
                        <Button variant="primary" className="mt-2">
                          Ver Detalhes
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-[#2A3038]">
            <Link href={`/quotes/${id}`}>
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

