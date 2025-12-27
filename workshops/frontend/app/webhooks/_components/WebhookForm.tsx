'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Webhook,
    CreateWebhookDto,
    webhooksApi,
    availableEvents
} from '@/lib/api/webhooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { logger } from '@/lib/utils/logger';
import { getErrorMessage } from '@/lib/utils/errorHandler';

interface WebhookFormProps {
    initialData?: Webhook;
}

export default function WebhookForm({ initialData }: WebhookFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<CreateWebhookDto>({
        url: initialData?.url || '',
        secret: initialData?.secret || '',
        events: initialData?.events || [],
        isActive: initialData?.isActive ?? true,
    });

    const handleChange = (field: keyof CreateWebhookDto, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleEventToggle = (eventValue: string) => {
        setFormData(prev => {
            const currentEvents = prev.events || [];
            if (currentEvents.includes(eventValue)) {
                return { ...prev, events: currentEvents.filter(e => e !== eventValue) };
            } else {
                return { ...prev, events: [...currentEvents, eventValue] };
            }
        });
    };

    const handleGenerateSecret = () => {
        const randomSecret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        handleChange('secret', randomSecret);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validação básica
        if (formData.events.length === 0) {
            setError('Selecione pelo menos um evento.');
            setLoading(false);
            return;
        }

        try {
            if (initialData) {
                await webhooksApi.update(initialData.id, formData);
            } else {
                await webhooksApi.create(formData);
            }
            router.push('/webhooks');
            router.refresh();
        } catch (err: any) {
            logger.error('Erro ao salvar webhook', err);
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
                    {initialData ? 'Editar Webhook' : 'Novo Webhook'}
                </h2>

                <Input
                    label="URL do Endpoint"
                    value={formData.url}
                    onChange={(e) => handleChange('url', e.target.value)}
                    placeholder="https://sua-api.com/callback"
                    required
                    type="url"
                />

                <div className="flex gap-2 items-end">
                    <div className="flex-1">
                        <Input
                            label="Segredo (Secret Key)"
                            value={formData.secret}
                            onChange={(e) => handleChange('secret', e.target.value)}
                            placeholder="Chave para validar assinatura HMAC"
                            required
                        />
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleGenerateSecret}
                        className="mb-[2px]"
                    >
                        Gerar
                    </Button>
                </div>
                <p className="text-xs text-[#7E8691]">
                    Use este segredo para validar o header <code>X-Webhook-Signature</code> nas requisições.
                </p>

                <div className="pt-2">
                    <label className="block text-sm font-medium text-[#D0D6DE] mb-2">Eventos Assinados</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#0F1115] p-4 rounded border border-[#2A3038]">
                        {availableEvents.map((event) => (
                            <label key={event.value} className="flex items-center space-x-3 cursor-pointer group">
                                <div className={`
                    w-5 h-5 rounded border flex items-center justify-center transition-colors
                    ${formData.events.includes(event.value)
                                        ? 'bg-[#00E0B8] border-[#00E0B8]'
                                        : 'border-[#7E8691] group-hover:border-[#00E0B8]'}
                  `}>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={formData.events.includes(event.value)}
                                        onChange={() => handleEventToggle(event.value)}
                                    />
                                    {formData.events.includes(event.value) && (
                                        <svg className="w-3 h-3 text-[#0F1115]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <span className="text-sm text-[#D0D6DE] group-hover:text-white transition-colors">
                                    {event.label}
                                </span>
                            </label>
                        ))}
                    </div>
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
                    {initialData ? 'Salvar Alterações' : 'Criar Webhook'}
                </Button>
            </div>
        </form>
    );
}
