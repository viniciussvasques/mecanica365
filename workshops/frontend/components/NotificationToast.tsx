'use client';

import { useEffect } from 'react';

interface NotificationToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: () => void;
}

export function NotificationToast({
  message,
  type = 'info',
  duration = 5000,
  onClose,
}: NotificationToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeConfig = {
    success: {
      bg: 'bg-[#00E0B8]',
      text: 'text-[#0F1115]',
      icon: '✓',
    },
    error: {
      bg: 'bg-[#FF4E3D]',
      text: 'text-white',
      icon: '✕',
    },
    warning: {
      bg: 'bg-[#3ABFF8]',
      text: 'text-white',
      icon: '⚠',
    },
    info: {
      bg: 'bg-[#3ABFF8]',
      text: 'text-white',
      icon: 'ℹ',
    },
  };

  const config = typeConfig[type];

  return (
    <div
      className={`fixed top-4 right-4 ${config.bg} ${config.text} px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3 min-w-[300px] max-w-[500px] animate-slide-in`}
    >
      <span className="text-xl font-bold">{config.icon}</span>
      <p className="flex-1 font-medium">{message}</p>
      <button
        onClick={onClose}
        className="text-current opacity-70 hover:opacity-100 transition-opacity"
      >
        ×
      </button>
    </div>
  );
}

