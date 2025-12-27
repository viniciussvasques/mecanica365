'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    automationsApi,
    Automation,
    AutomationTrigger,
    AutomationAction
} from '@/lib/api/automations';
import { Button } from '@/components/ui/Button';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/lib/utils/errorHandler';

export default function AutomationsPage() {
    const router = useRouter();
    const toast = useToast();
    const [automations, setAutomations] = useState<Automation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadAutomations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadAutomations = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await automationsApi.findAll();
            setAutomations(data);
        } catch (err: unknown) {
            logger.error('Erro ao carregar automações:', err);
            // Mantém o error state para mostrar na UI principal também, se desejar
            setError('Não foi possível carregar as automações.');
            toast.error(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (automation: Automation) => {
        try {
            // Otimistic UI update
            setAutomations((prev) =>
                prev.map((a) => a.id === automation.id ? { ...a, isActive: !a.isActive } : a)
            );

            await automationsApi.update(automation.id, {
                isActive: !automation.isActive
            });
            toast.success(`Automação ${!automation.isActive ? 'ativada' : 'desativada'} com sucesso.`);
        } catch (err) {
            logger.error('Erro ao alternar status:', err);
            // Revert optimistic update
            setAutomations((prev) =>
                prev.map((a) => a.id === automation.id ? { ...a, isActive: automation.isActive } : a)
            );
            toast.error(getErrorMessage(err));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta automação?')) return;

        try {
            await automationsApi.remove(id);
            setAutomations((prev) => prev.filter((a) => a.id !== id));
            toast.success('Automação excluída com sucesso.');
        } catch (err) {
            logger.error('Erro ao excluir automação:', err);
            toast.error(getErrorMessage(err));
        }
    };

    const getTriggerLabel = (trigger: AutomationTrigger) => {
        const labels: Record<string, string> = {
            [AutomationTrigger.QUOTE_APPROVED]: 'Orçamento Aprovado',
            [AutomationTrigger.SERVICE_ORDER_COMPLETED]: 'OS Concluída',
            [AutomationTrigger.INVOICE_ISSUED]: 'Fatura Emitida',
            [AutomationTrigger.PAYMENT_RECEIVED]: 'Pagamento Recebido',
            [AutomationTrigger.STOCK_LOW]: 'Estoque Baixo',
            [AutomationTrigger.APPOINTMENT_SCHEDULED]: 'Agendamento Criado',
            [AutomationTrigger.CUSTOM]: 'Personalizado',
        };
        return labels[trigger] || trigger;
    };

    const getActionLabel = (action: AutomationAction) => {
        const labels: Record<string, string> = {
            [AutomationAction.SEND_EMAIL]: 'Enviar E-mail',
            [AutomationAction.SEND_SMS]: 'Enviar SMS',
            [AutomationAction.CREATE_NOTIFICATION]: 'Criar Notificação',
            [AutomationAction.CREATE_JOB]: 'Criar Job',
            [AutomationAction.UPDATE_STATUS]: 'Atualizar Status',
            [AutomationAction.CUSTOM]: 'Personalizado',
        };
        return labels[action] || action;
    };

    return (
        <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-[#D0D6DE] mb-2">Automações</h1>
                            <p className="text-[#7E8691]">Configure regras automáticas para sua oficina</p>
                        </div>
                        <Link href="/automations/new">
                            <Button variant="primary">
                                + Nova Automação
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Erro */}
                {error && (
                    <div className="bg-[#FF4E3D]/10 border border-[#FF4E3D] rounded-lg p-4 mb-6">
                        <p className="text-[#FF4E3D]">{error}</p>
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto"></div>
                        <p className="mt-4 text-[#7E8691]">Carregando automações...</p>
                    </div>
                ) : automations.length === 0 ? (
                    <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-12 text-center">
                        <span className="text-4xl mb-4 block">🤖</span>
                        <h3 className="text-xl font-semibold text-[#D0D6DE] mb-2">Nenhuma automação configurada</h3>
                        <p className="text-[#7E8691] mb-6">Crie sua primeira automação para ganhar tempo e eficiência.</p>
                        <Link href="/automations/new">
                            <Button variant="primary">
                                Criar Automação Agora
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {automations.map((automation) => (
                            <div
                                key={automation.id}
                                className={`bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 hover:shadow-lg hover:shadow-[#00E0B8]/5 transition-all
                  ${!automation.isActive ? 'opacity-75 grayscale' : ''}
                `}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-2 bg-[#2A3038] rounded-lg text-2xl">
                                        {automation.action === AutomationAction.SEND_EMAIL ? '📧' :
                                            automation.action === AutomationAction.CREATE_NOTIFICATION ? '🔔' : '⚡'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggleStatus(automation)}
                                            className={`
                        w-10 h-6 flex items-center rounded-ull p-1 cursor-pointer transition-colors rounded-full
                        ${automation.isActive ? 'bg-[#00E0B8]' : 'bg-[#2A3038]'}
                      `}
                                            title={automation.isActive ? 'Desativar' : 'Ativar'}
                                        >
                                            <div className={`
                        bg-white w-4 h-4 rounded-full shadow-md transform transition-transform
                        ${automation.isActive ? 'translate-x-4' : 'translate-x-0'}
                      `} />
                                        </button>
                                        <Link href={`/automations/${automation.id}/edit`}>
                                            <button className="p-1 hover:text-[#00E0B8] transition-colors">
                                                ✏️
                                            </button>
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(automation.id)}
                                            className="p-1 hover:text-[#FF4E3D] transition-colors"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-[#D0D6DE] mb-2">{automation.name}</h3>
                                <p className="text-sm text-[#7E8691] mb-4 line-clamp-2 h-10">
                                    {automation.description}
                                </p>

                                <div className="space-y-3">
                                    <div className="flex items-center text-sm">
                                        <span className="w-20 text-[#7E8691]">Se:</span>
                                        <span className="px-2 py-1 bg-[#2A3038] rounded text-[#00E0B8] text-xs font-medium">
                                            {getTriggerLabel(automation.trigger)}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-sm">
                                        <span className="w-20 text-[#7E8691]">Então:</span>
                                        <span className="px-2 py-1 bg-[#2A3038] rounded text-[#3ABFF8] text-xs font-medium">
                                            {getActionLabel(automation.action)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
