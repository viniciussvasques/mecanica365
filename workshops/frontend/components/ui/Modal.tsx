import React from 'react';
import { GearIcon } from '../icons/MechanicIcons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'lg',
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'sm:max-w-lg',
    md: 'sm:max-w-3xl',
    lg: 'sm:max-w-5xl',
    xl: 'sm:max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Overlay - Transparente conforme preferência do usuário */}
      <div
        className="fixed inset-0 bg-[#0F1115]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-[95vw] ${sizeClasses[size]} bg-[#1A1E23] border border-[#2A3038] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col animate-scale-in`}
      >
        <div className="hud-line"></div>
        <div className="flex items-center justify-between px-6 sm:px-8 py-4 sm:py-5 border-b border-[#2A3038] flex-shrink-0">
          <div className="flex items-center space-x-3">
            <GearIcon className="text-[#00E0B8]" size={20} />
            <h3 className="text-lg sm:text-xl font-bold text-[#D0D6DE]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#7E8691] hover:text-[#00E0B8] focus:outline-none transition-colors p-2 hover:bg-[#2A3038] rounded-lg"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 sm:px-8 py-5 sm:py-6 flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto custom-scrollbar space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
};
