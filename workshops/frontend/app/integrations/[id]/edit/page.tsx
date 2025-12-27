'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { integrationsApi, Integration } from '@/lib/api/integrations';
import IntegrationForm from '../../_components/IntegrationForm';
import { logger } from '@/lib/utils/logger';

import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/lib/utils/errorHandler';

export default function EditIntegrationPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const toast = useToast();
    const [integration, setIntegration] = useState<Integration | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadIntegration();
    }, [params.id]);

    const loadIntegration = async () => {
        try {
            setLoading(true);
            const data = await integrationsApi.findOne(params.id);
            setIntegration(data);
        } catch (err) {
            logger.error('Erro ao carregar integração', err);
            toast.error(getErrorMessage(err));
            router.push('/integrations');
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

    if (!integration) return null;

    return (
        <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6 text-center">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Editar Integração</h1>
                <IntegrationForm initialData={integration} />
            </div>
        </div>
    );
}
