'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    integrationsApi,
    Integration,
    IntegrationType,
    IntegrationStatus
} from '@/lib/api/integrations';
import { Button } from '@/components/ui/Button';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/lib/utils/errorHandler';

export default function IntegrationsPage() {
    const router = useRouter();
    const toast = useToast();
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadIntegrations();
    }, []);

    const loadIntegrations = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await integrationsApi.findAll();
            setIntegrations(data);
        } catch (err: unknown) {
            logger.error('Erro ao carregar integrações:', err);
            setError('Não foi possível carregar as integrações.');
            toast.error(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (integration: Integration) => {
        try {
            // Otimistic UI update
            setIntegrations((prev) =>
                prev.map((i) => i.id === integration.id ? { ...i, isActive: !i.isActive } : i)
            );

            await integrationsApi.update(integration.id, {
                isActive: !integration.isActive
            });
            toast.success(`Integração ${!integration.isActive ? 'ativada' : 'desativada'} com sucesso.`);
        } catch (err) {
            logger.error('Erro ao alternar status da integração:', err);
            // Revert optimistic update
            setIntegrations((prev) =>
                prev.map((i) => i.id === integration.id ? { ...i, isActive: integration.isActive } : i)
            );
            toast.error(getErrorMessage(err));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover esta integração?')) return;

        try {
            await integrationsApi.remove(id);
            setIntegrations((prev) => prev.filter((i) => i.id !== id));
            toast.success('Integração removida com sucesso.');
        } catch (err) {
            logger.error('Erro ao excluir integração:', err);
            toast.error(getErrorMessage(err));
        }
    };

    const handleTest = async (id: string) => {
        toast.info('Testando conexão...');
        try {
            const result = await integrationsApi.test(id);
            if (result.success) {
                toast.success('Conexão estabelecida com sucesso!');
            } else {
                toast.error(`Falha no teste: ${result.message}`);
            }
        } catch (err: any) {
            logger.error('Erro ao testar integração:', err);
            toast.error(getErrorMessage(err));
        }
    };

    const getIntegrationIcon = (type: IntegrationType) => {
        switch (type) {
            case IntegrationType.RENAVAN: return '🚗';
            case IntegrationType.VIN: return '🔢';
            case IntegrationType.CEP: return '📍';
            default: return '🔌';
        }
    };

    const getTypeLabel = (type: IntegrationType) => {
        switch (type) {
            case IntegrationType.RENAVAN: return 'Consulta RENAVAN';
            case IntegrationType.VIN: return 'Decodificador VIN';
            case IntegrationType.CEP: return 'Consulta CEP';
            case IntegrationType.CUSTOM: return 'API Personalizada';
            default: return type;
        }
    };

    return (
        <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-[#D0D6DE] mb-2">Integrações</h1>
                            <p className="text-[#7E8691]">Conecte sua oficina a serviços externos</p>
                        </div>
                        <Link href="/integrations/new">
                            <Button variant="primary">
                                + Nova Integração
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
                        <p className="mt-4 text-[#7E8691]">Carregando integrações...</p>
                    </div>
                ) : integrations.length === 0 ? (
                    <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-12 text-center">
                        <span className="text-4xl mb-4 block">🧩</span>
                        <h3 className="text-xl font-semibold text-[#D0D6DE] mb-2">Nenhuma integração configurada</h3>
                        <p className="text-[#7E8691] mb-6">Adicione uma integração para automatizar consultas de dados.</p>
                        <Link href="/integrations/new">
                            <Button variant="primary">
                                Criar Integração Agora
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {integrations.map((integration) => (
                            <div
                                key={integration.id}
                                className={`bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 hover:shadow-lg hover:shadow-[#00E0B8]/5 transition-all
                  ${!integration.isActive ? 'opacity-75 grayscale' : ''}
                `}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-[#2A3038] rounded-lg text-3xl">
                                        {getIntegrationIcon(integration.type)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggleStatus(integration)}
                                            className={`
                        w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors
                        ${integration.isActive ? 'bg-[#00E0B8]' : 'bg-[#2A3038]'}
                      `}
                                            title={integration.isActive ? 'Desativar' : 'Ativar'}
                                        >
                                            <div className={`
                        bg-white w-4 h-4 rounded-full shadow-md transform transition-transform
                        ${integration.isActive ? 'translate-x-4' : 'translate-x-0'}
                      `} />
                                        </button>
                                        <Link href={`/integrations/${integration.id}/edit`}>
                                            <button className="p-1 hover:text-[#00E0B8] transition-colors">
                                                ✏️
                                            </button>
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(integration.id)}
                                            className="p-1 hover:text-[#FF4E3D] transition-colors"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-[#D0D6DE] mb-1">{integration.name}</h3>
                                <p className="text-xs font-mono text-[#00E0B8] mb-3 bg-[#00E0B8]/10 inline-block px-2 py-1 rounded">
                                    {getTypeLabel(integration.type)}
                                </p>

                                <p className="text-sm text-[#7E8691] mb-4 font-mono truncate bg-[#0F1115] p-2 rounded border border-[#2A3038]/50">
                                    {integration.apiUrl}
                                </p>

                                <div className="pt-4 border-t border-[#2A3038] flex justify-between items-center">
                                    <span className={`text-xs px-2 py-1 rounded-full ${integration.status === IntegrationStatus.ACTIVE ? 'bg-green-500/10 text-green-500' :
                                        integration.status === IntegrationStatus.ERROR ? 'bg-red-500/10 text-red-500' :
                                            'bg-gray-500/10 text-gray-500'
                                        }`}>
                                        {integration.status === IntegrationStatus.ACTIVE ? '● Operacional' :
                                            integration.status === IntegrationStatus.ERROR ? '● Erro' : '● Inativo'}
                                    </span>

                                    <Button variant="ghost" size="sm" onClick={() => handleTest(integration.id)}>
                                        Testar Conexão
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
