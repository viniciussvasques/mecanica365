'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { automationsApi, Automation } from '@/lib/api/automations';
import AutomationForm from '../../_components/AutomationForm';
import { logger } from '@/lib/utils/logger';

import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/lib/utils/errorHandler';

export default function EditAutomationPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const toast = useToast();
    const [automation, setAutomation] = useState<Automation | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAutomation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]);

    const loadAutomation = async () => {
        try {
            setLoading(true);
            const data = await automationsApi.findOne(params.id);
            setAutomation(data);
        } catch (err) {
            logger.error('Erro ao carregar automação', err);
            toast.error(getErrorMessage(err));
            router.push('/automations');
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

    if (!automation) return null;

    return (
        <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6 text-center">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Editar Automação</h1>
                <AutomationForm initialData={automation} />
            </div>
        </div>
    );
}
