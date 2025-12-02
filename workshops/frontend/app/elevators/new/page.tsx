'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { elevatorsApi, CreateElevatorDto, ElevatorType, ElevatorStatus } from '@/lib/api/elevators';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export const dynamic = 'force-dynamic';

export default function NewElevatorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<CreateElevatorDto>({
    name: '',
    number: '',
    type: ElevatorType.HYDRAULIC,
    capacity: 3.5,
    status: ElevatorStatus.FREE,
    location: '',
    notes: '',
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!formData.number || formData.number.trim().length === 0) {
      newErrors.number = 'Número é obrigatório';
    }

    if (!formData.capacity || formData.capacity <= 0) {
      newErrors.capacity = 'Capacidade deve ser maior que 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const data: CreateElevatorDto = {
        name: formData.name.trim(),
        number: formData.number.trim(),
        type: formData.type,
        capacity: formData.capacity,
        status: formData.status,
        location: formData.location?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      };

      await elevatorsApi.create(data);
      router.push('/elevators');
    } catch (err: unknown) {
      console.error('Erro ao criar elevador:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar elevador';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-[#D0D6DE]">Novo Elevador</h1>
            <Link href="/elevators">
              <Button variant="outline">Voltar</Button>
            </Link>
          </div>
          <p className="text-[#7E8691]">Cadastre um novo elevador</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
          <div className="space-y-6">
            {/* Nome */}
            <div>
              <Input
                label="Nome *"
                placeholder="Ex: Elevador 1"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                required
              />
            </div>

            {/* Número */}
            <div>
              <Input
                label="Número *"
                placeholder="Ex: ELEV-001"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                error={errors.number}
                required
              />
            </div>

            {/* Tipo e Capacidade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Select
                  label="Tipo *"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ElevatorType })}
                  options={[
                    { value: ElevatorType.HYDRAULIC, label: 'Hidráulico' },
                    { value: ElevatorType.PNEUMATIC, label: 'Pneumático' },
                    { value: ElevatorType.SCISSOR, label: 'Tesoura' },
                  ]}
                  required
                />
              </div>
              <div>
                <Input
                  label="Capacidade (ton) *"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseFloat(e.target.value) || 0 })}
                  error={errors.capacity}
                  required
                />
              </div>
            </div>

            {/* Status e Localização */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Select
                  label="Status *"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ElevatorStatus })}
                  options={[
                    { value: ElevatorStatus.FREE, label: 'Livre' },
                    { value: ElevatorStatus.OCCUPIED, label: 'Ocupado' },
                    { value: ElevatorStatus.MAINTENANCE, label: 'Manutenção' },
                    { value: ElevatorStatus.SCHEDULED, label: 'Agendado' },
                  ]}
                  required
                />
              </div>
              <div>
                <Input
                  label="Localização"
                  placeholder="Ex: Setor A - Box 1"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
                Observações
              </label>
              <textarea
                className="w-full px-4 py-2 bg-[#0F1115] border border-[#2A3038] rounded-lg text-[#D0D6DE] focus:outline-none focus:ring-2 focus:ring-[#00E0B8] focus:border-transparent"
                rows={4}
                placeholder="Observações sobre o elevador..."
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex items-center justify-end space-x-4">
            <Link href="/elevators">
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </Link>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

