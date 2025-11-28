'use client';

import { useState } from 'react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { GearIcon } from './icons/MechanicIcons';
import api from '@/lib/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(formData.newPassword)) {
      setError('A nova senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('A nova senha deve ser diferente da senha atual.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Sessão expirada. Por favor, faça login novamente.');
        return;
      }

      await api.patch(
        '/auth/change-password',
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(true);
      localStorage.removeItem('isFirstLogin');
      localStorage.removeItem('showPasswordModal');
      const userId = localStorage.getItem('userId');
      if (userId) {
        localStorage.setItem(`passwordChanged_${userId}`, 'true');
      }
      setTimeout(() => {
        setSuccess(false);
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Erro ao alterar senha. Verifique sua senha atual.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading && !success) {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setError('');
      localStorage.removeItem('isFirstLogin');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Alterar Senha" size="md">
      {success ? (
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-[#00E0B8]/20 to-[#00E0B8]/5 mb-4 border-2 border-[#00E0B8]">
            <svg
              className="h-10 w-10 text-[#00E0B8]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#D0D6DE] mb-2 neon-turquoise">Senha alterada com sucesso!</h3>
          <p className="text-[#7E8691]">Sua senha foi atualizada com sucesso.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-[#FF4E3D]/10 border-l-4 border-[#FF4E3D] text-[#FF4E3D] px-4 py-3 rounded-lg">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <Input
              id="currentPassword"
              label="Senha Atual"
              type="password"
              required
              value={formData.currentPassword}
              onChange={(e) =>
                setFormData({ ...formData, currentPassword: e.target.value })
              }
              placeholder="Digite sua senha atual"
              autoComplete="current-password"
            />

            <Input
              id="newPassword"
              label="Nova Senha"
              type="password"
              required
              value={formData.newPassword}
              onChange={(e) =>
                setFormData({ ...formData, newPassword: e.target.value })
              }
              placeholder="Digite sua nova senha"
              autoComplete="new-password"
              helperText="Mínimo de 8 caracteres, com maiúscula, minúscula e número"
            />

            <Input
              id="confirmPassword"
              label="Confirmar Nova Senha"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              placeholder="Confirme sua nova senha"
              autoComplete="new-password"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              disabled={loading}
              className="flex-1"
            >
              Alterar Senha
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
