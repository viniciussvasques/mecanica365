'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Automation,
    CreateAutomationDto,
    automationsApi,
    AutomationTrigger,
    AutomationAction
} from '@/lib/api/automations';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { logger } from '@/lib/utils/logger';
import { getErrorMessage } from '@/lib/utils/errorHandler';

interface AutomationFormProps {
    initialData?: Automation;
}

export default function AutomationForm({ initialData }: AutomationFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<CreateAutomationDto>({
        name: initialData?.name || '',
        description: initialData?.description || '',
        trigger: initialData?.trigger || AutomationTrigger.QUOTE_APPROVED,
        action: initialData?.action || AutomationAction.SEND_EMAIL,
        conditions: initialData?.conditions || {},
        actionConfig: initialData?.actionConfig || {},
        isActive: initialData?.isActive ?? true,
    });

    const handleChange = (field: keyof CreateAutomationDto, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleActionConfigChange = (key: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            actionConfig: { ...prev.actionConfig, [key]: value }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (initialData) {
                await automationsApi.update(initialData.id, formData);
            } else {
                await automationsApi.create(formData);
            }
            router.push('/automations');
            router.refresh();
        } catch (err: any) {
            logger.error('Erro ao salvar automação', err);
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
                    {initialData ? 'Editar Automação' : 'Nova Automação'}
                </h2>

                <Input
                    label="Nome da Regra"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Ex: Enviar email ao aprovar orçamento"
                    required
                />

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[#D0D6DE]">Descrição</label>
                    <textarea
                        className="w-full bg-[#0F1115] border border-[#2A3038] rounded-md p-2 text-[#D0D6DE] focus:ring-1 focus:ring-[#00E0B8] outline-none"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Descreva o que esta automação faz..."
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Quando (Gatilho)"
                        value={formData.trigger}
                        onChange={(e) => handleChange('trigger', e.target.value)}
                        options={[
                            { value: AutomationTrigger.QUOTE_APPROVED, label: 'Orçamento Aprovado' },
                            { value: AutomationTrigger.SERVICE_ORDER_COMPLETED, label: 'OS Concluída' },
                            { value: AutomationTrigger.INVOICE_ISSUED, label: 'Fatura Emitida' },
                            { value: AutomationTrigger.STOCK_LOW, label: 'Estoque Baixo' },
                        ]}
                    />

                    <Select
                        label="Então Fazer (Ação)"
                        value={formData.action}
                        onChange={(e) => handleChange('action', e.target.value)}
                        options={[
                            { value: AutomationAction.SEND_EMAIL, label: 'Enviar E-mail' },
                            { value: AutomationAction.SEND_SMS, label: 'Enviar SMS' },
                            { value: AutomationAction.CREATE_NOTIFICATION, label: 'Criar Notificação no Sistema' },
                        ]}
                    />
                </div>

                {/* Configuração Dinâmica da Ação */}
                <div className="bg-[#0F1115] p-4 rounded border border-[#2A3038] mt-4">
                    <h3 className="text-sm font-semibold text-[#00E0B8] mb-3 uppercase tracking-wider">Configuração da Ação</h3>

                    {formData.action === AutomationAction.SEND_EMAIL && (
                        <div className="space-y-3">
                            <Input
                                label="Assunto do E-mail"
                                value={formData.actionConfig.subject as string || ''}
                                onChange={(e) => handleActionConfigChange('subject', e.target.value)}
                                placeholder="Ex: Seu orçamento foi aprovado!"
                            />
                            <Input
                                label="Template ID (Opcional)"
                                value={formData.actionConfig.templateId as string || ''}
                                onChange={(e) => handleActionConfigChange('templateId', e.target.value)}
                                placeholder="ID do template de email"
                            />
                        </div>
                    )}

                    {formData.action === AutomationAction.CREATE_NOTIFICATION && (
                        <Input
                            label="Mensagem da Notificação"
                            value={formData.actionConfig.message as string || ''}
                            onChange={(e) => handleActionConfigChange('message', e.target.value)}
                            placeholder="Ex: Novo orçamento aprovado, verifique o estoque."
                        />
                    )}
                </div>

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
                    {initialData ? 'Salvar Alterações' : 'Criar Automação'}
                </Button>
            </div>
        </form>
    );
}
