'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    webhooksApi,
    Webhook,
    availableEvents
} from '@/lib/api/webhooks';
import { Button } from '@/components/ui/Button';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/lib/utils/errorHandler';

export default function WebhooksPage() {
    const router = useRouter();
    const toast = useToast();
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadWebhooks();
    }, []);

    const loadWebhooks = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await webhooksApi.findAll();
            setWebhooks(data);
        } catch (err: unknown) {
            logger.error('Erro ao carregar webhooks:', err);
            setError('Não foi possível carregar os webhooks.');
            toast.error(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (webhook: Webhook) => {
        try {
            // Otimistic UI update
            setWebhooks((prev) =>
                prev.map((w) => w.id === webhook.id ? { ...w, isActive: !w.isActive } : w)
            );

            await webhooksApi.update(webhook.id, {
                isActive: !webhook.isActive
            });
            toast.success(`Webhook ${!webhook.isActive ? 'ativado' : 'desativado'} com sucesso.`);
        } catch (err) {
            logger.error('Erro ao alternar status do webhook:', err);
            // Revert optimistic update
            setWebhooks((prev) =>
                prev.map((w) => w.id === webhook.id ? { ...w, isActive: webhook.isActive } : w)
            );
            toast.error(getErrorMessage(err));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este webhook?')) return;

        try {
            await webhooksApi.remove(id);
            setWebhooks((prev) => prev.filter((w) => w.id !== id));
            toast.success('Webhook removido com sucesso.');
        } catch (err) {
            logger.error('Erro ao excluir webhook:', err);
            toast.error(getErrorMessage(err));
        }
    };

    const formatEventList = (events: string[]) => {
        if (events.length === 0) return 'Nenhum evento';
        if (events.length <= 2) {
            return events.map(e => availableEvents.find(ae => ae.value === e)?.label || e).join(', ');
        }
        return `${events.length} eventos configurados`;
    };

    return (
        <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-[#D0D6DE] mb-2">Webhooks</h1>
                            <p className="text-[#7E8691]">Integre sua oficina com sistemas externos</p>
                        </div>
                        <Link href="/webhooks/new">
                            <Button variant="primary">
                                + Novo Webhook
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
                        <p className="mt-4 text-[#7E8691]">Carregando webhooks...</p>
                    </div>
                ) : webhooks.length === 0 ? (
                    <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-12 text-center">
                        <span className="text-4xl mb-4 block">🔗</span>
                        <h3 className="text-xl font-semibold text-[#D0D6DE] mb-2">Nenhum webhook configurado</h3>
                        <p className="text-[#7E8691] mb-6">Adicione um webhook para receber notificações de eventos.</p>
                        <Link href="/webhooks/new">
                            <Button variant="primary">
                                Criar Webhook Agora
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {webhooks.map((webhook) => (
                            <div
                                key={webhook.id}
                                className={`bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 hover:border-[#00E0B8]/50 transition-colors
                  ${!webhook.isActive ? 'opacity-75 grayscale' : ''}
                `}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-xl">🔗</span>
                                            <h3 className="text-lg font-bold text-[#D0D6DE] font-mono break-all">{webhook.url}</h3>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {webhook.events.map(event => (
                                                <span key={event} className="px-2 py-1 bg-[#2A3038] rounded text-[#00E0B8] text-xs font-mono">
                                                    {availableEvents.find(ae => ae.value === event)?.label || event}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="text-sm text-[#7E8691] flex gap-4">
                                            <span>Criado em: {new Date(webhook.createdAt).toLocaleDateString()}</span>
                                            {webhook.lastTriggeredAt && (
                                                <span>Último disparo: {new Date(webhook.lastTriggeredAt).toLocaleString()}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 ml-4">
                                        <button
                                            onClick={() => handleToggleStatus(webhook)}
                                            className={`
                        w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors
                        ${webhook.isActive ? 'bg-[#00E0B8]' : 'bg-[#2A3038]'}
                      `}
                                            title={webhook.isActive ? 'Desativar' : 'Ativar'}
                                        >
                                            <div className={`
                        bg-white w-4 h-4 rounded-full shadow-md transform transition-transform
                        ${webhook.isActive ? 'translate-x-4' : 'translate-x-0'}
                      `} />
                                        </button>
                                        <Link href={`/webhooks/${webhook.id}/edit`}>
                                            <Button variant="secondary" size="sm">
                                                Editar
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-[#FF4E3D] hover:bg-[#FF4E3D]/10 hover:text-[#FF4E3D]"
                                            onClick={() => handleDelete(webhook.id)}
                                        >
                                            Excluir
                                        </Button>
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
