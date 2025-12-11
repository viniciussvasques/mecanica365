'use client';

import { useState } from 'react';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { SignaturePad } from './SignaturePad';
import { logger } from '@/lib/utils/logger';

interface ManualApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteNumber: string;
  onConfirm: (customerSignature?: string, notes?: string) => Promise<void>;
}

export function ManualApproveModal({
  isOpen,
  onClose,
  quoteNumber,
  onConfirm,
}: ManualApproveModalProps) {
  const [signature, setSignature] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [confirming, setConfirming] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      await onConfirm(signature || undefined, notes || undefined);
    } catch (err: unknown) {
      logger.error('Erro ao aprovar manualmente:', err);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#D0D6DE]">Aprovar Orçamento Manualmente</h2>
          <button
            onClick={onClose}
            className="text-[#7E8691] hover:text-[#D0D6DE] text-2xl"
          >
            ×
          </button>
        </div>

        <p className="text-[#7E8691] mb-6 flex-shrink-0">
          O cliente assinou fisicamente o orçamento <strong className="text-[#D0D6DE]">{quoteNumber}</strong>.
          Preencha os dados abaixo para criar a Ordem de Serviço.
        </p>

        <div className="flex-1 overflow-y-auto min-h-0">
        {/* Assinatura Escaneada (Opcional) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
            Assinatura Escaneada (Opcional)
          </label>
          <p className="text-xs text-[#7E8691] mb-3">
            Se você escaneou a assinatura física, pode fazer upload aqui. Caso contrário, deixe em branco.
          </p>
          <SignaturePad
            onSignatureChange={setSignature}
            initialSignature={signature}
          />
        </div>

        {/* Observações */}
        <div className="mb-6">
          <Textarea
            label="Observações (Opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Cliente assinou em 15/01/2025, assinatura física confirmada, etc."
            rows={3}
          />
        </div>

        <div className="bg-[#0F1115] border border-[#2A3038] rounded-lg p-4 mb-6">
          <p className="text-sm text-[#7E8691]">
            <strong className="text-[#D0D6DE]">Atenção:</strong> Ao confirmar, uma Ordem de Serviço será criada automaticamente
            e o status do orçamento será atualizado para "Aprovado Manualmente".
          </p>
        </div>
        </div>

        <div className="flex gap-3 flex-shrink-0 mt-auto pt-4 border-t border-[#2A3038]">
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={confirming}
            className="flex-1 bg-[#3ABFF8] hover:bg-[#3ABFF8]/90"
          >
            {confirming ? 'Criando OS...' : '✅ Confirmar e Criar OS'}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={confirming}
            className="flex-1"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

