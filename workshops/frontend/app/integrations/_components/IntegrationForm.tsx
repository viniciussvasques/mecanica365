'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Integration,
    CreateIntegrationDto,
    integrationsApi,
    IntegrationType
} from '@/lib/api/integrations';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { logger } from '@/lib/utils/logger';
import { getErrorMessage } from '@/lib/utils/errorHandler';

interface IntegrationFormProps {
    initialData?: Integration;
}

export default function IntegrationForm({ initialData }: IntegrationFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<CreateIntegrationDto>({
        name: initialData?.name || '',
        type: initialData?.type || IntegrationType.CUSTOM,
        apiUrl: initialData?.apiUrl || '',
        apiKey: initialData?.apiKey || '',
        config: initialData?.config || {},
        isActive: initialData?.isActive ?? true,
    });

    const handleChange = (field: keyof CreateIntegrationDto, value: any) => {
        setFormData(prev => {
            // Auto-fill API URL for known types if empty
            if (field === 'type' && !prev.apiUrl) {
                if (value === IntegrationType.CEP) return { ...prev, [field]: value, apiUrl: 'https://viacep.com.br/ws/{cep}/json/' };
                if (value === IntegrationType.RENAVAN) return { ...prev, [field]: value, apiUrl: 'https://api.placaapi.com/v1/renavan/{renavan}' };
            }
            return { ...prev, [field]: value };
        });
    };

    const handleConfigChange = (key: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            config: { ...prev.config, [key]: value }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (initialData) {
                await integrationsApi.update(initialData.id, formData);
            } else {
                await integrationsApi.create(formData);
            }
            router.push('/integrations');
            router.refresh();
        } catch (err: any) {
            logger.error('Erro ao salvar integração', err);
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto bg-[#1A1E23] p-8 rounded-lg border border-[#2A3038]">

            {error && (
                <div className="bg-[#FF4E3D]/10 text-[#FF4E3D] p-3 rounded border border-[#FF4E3D]">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <h2 className="text-xl font-bold text-[#D0D6DE]">
                    {initialData ? 'Editar Integração' : 'Nova Integração'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Nome da Integração"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Ex: Consulta CEP Correios"
                        required
                    />

                    <Select
                        label="Tipo de Serviço"
                        value={formData.type}
                        onChange={(e) => handleChange('type', e.target.value)}
                        options={[
                            { value: IntegrationType.CUSTOM, label: 'API Personalizada' },
                            { value: IntegrationType.CEP, label: 'Consulta CEP' },
                            { value: IntegrationType.RENAVAN, label: 'Consulta RENAVAN' },
                            { value: IntegrationType.VIN, label: 'Decodificador VIN' },
                        ]}
                    />
                </div>

                <Input
                    label="URL do Endpoint"
                    value={formData.apiUrl}
                    onChange={(e) => handleChange('apiUrl', e.target.value)}
                    placeholder="https://api.exemplo.com/v1/"
                    required
                />
                <p className="text-xs text-[#7E8691] mt-1">
                    Suporta variáveis dinâmicas como <code>{`{cep}`}</code>, <code>{`{placa}`}</code> ou <code>{`{renavan}`}</code>.
                </p>

                <div className="pt-2">
                    <Input
                        label="API Key / Token (Opcional)"
                        value={formData.apiKey}
                        onChange={(e) => handleChange('apiKey', e.target.value)}
                        placeholder="Bearer token ou chave de API"
                        type="password"
                    />
                </div>

                {/* Configurações Específicas */}
                {formData.type === IntegrationType.CUSTOM && (
                    <div className="bg-[#0F1115] p-4 rounded border border-[#2A3038] mt-4">
                        <h3 className="text-sm font-semibold text-[#00E0B8] mb-3 uppercase tracking-wider">Headers Personalizados</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Header Name"
                                placeholder="X-Custom-Auth"
                                value={formData.config?.headerName as string || ''}
                                onChange={(e) => handleConfigChange('headerName', e.target.value)}
                            />
                            <Input
                                label="Header Value"
                                placeholder="valor-secreto"
                                value={formData.config?.headerValue as string || ''}
                                onChange={(e) => handleConfigChange('headerValue', e.target.value)}
                            />
                        </div>
                    </div>
                )}

            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#2A3038]">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.back()}
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    isLoading={loading}
                >
                    {initialData ? 'Salvar Alterações' : 'Criar Integração'}
                </Button>
            </div>
        </form>
    );
}
