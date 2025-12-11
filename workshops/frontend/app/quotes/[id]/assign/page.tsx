'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { quotesApi, Quote } from '@/lib/api/quotes';
import { usersApi, User } from '@/lib/api/users';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { useNotification } from '@/components/NotificationProvider';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export default function AssignMechanicPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [mechanics, setMechanics] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedMechanicId, setSelectedMechanicId] = useState('');
  const [reason, setReason] = useState('');
  const { showNotification } = useNotification();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [quoteData, mechanicsData] = await Promise.all([
        quotesApi.findOne(id),
        usersApi.findMechanics(),
      ]);
      setQuote(quoteData);
      setMechanics(mechanicsData);
      if (mechanicsData.length > 0) {
        setSelectedMechanicId(mechanicsData[0].id);
      }
    } catch (err: unknown) {
      logger.error('Erro ao carregar dados:', err);
      showNotification('Erro ao carregar dados', 'error');
      router.push(`/quotes/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMechanicId) {
      showNotification('Selecione um mecânico', 'error');
      return;
    }

    try {
      setAssigning(true);
      await quotesApi.assignMechanic(id, selectedMechanicId, reason || undefined);
      showNotification('Mecânico atribuído com sucesso!', 'success');
      router.push(`/quotes/${id}`);
    } catch (err: unknown) {
      logger.error('Erro ao atribuir mecânico:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atribuir mecânico';
      showNotification(errorMessage, 'error');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8]"></div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#FF4E3D]/10 border border-[#FF4E3D] rounded-lg p-6">
            <p className="text-[#FF4E3D]">Orçamento não encontrado</p>
            <Link href="/quotes" className="mt-4 inline-block">
              <Button variant="outline">Voltar para Orçamentos</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/quotes/${id}`} className="text-[#00E0B8] hover:text-[#3ABFF8] mb-4 inline-block">
            ← Voltar para orçamento
          </Link>
          <h1 className="text-3xl font-bold text-[#D0D6DE]">Atribuir Mecânico</h1>
          <p className="text-[#7E8691] mt-2">Orçamento {quote.number}</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleAssign} className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
          <div className="space-y-6">
            <div>
              <p className="text-sm text-[#7E8691] mb-2">Cliente</p>
              <p className="text-[#D0D6DE] font-medium">{quote.customer?.name || 'Não informado'}</p>
            </div>

            <div>
              <p className="text-sm text-[#7E8691] mb-2">Veículo</p>
              <p className="text-[#D0D6DE] font-medium">
                {quote.vehicle 
                  ? `${quote.vehicle.placa || 'Sem placa'} - ${quote.vehicle.make || ''} ${quote.vehicle.model || ''}`.trim() || 'Veículo'
                  : 'Não informado'}
              </p>
            </div>

            <Select
              label="Mecânico *"
              value={selectedMechanicId}
              onChange={(e) => setSelectedMechanicId(e.target.value)}
              options={[
                { value: '', label: 'Selecione um mecânico...' },
                ...mechanics.map((m) => ({
                  value: m.id,
                  label: `${m.name} (${m.email})`,
                })),
              ]}
              required
            />

            <Input
              label="Motivo da Atribuição (Opcional)"
              placeholder="Ex: Mecânico disponível para diagnóstico"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            {quote.assignedMechanic && (
              <div className="bg-[#FFCB2B]/10 border border-[#FFCB2B]/30 rounded-lg p-4">
                <p className="text-sm text-[#FFCB2B]">
                  ⚠️ Este orçamento já está atribuído a <strong>{quote.assignedMechanic.name}</strong>. 
                  A atribuição será alterada.
                </p>
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-[#2A3038]">
            <Link href={`/quotes/${id}`}>
              <Button variant="secondary" type="button">
                Cancelar
              </Button>
            </Link>
            <Button variant="primary" type="submit" isLoading={assigning}>
              Atribuir Mecânico
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

