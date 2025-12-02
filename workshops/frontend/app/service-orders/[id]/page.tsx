'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { serviceOrdersApi, ServiceOrder, ServiceOrderStatus } from '@/lib/api/service-orders';
import { Button } from '@/components/ui/Button';
import { AttachmentsPanel } from '@/components/AttachmentsPanel';
import { ChecklistPanel } from '@/components/ChecklistPanel';
import { Modal } from '@/components/ui/Modal';

export const dynamic = 'force-dynamic';

export default function ServiceOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [serviceOrder, setServiceOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [finalNotes, setFinalNotes] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadServiceOrder();
  }, [id]);

  const loadServiceOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await serviceOrdersApi.findOne(id);
      setServiceOrder(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar ordem de serviço';
      setError(errorMessage);
      console.error('Erro ao carregar ordem de serviço:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      setActionLoading('start');
      await serviceOrdersApi.start(id);
      await loadServiceOrder();
    } catch (err: unknown) {
      console.error('Erro ao iniciar ordem de serviço:', err);
      alert('Erro ao iniciar ordem de serviço');
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async () => {
    try {
      setActionLoading('complete');
      await serviceOrdersApi.complete(id, finalNotes.trim() || undefined);
      setShowCompleteModal(false);
      setFinalNotes('');
      await loadServiceOrder();
    } catch (err: unknown) {
      console.error('Erro ao completar ordem de serviço:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao completar ordem de serviço';
      alert(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Tem certeza que deseja cancelar esta ordem de serviço?')) {
      return;
    }

    try {
      setActionLoading('cancel');
      await serviceOrdersApi.cancel(id);
      await loadServiceOrder();
    } catch (err: unknown) {
      console.error('Erro ao cancelar ordem de serviço:', err);
      alert('Erro ao cancelar ordem de serviço');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: ServiceOrderStatus) => {
    const statusConfig: Record<ServiceOrderStatus, { label: string; className: string }> = {
      [ServiceOrderStatus.SCHEDULED]: { label: 'Agendada', className: 'bg-[#3ABFF8] text-white' },
      [ServiceOrderStatus.IN_PROGRESS]: { label: 'Em Andamento', className: 'bg-[#00E0B8] text-[#0F1115]' },
      [ServiceOrderStatus.COMPLETED]: { label: 'Concluída', className: 'bg-[#00E0B8] text-[#0F1115]' },
      [ServiceOrderStatus.CANCELLED]: { label: 'Cancelada', className: 'bg-[#FF4E3D] text-white' },
      [ServiceOrderStatus.ON_HOLD]: { label: 'Em Espera', className: 'bg-[#7E8691] text-white' },
    };

    const config = statusConfig[status];
    return (
      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8]"></div>
      </div>
    );
  }

  if (error || !serviceOrder) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#FF4E3D]/10 border border-[#FF4E3D] rounded-lg p-6">
            <p className="text-[#FF4E3D]">{error || 'Ordem de serviço não encontrada'}</p>
            <Link href="/service-orders" className="mt-4 inline-block">
              <Button variant="outline">Voltar para Ordens de Serviço</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/service-orders" className="text-[#00E0B8] hover:text-[#3ABFF8] mb-4 inline-block">
            ← Voltar para Ordens de Serviço
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#D0D6DE]">Ordem de Serviço {serviceOrder.number}</h1>
              <p className="text-[#7E8691] mt-2">Criada em {formatDate(serviceOrder.createdAt)}</p>
            </div>
            <div className="flex items-center gap-4">
              {getStatusBadge(serviceOrder.status)}
              <div className="flex gap-2">
                {serviceOrder.status === ServiceOrderStatus.SCHEDULED && (
                  <Button variant="primary" onClick={handleStart} disabled={actionLoading === 'start'}>
                    {actionLoading === 'start' ? 'Iniciando...' : 'Iniciar'}
                  </Button>
                )}
                {serviceOrder.status === ServiceOrderStatus.IN_PROGRESS && (
                  <Button variant="primary" onClick={() => setShowCompleteModal(true)} disabled={actionLoading === 'complete'}>
                    Finalizar
                  </Button>
                )}
                {serviceOrder.status !== ServiceOrderStatus.COMPLETED && serviceOrder.status !== ServiceOrderStatus.CANCELLED && (
                  <Button variant="outline" onClick={handleCancel} disabled={actionLoading === 'cancel'}>
                    {actionLoading === 'cancel' ? 'Cancelando...' : 'Cancelar'}
                  </Button>
                )}
                <Link href={`/service-orders/${id}/edit`}>
                  <Button variant="outline">Editar</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Principais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cliente e Veículo */}
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
              <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Informações do Cliente</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#7E8691]">Cliente</p>
                  <p className="text-[#D0D6DE] font-medium">
                    {serviceOrder.customer ? (
                      <Link href={`/customers/${serviceOrder.customer.id}`} className="text-[#00E0B8] hover:text-[#3ABFF8]">
                        {serviceOrder.customer.name}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#7E8691]">Telefone</p>
                  <p className="text-[#D0D6DE]">{serviceOrder.customer?.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#7E8691]">Veículo</p>
                  <p className="text-[#D0D6DE] font-medium">
                    {serviceOrder.vehiclePlaca || serviceOrder.vehicleMake || serviceOrder.vehicleModel ? (
                      <span>
                        {serviceOrder.vehiclePlaca && (
                          <span className="text-[#00E0B8]">{serviceOrder.vehiclePlaca}</span>
                        )}
                        {serviceOrder.vehicleMake && serviceOrder.vehicleModel && (
                          <span className="ml-2">
                            {serviceOrder.vehicleMake} {serviceOrder.vehicleModel}
                            {serviceOrder.vehicleYear && ` (${serviceOrder.vehicleYear})`}
                          </span>
                        )}
                        {serviceOrder.vehicleMileage && (
                          <span className="ml-2 text-sm text-[#7E8691]">
                            • {serviceOrder.vehicleMileage.toLocaleString('pt-BR')} km
                          </span>
                        )}
                      </span>
                    ) : serviceOrder.vehicle ? (
                      <Link href={`/vehicles/${serviceOrder.vehicle.id}`} className="text-[#00E0B8] hover:text-[#3ABFF8]">
                        {serviceOrder.vehicle.placa || `${serviceOrder.vehicle.make} ${serviceOrder.vehicle.model}`.trim() || 'Veículo'}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#7E8691]">Técnico</p>
                  <p className="text-[#D0D6DE]">{serviceOrder.technician?.name || '-'}</p>
                </div>
              </div>
            </div>

            {/* Problema Relatado */}
            {(serviceOrder.reportedProblemCategory || serviceOrder.reportedProblemDescription) && (
              <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
                <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Problema Relatado</h2>
                <div className="space-y-3">
                  {serviceOrder.reportedProblemCategory && (
                    <div>
                      <p className="text-sm text-[#7E8691]">Categoria</p>
                      <p className="text-[#D0D6DE] capitalize">{serviceOrder.reportedProblemCategory}</p>
                    </div>
                  )}
                  {serviceOrder.reportedProblemDescription && (
                    <div>
                      <p className="text-sm text-[#7E8691]">Descrição</p>
                      <p className="text-[#D0D6DE]">{serviceOrder.reportedProblemDescription}</p>
                    </div>
                  )}
                  {serviceOrder.reportedProblemSymptoms && serviceOrder.reportedProblemSymptoms.length > 0 && (
                    <div>
                      <p className="text-sm text-[#7E8691] mb-2">Sintomas</p>
                      <div className="flex flex-wrap gap-2">
                        {serviceOrder.reportedProblemSymptoms.map((symptom, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-[#2A3038] text-[#D0D6DE] rounded-full text-sm"
                          >
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Problema Identificado */}
            {(serviceOrder.identifiedProblemCategory || serviceOrder.identifiedProblemDescription || serviceOrder.diagnosticNotes) && (
              <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
                <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Diagnóstico</h2>
                <div className="space-y-3">
                  {serviceOrder.identifiedProblemCategory && (
                    <div>
                      <p className="text-sm text-[#7E8691]">Categoria Identificada</p>
                      <p className="text-[#D0D6DE] capitalize">{serviceOrder.identifiedProblemCategory}</p>
                    </div>
                  )}
                  {serviceOrder.identifiedProblemDescription && (
                    <div>
                      <p className="text-sm text-[#7E8691]">Descrição do Problema Identificado</p>
                      <p className="text-[#D0D6DE]">{serviceOrder.identifiedProblemDescription}</p>
                    </div>
                  )}
                  {serviceOrder.diagnosticNotes && (
                    <div>
                      <p className="text-sm text-[#7E8691]">Observações do Mecânico</p>
                      <p className="text-[#D0D6DE]">{serviceOrder.diagnosticNotes}</p>
                    </div>
                  )}
                  {serviceOrder.recommendations && (
                    <div>
                      <p className="text-sm text-[#7E8691]">Recomendações</p>
                      <p className="text-[#D0D6DE]">{serviceOrder.recommendations}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Itens da Ordem de Serviço */}
            {serviceOrder.items && serviceOrder.items.length > 0 && (
              <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
                <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Itens da Ordem de Serviço</h2>
                <div className="space-y-3">
                  {serviceOrder.items.map((item, index) => (
                    <div key={index} className="bg-[#0F1115] p-4 rounded-lg border border-[#2A3038]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <span className="text-[#D0D6DE] font-medium">{item.name}</span>
                          {item.description && (
                            <p className="text-sm text-[#7E8691] mt-1">{item.description}</p>
                          )}
                          <div className="text-sm text-[#7E8691] mt-2">
                            Quantidade: {item.quantity} × {formatCurrency(item.unitCost)} = {formatCurrency(item.totalCost)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Observações */}
            {serviceOrder.notes && (
              <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
                <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Observações</h2>
                <p className="text-[#D0D6DE]">{serviceOrder.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resumo Financeiro */}
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
              <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Resumo Financeiro</h2>
              <div className="space-y-3">
                {serviceOrder.laborCost && serviceOrder.laborCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#7E8691]">Mão de Obra:</span>
                    <span className="text-[#D0D6DE]">{formatCurrency(serviceOrder.laborCost)}</span>
                  </div>
                )}
                {serviceOrder.partsCost && serviceOrder.partsCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#7E8691]">Peças:</span>
                    <span className="text-[#D0D6DE]">{formatCurrency(serviceOrder.partsCost)}</span>
                  </div>
                )}
                {serviceOrder.discount && serviceOrder.discount > 0 && (
                  <div className="flex justify-between text-[#FF4E3D]">
                    <span>Desconto:</span>
                    <span>-{formatCurrency(serviceOrder.discount)}</span>
                  </div>
                )}
                {serviceOrder.taxAmount && serviceOrder.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#7E8691]">Impostos:</span>
                    <span className="text-[#D0D6DE]">{formatCurrency(serviceOrder.taxAmount)}</span>
                  </div>
                )}
                <div className="border-t border-[#2A3038] pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-[#D0D6DE]">Total:</span>
                    <span className="text-2xl font-bold text-[#00E0B8]">
                      {serviceOrder.totalCost !== undefined && serviceOrder.totalCost !== null 
                        ? formatCurrency(serviceOrder.totalCost) 
                        : formatCurrency((serviceOrder.laborCost || 0) + (serviceOrder.partsCost || 0) - (serviceOrder.discount || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Informações Adicionais */}
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
              <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Informações Adicionais</h2>
              <div className="space-y-3">
                {serviceOrder.elevator && (
                  <div>
                    <p className="text-sm text-[#7E8691]">Elevador</p>
                    <p className="text-[#D0D6DE]">
                      <Link href={`/elevators/${serviceOrder.elevator.id}`} className="text-[#00E0B8] hover:text-[#3ABFF8]">
                        {serviceOrder.elevator.name} ({serviceOrder.elevator.number})
                      </Link>
                    </p>
                  </div>
                )}
                {serviceOrder.quote && (
                  <div>
                    <p className="text-sm text-[#7E8691]">Orçamento</p>
                    <p className="text-[#D0D6DE]">
                      <Link href={`/quotes/${serviceOrder.quote.id}`} className="text-[#00E0B8] hover:text-[#3ABFF8]">
                        {serviceOrder.quote.number}
                      </Link>
                    </p>
                  </div>
                )}
                {serviceOrder.appointmentDate && (
                  <div>
                    <p className="text-sm text-[#7E8691]">Agendado para</p>
                    <p className="text-[#D0D6DE]">{formatDate(serviceOrder.appointmentDate)}</p>
                  </div>
                )}
                {serviceOrder.startedAt && (
                  <div>
                    <p className="text-sm text-[#7E8691]">Iniciado em</p>
                    <p className="text-[#D0D6DE]">{formatDate(serviceOrder.startedAt)}</p>
                  </div>
                )}
                {serviceOrder.completedAt && (
                  <div>
                    <p className="text-sm text-[#7E8691]">Finalizado em</p>
                    <p className="text-[#D0D6DE]">{formatDate(serviceOrder.completedAt)}</p>
                  </div>
                )}
                {serviceOrder.estimatedHours && (
                  <div>
                    <p className="text-sm text-[#7E8691]">Horas Estimadas</p>
                    <p className="text-[#D0D6DE]">{serviceOrder.estimatedHours}h</p>
                  </div>
                )}
                {serviceOrder.actualHours && (
                  <div>
                    <p className="text-sm text-[#7E8691]">Horas Reais</p>
                    <p className="text-[#D0D6DE]">{serviceOrder.actualHours}h</p>
                  </div>
                )}
                {!serviceOrder.elevator && !serviceOrder.quote && !serviceOrder.appointmentDate && !serviceOrder.startedAt && !serviceOrder.completedAt && !serviceOrder.estimatedHours && !serviceOrder.actualHours && (
                  <p className="text-sm text-[#7E8691]">Nenhuma informação adicional disponível</p>
                )}
              </div>
            </div>

            {/* Attachments */}
            <AttachmentsPanel
              entityType="service_order"
              entityId={id}
              attachments={serviceOrder.attachments}
              onAttachmentsChange={(attachments) => {
                setServiceOrder({ ...serviceOrder, attachments });
              }}
              readonly={serviceOrder.status === ServiceOrderStatus.COMPLETED || serviceOrder.status === ServiceOrderStatus.CANCELLED}
            />

            {/* Checklists */}
            <ChecklistPanel
              entityType="service_order"
              entityId={id}
              checklists={serviceOrder.checklists}
              onChecklistsChange={(checklists) => {
                setServiceOrder({ ...serviceOrder, checklists });
              }}
              readonly={serviceOrder.status === ServiceOrderStatus.COMPLETED || serviceOrder.status === ServiceOrderStatus.CANCELLED}
              canComplete={serviceOrder.status === ServiceOrderStatus.IN_PROGRESS || serviceOrder.status === ServiceOrderStatus.SCHEDULED}
            />
          </div>
        </div>
      </div>

      {/* Modal de Finalização */}
      <Modal
        isOpen={showCompleteModal}
        onClose={() => {
          setShowCompleteModal(false);
          setFinalNotes('');
        }}
        title="Finalizar Ordem de Serviço"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-[#7E8691]">
            Descreva o que foi realizado no serviço, observações importantes e qualquer informação relevante para o cliente.
          </p>
          <div>
            <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
              Observações Finais do Mecânico <span className="text-[#7E8691]">(opcional)</span>
            </label>
            <textarea
              className="w-full px-4 py-2 bg-[#0F1115] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]"
              rows={6}
              placeholder="Ex: Serviço concluído com sucesso. Todas as peças foram substituídas conforme especificado. Veículo testado e aprovado..."
              value={finalNotes}
              onChange={(e) => setFinalNotes(e.target.value)}
              maxLength={2000}
            />
            <p className="text-xs text-[#7E8691] mt-1">
              {finalNotes.length}/2000 caracteres
            </p>
          </div>
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-[#2A3038]">
            <Button
              variant="outline"
              onClick={() => {
                setShowCompleteModal(false);
                setFinalNotes('');
              }}
              disabled={actionLoading === 'complete'}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleComplete}
              disabled={actionLoading === 'complete'}
            >
              {actionLoading === 'complete' ? 'Finalizando...' : 'Finalizar OS'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

