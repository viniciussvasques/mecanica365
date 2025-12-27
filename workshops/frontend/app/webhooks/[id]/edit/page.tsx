'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { webhooksApi, Webhook } from '@/lib/api/webhooks';
import WebhookForm from '../../_components/WebhookForm';
import { logger } from '@/lib/utils/logger';

import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/lib/utils/errorHandler';

export default function EditWebhookPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const toast = useToast();
    const [webhook, setWebhook] = useState<Webhook | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadWebhook();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]);

    const loadWebhook = async () => {
        try {
            setLoading(true);
            const data = await webhooksApi.findOne(params.id);
            setWebhook(data);
        } catch (err) {
            logger.error('Erro ao carregar webhook', err);
            toast.error(getErrorMessage(err));
            router.push('/webhooks');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8]"></div>
            </div>
        );
    }

    if (!webhook) return null;

    return (
        <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6 text-center">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Editar Webhook</h1>
                <WebhookForm initialData={webhook} />
            </div>
        </div>
    );
}
