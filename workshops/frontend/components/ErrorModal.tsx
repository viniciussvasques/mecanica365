import React from 'react';
import { Modal } from './ui/Modal';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: string;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  error,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⚠️ Erro ao processar"
      size="xl"
    >
      <div className="space-y-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-base text-gray-900 whitespace-pre-wrap break-words leading-relaxed">
                {error}
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold transition-colors shadow-md hover:shadow-lg"
          >
            Entendi
          </button>
        </div>
      </div>
    </Modal>
  );
};

