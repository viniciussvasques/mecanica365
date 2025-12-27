'use client';

import { useState, useEffect } from 'react';
import {
  checklistsApi,
  Checklist,
  ChecklistType,
  ChecklistEntityType,
  ChecklistStatus,
  ChecklistItem,
} from '@/lib/api/checklists';
import { getAxiosErrorMessage } from '@/lib/utils/error.utils';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { logger } from '@/lib/utils/logger';

interface ChecklistPanelProps {
  entityType: 'quote' | 'service_order';
  entityId: string;
  checklists?: Checklist[];
  onChecklistsChange?: (checklists: Checklist[]) => void;
  readonly?: boolean;
  canComplete?: boolean;
}

export function ChecklistPanel({
  entityType,
  entityId,
  checklists: initialChecklists = [],
  onChecklistsChange,
  readonly = false,
  canComplete = false,
}: ChecklistPanelProps) {
  const [checklists, setChecklists] = useState<Checklist[]>(initialChecklists);
  const [loading, setLoading] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [itemStates, setItemStates] = useState<Record<string, { completed: boolean; notes: string }>>({});

  useEffect(() => {
    loadChecklists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, entityType]);

  const loadChecklists = async () => {
    try {
      setLoading(true);
      const response = await checklistsApi.findAll({
        entityType: entityType === 'quote' ? ChecklistEntityType.QUOTE : ChecklistEntityType.SERVICE_ORDER,
        entityId,
        page: 1,
        limit: 100,
      });
      setChecklists(response.data);
      onChecklistsChange?.(response.data);
    } catch (error: unknown) {
      logger.error('[ChecklistPanel] Erro ao carregar checklists:', error);
      // Erro silencioso - não precisa mostrar para o usuário em carregamento inicial
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCompleteModal = (checklist: Checklist) => {
    setSelectedChecklist(checklist);
    const states: Record<string, { completed: boolean; notes: string }> = {};
    if (checklist.items && Array.isArray(checklist.items)) {
      checklist.items.forEach((item) => {
        states[item.id || item.title] = {
          completed: item.isCompleted || false,
          notes: item.notes || '',
        };
      });
    }
    setItemStates(states);
    setShowCompleteModal(true);
  };

  const handleComplete = async () => {
    if (!selectedChecklist) return;

    try {
      setCompleting(true);

      // O backend espera itemId (UUID), não title
      const items = (selectedChecklist.items || [])
        .filter((item) => {
          if (!item.id) {
            logger.warn('Item sem ID encontrado:', item);
            return false;
          }
          return true;
        })
        .map((item) => {
          const itemKey = item.id || item.title;
          const state = itemStates[itemKey] || { completed: false, notes: '' };
          return {
            itemId: item.id!, // Backend requer itemId (UUID)
            isCompleted: Boolean(state.completed), // Garantir que é boolean
            // Enviar notes apenas se não estiver vazio
            ...(state.notes && state.notes.trim() ? { notes: state.notes.trim() } : {}),
          };
        });

      if (items.length === 0) {
        alert('Nenhum item válido encontrado no checklist. Verifique se os itens têm ID.');
        return;
      }

      logger.log('Enviando items para completar checklist:', JSON.stringify(items, null, 2));
      logger.log('Payload completo:', JSON.stringify({ items }, null, 2));

      try {
        const result = await checklistsApi.complete(selectedChecklist.id, { items });
        logger.log('Checklist completado com sucesso:', result);
        await loadChecklists();
        setShowCompleteModal(false);
        setSelectedChecklist(null);
      } catch (apiError: unknown) {
        // Log detalhado do erro
        logger.error('[ChecklistPanel] Erro ao completar checklist:', apiError);
        if (apiError && typeof apiError === 'object' && 'response' in apiError) {
          const axiosError = apiError as { response?: { data?: unknown; status?: number } };
          logger.error('[ChecklistPanel] Response data:', axiosError.response?.data);
          logger.error('[ChecklistPanel] Response status:', axiosError.response?.status);
        }

        const errorMessage = getAxiosErrorMessage(apiError) || 'Erro ao completar checklist. Verifique se todos os itens obrigatórios foram marcados.';
        alert(errorMessage);
        throw apiError; // Re-throw para não continuar
      }
    } catch (error: unknown) {
      logger.error('[ChecklistPanel] Erro ao completar checklist:', error);
      const errorMessage = getAxiosErrorMessage(error) || 'Erro ao completar checklist. Verifique se todos os itens obrigatórios foram marcados.';
      alert(errorMessage);
    } finally {
      setCompleting(false);
    }
  };

  const getTypeLabel = (type: ChecklistType): string => {
    const labels: Record<ChecklistType, string> = {
      [ChecklistType.PRE_DIAGNOSIS]: 'Pré-Diagnóstico',
      [ChecklistType.PRE_SERVICE]: 'Pré-Serviço',
      [ChecklistType.DURING_SERVICE]: 'Durante Serviço',
      [ChecklistType.POST_SERVICE]: 'Pós-Serviço',
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: ChecklistStatus): string => {
    const labels: Record<ChecklistStatus, string> = {
      [ChecklistStatus.PENDING]: 'Pendente',
      [ChecklistStatus.IN_PROGRESS]: 'Em Progresso',
      [ChecklistStatus.COMPLETED]: 'Completo',
      [ChecklistStatus.CANCELLED]: 'Cancelado',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: ChecklistStatus): string => {
    const colors: Record<ChecklistStatus, string> = {
      [ChecklistStatus.PENDING]: 'bg-yellow-500/20 text-yellow-400',
      [ChecklistStatus.IN_PROGRESS]: 'bg-blue-500/20 text-blue-400',
      [ChecklistStatus.COMPLETED]: 'bg-green-500/20 text-green-400',
      [ChecklistStatus.CANCELLED]: 'bg-red-500/20 text-red-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  if (loading) {
    return (
      <div className="bg-[#0F1115] border border-[#2A3038] rounded-lg p-4">
        <p className="text-[#7E8691]">Carregando checklists...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0F1115] border border-[#2A3038] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#D0D6DE]">Checklists</h3>
      </div>

      {checklists.length === 0 ? (
        <p className="text-[#7E8691] text-sm">Nenhum checklist encontrado</p>
      ) : (
        <div className="space-y-3">
          {checklists.map((checklist) => {
            const items = checklist.items || [];
            const completedItems = items.filter((item) => item.isCompleted).length;
            const totalItems = items.length;
            const requiredItems = items.filter((item) => item.isRequired).length;
            const completedRequired = items.filter(
              (item) => item.isRequired && item.isCompleted,
            ).length;

            return (
              <div
                key={checklist.id}
                className="p-4 bg-[#1A1D24] border border-[#2A3038] rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-[#D0D6DE] font-semibold">{checklist.name}</h4>
                    {checklist.description && (
                      <p className="text-[#7E8691] text-sm mt-1">{checklist.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(checklist.status)}`}>
                      {getStatusLabel(checklist.status)}
                    </span>
                    <span className="px-2 py-1 bg-[#2A3038] text-[#7E8691] text-xs rounded">
                      {getTypeLabel(checklist.checklistType)}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-[#7E8691]">Progresso</span>
                    <span className="text-[#D0D6DE]">
                      {completedItems}/{totalItems} itens
                    </span>
                  </div>
                  <div className="w-full bg-[#2A3038] rounded-full h-2">
                    <div
                      className="bg-[#00E0B8] h-2 rounded-full transition-all"
                      style={{ width: `${(completedItems / totalItems) * 100}%` }}
                    />
                  </div>
                  {requiredItems > 0 && (
                    <p className="text-xs text-[#7E8691] mt-1">
                      Obrigatórios: {completedRequired}/{requiredItems}
                    </p>
                  )}
                </div>

                <div className="space-y-2 mb-3">
                  {items.slice(0, 3).map((item) => (
                    <div key={item.id || item.title} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={item.isCompleted || false}
                        disabled
                        className="w-4 h-4 rounded border-[#2A3038] bg-[#1A1D24] text-[#00E0B8] focus:ring-[#00E0B8]"
                      />
                      <span className={`text-sm ${item.isCompleted ? 'text-[#7E8691] line-through' : 'text-[#D0D6DE]'}`}>
                        {item.title}
                        {item.isRequired && <span className="text-red-400 ml-1">*</span>}
                      </span>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <p className="text-xs text-[#7E8691]">
                      +{items.length - 3} itens...
                    </p>
                  )}
                </div>

                {canComplete &&
                  checklist.status !== ChecklistStatus.COMPLETED &&
                  checklist.status !== ChecklistStatus.CANCELLED && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenCompleteModal(checklist)}
                    >
                      Completar Checklist
                    </Button>
                  )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Completar Checklist */}
      {selectedChecklist && (
        <Modal
          isOpen={showCompleteModal}
          onClose={() => {
            setShowCompleteModal(false);
            setSelectedChecklist(null);
          }}
          title={`Completar: ${selectedChecklist.name}`}
        >
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {(selectedChecklist.items || []).map((item) => {
              const itemKey = item.id || item.title;
              const state = itemStates[itemKey] || { completed: false, notes: '' };

              return (
                <div key={itemKey} className="p-3 bg-[#1A1D24] border border-[#2A3038] rounded-lg">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={state.completed}
                      onChange={(e) => {
                        setItemStates({
                          ...itemStates,
                          [itemKey]: { ...state, completed: e.target.checked },
                        });
                      }}
                      className="mt-1 w-4 h-4 rounded border-[#2A3038] bg-[#1A1D24] text-[#00E0B8] focus:ring-[#00E0B8]"
                    />
                    <div className="flex-1">
                      <label className="text-[#D0D6DE] font-medium">
                        {item.title}
                        {item.isRequired && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      {item.description && (
                        <p className="text-[#7E8691] text-sm mt-1">{item.description}</p>
                      )}
                      <textarea
                        value={state.notes}
                        onChange={(e) => {
                          setItemStates({
                            ...itemStates,
                            [itemKey]: { ...state, notes: e.target.value },
                          });
                        }}
                        placeholder="Notas (opcional)"
                        rows={2}
                        className="w-full mt-2 px-3 py-2 bg-[#0F1115] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8] text-sm"
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-end space-x-2 pt-4 border-t border-[#2A3038]">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCompleteModal(false);
                  setSelectedChecklist(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleComplete}
                disabled={completing}
              >
                {completing ? 'Completando...' : 'Completar Checklist'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

