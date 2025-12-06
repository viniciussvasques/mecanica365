'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { notificationsApi, Notification } from '@/lib/api/notifications';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default function MechanicNotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadNotifications();
    
    // Polling a cada 30 segundos
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [showUnreadOnly]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const result = await notificationsApi.findAll({
        unreadOnly: showUnreadOnly,
        limit: 100,
      });
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount || 0);
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      await loadNotifications();
    } catch (err) {
      console.error('Erro ao marcar como lida:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      await loadNotifications();
    } catch (err) {
      console.error('Erro ao marcar todas como lidas:', err);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      quote_assigned: '🔧',
      quote_available: '📋',
      diagnosis_completed: '✅',
      quote_approved: '👍',
      service_order_started: '⚙️',
      service_order_completed: '🎉',
    };
    return icons[type] || '🔔';
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Navegar para o orçamento se tiver quoteId
    if (notification.data && 'quoteId' in notification.data) {
      router.push(`/quotes/${notification.data.quoteId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#D0D6DE]">Notificações</h1>
              <p className="text-[#7E8691] mt-2">
                {unreadCount} {unreadCount === 1 ? 'não lida' : 'não lidas'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button variant="outline" onClick={handleMarkAllAsRead}>
                  Marcar todas como lidas
                </Button>
              )}
              <Link href="/mechanic/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
                className="w-4 h-4 rounded border-[#2A3038] bg-[#1A1E23] text-[#00E0B8] focus:ring-[#00E0B8]"
              />
              <span className="text-sm text-[#D0D6DE]">Mostrar apenas não lidas</span>
            </label>
          </div>
        </div>

        {/* Lista de Notificações */}
        {notifications.length === 0 ? (
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold text-[#D0D6DE] mb-2">
              Nenhuma notificação
            </h3>
            <p className="text-[#7E8691]">
              {showUnreadOnly 
                ? 'Você não tem notificações não lidas.'
                : 'Você não tem notificações no momento.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                role="button"
                tabIndex={0}
                onClick={() => handleNotificationClick(notification)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNotificationClick(notification);
                  }
                }}
                className={`bg-[#1A1E23] border rounded-lg p-4 cursor-pointer transition-all ${
                  notification.read 
                    ? 'border-[#2A3038] hover:border-[#3A4048]' 
                    : 'border-[#00E0B8]/50 bg-[#00E0B8]/5 hover:border-[#00E0B8]'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="text-2xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`font-semibold ${notification.read ? 'text-[#D0D6DE]' : 'text-[#00E0B8]'}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-[#00E0B8] rounded-full flex-shrink-0 mt-2 ml-2"></span>
                      )}
                    </div>
                    <p className="text-[#7E8691] text-sm mb-2">{notification.message}</p>
                    <p className="text-[#7E8691] text-xs">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      className="text-[#00E0B8] hover:text-[#3ABFF8] text-sm font-medium flex-shrink-0"
                    >
                      Marcar como lida
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

