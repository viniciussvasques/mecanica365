'use client';

import { useState } from 'react';
import { Button } from './ui/Button';
import { useNotification } from './NotificationProvider';

interface SendQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteId: string;
  quoteNumber: string;
  publicToken?: string;
  customerEmail?: string;
  customerPhone?: string;
  onSend: (method: 'email' | 'whatsapp' | 'sms' | 'link') => Promise<void>;
  onRegenerateToken?: () => Promise<void>;
}

export function SendQuoteModal({
  isOpen,
  onClose,
  quoteId,
  quoteNumber,
  publicToken,
  customerEmail,
  customerPhone,
  onSend,
  onRegenerateToken,
}: SendQuoteModalProps) {
  const { showNotification } = useNotification();
  const [sending, setSending] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (method: 'email' | 'whatsapp' | 'sms' | 'link') => {
    try {
      setSending(method);
      await onSend(method);
      showNotification(`Orçamento enviado por ${method === 'email' ? 'Email' : method === 'whatsapp' ? 'WhatsApp' : method === 'sms' ? 'SMS' : 'Link'} com sucesso!`, 'success');
      onClose();
    } catch (err) {
      console.error(`Erro ao enviar por ${method}:`, err);
      const errorMessage = err instanceof Error ? err.message : `Erro ao enviar por ${method}`;
      showNotification(errorMessage, 'error');
    } finally {
      setSending(null);
    }
  };

  const handleCopyLink = () => {
    if (!publicToken) {
      showNotification('Token público não disponível. O orçamento precisa ser enviado primeiro.', 'error');
      return;
    }
    const link = `${window.location.origin}/quotes/view?token=${publicToken}`;
    navigator.clipboard.writeText(link);
    showNotification('Link copiado para a área de transferência!', 'success');
  };

  const getPublicLink = () => {
    if (!publicToken) return null;
    return `${window.location.origin}/quotes/view?token=${publicToken}`;
  };

  const handleRegenerateToken = async () => {
    if (!onRegenerateToken) return;
    
    try {
      setRegenerating(true);
      await onRegenerateToken();
      showNotification('Link regenerado com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao regenerar token:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao regenerar link';
      showNotification(errorMessage, 'error');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#D0D6DE]">Enviar Orçamento</h2>
          <button
            onClick={onClose}
            className="text-[#7E8691] hover:text-[#D0D6DE] text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-[#7E8691] mb-4 flex-shrink-0">
          Escolha como deseja enviar o orçamento <strong className="text-[#D0D6DE]">{quoteNumber}</strong> ao cliente:
        </p>

        <div className="space-y-2.5 flex-1 overflow-y-auto min-h-0">
          {/* Email */}
          <Button
            variant="primary"
            onClick={() => handleSend('email')}
            disabled={!customerEmail || !!sending}
            className="w-full justify-start gap-3 py-3 text-base"
          >
            <span className="text-xl">📧</span>
            <div className="flex-1 text-left">
              <div className="font-semibold text-sm">Enviar por Email</div>
              {customerEmail ? (
                <div className="text-xs opacity-80 mt-0.5">{customerEmail}</div>
              ) : (
                <div className="text-xs opacity-60 mt-0.5">Email não cadastrado</div>
              )}
            </div>
            {sending === 'email' && <span className="animate-spin text-lg">⏳</span>}
          </Button>

          {/* WhatsApp */}
          <Button
            variant="primary"
            onClick={() => handleSend('whatsapp')}
            disabled={!customerPhone || !!sending}
            className="w-full justify-start gap-3 py-3 text-base bg-[#25D366] hover:bg-[#25D366]/90"
          >
            <span className="text-xl">💬</span>
            <div className="flex-1 text-left">
              <div className="font-semibold text-sm">Enviar por WhatsApp</div>
              {customerPhone ? (
                <div className="text-xs opacity-80 mt-0.5">{customerPhone}</div>
              ) : (
                <div className="text-xs opacity-60 mt-0.5">Telefone não cadastrado</div>
              )}
            </div>
            {sending === 'whatsapp' && <span className="animate-spin text-lg">⏳</span>}
          </Button>

          {/* SMS */}
          <Button
            variant="primary"
            onClick={() => handleSend('sms')}
            disabled={!customerPhone || !!sending}
            className="w-full justify-start gap-3 py-3 text-base"
          >
            <span className="text-xl">📱</span>
            <div className="flex-1 text-left">
              <div className="font-semibold text-sm">Enviar por SMS</div>
              {customerPhone ? (
                <div className="text-xs opacity-80 mt-0.5">{customerPhone}</div>
              ) : (
                <div className="text-xs opacity-60 mt-0.5">Telefone não cadastrado</div>
              )}
            </div>
            {sending === 'sms' && <span className="animate-spin text-lg">⏳</span>}
          </Button>

          {/* Link */}
          <div className="space-y-2 pt-2 border-t border-[#2A3038]">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCopyLink}
                disabled={!publicToken || !!sending}
                className="flex-1 justify-start gap-2 py-2.5 text-sm"
              >
                <span className="text-lg">🔗</span>
                <span className="font-medium">Copiar Link</span>
              </Button>
              {onRegenerateToken && (
                <Button
                  variant="outline"
                  onClick={handleRegenerateToken}
                  disabled={regenerating || !!sending}
                  className="px-4 py-2.5 text-sm"
                  title="Gerar novo link"
                >
                  {regenerating ? '⏳' : '🔄'}
                </Button>
              )}
            </div>
            {publicToken && (
              <div className="bg-[#0F1115] border border-[#2A3038] rounded p-2.5">
                <p className="text-xs text-[#7E8691] mb-1">Link público:</p>
                <p className="text-xs text-[#D0D6DE] break-all font-mono leading-relaxed">
                  {getPublicLink()}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#2A3038] flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full py-2.5"
            disabled={!!sending}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

