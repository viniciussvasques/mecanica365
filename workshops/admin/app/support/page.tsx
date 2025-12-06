'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useNotification } from '@/components/NotificationProvider';
import { supportApi, SupportTicket, SupportStats, SupportTicketFilters } from '@/lib/api/support';


export default function SupportPage() {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filters, setFilters] = useState<SupportTicketFilters>({
    status: '',
    priority: '',
    category: '',
    assignedToId: '',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyInternal, setReplyInternal] = useState(false);

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await supportApi.getTickets({
        ...filters,
        page: currentPage,
        limit: 20,
      });
      setTickets(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Erro ao carregar tickets:', error);
      showNotification('Erro ao carregar tickets', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, showNotification]);

  const loadStats = useCallback(async () => {
    try {
      const data = await supportApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  }, []);

  useEffect(() => {
    loadTickets();
    loadStats();
  }, [loadTickets, loadStats]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      await supportApi.updateTicket(ticketId, { status });
      showNotification('Ticket atualizado com sucesso', 'success');
      loadTickets();
      loadStats();
    } catch (error) {
      console.error('Erro ao atualizar ticket:', error);
      showNotification('Erro ao atualizar ticket', 'error');
    }
  };

  const sendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      await supportApi.addReply(selectedTicket.id, {
        message: replyMessage,
        isInternal: replyInternal,
      });

      showNotification('Resposta enviada com sucesso', 'success');
      setReplyMessage('');
      setReplyInternal(false);
      setShowReplyModal(false);
      loadTickets();
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      showNotification('Erro ao enviar resposta', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      open: 'bg-red-100 text-red-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      waiting_for_user: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      open: 'Aberto',
      in_progress: 'Em Andamento',
      waiting_for_user: 'Aguardando Usuário',
      resolved: 'Resolvido',
      closed: 'Fechado',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    const labels = {
      low: 'Baixa',
      normal: 'Normal',
      high: 'Alta',
      urgent: 'Urgente',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority as keyof typeof styles]}`}>
        {labels[priority as keyof typeof labels]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto mb-4"></div>
          <p className="text-[#7E8691]">Carregando tickets de suporte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Suporte - Tickets</h1>
          <p className="text-[#7E8691]">Gerencie todos os tickets de suporte da plataforma</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6">
              <p className="text-[#7E8691] text-sm mb-1">Total</p>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6">
              <p className="text-[#7E8691] text-sm mb-1">Abertos</p>
              <p className="text-3xl font-bold text-red-400">{stats.open}</p>
            </div>
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6">
              <p className="text-[#7E8691] text-sm mb-1">Em Andamento</p>
              <p className="text-3xl font-bold text-yellow-400">{stats.inProgress}</p>
            </div>
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6">
              <p className="text-[#7E8691] text-sm mb-1">Resolvidos</p>
              <p className="text-3xl font-bold text-green-400">{stats.resolved}</p>
            </div>
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6">
              <p className="text-[#7E8691] text-sm mb-1">Tempo Médio</p>
              <p className="text-3xl font-bold text-blue-400">{stats.avgResponseTime}h</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Input
              label="Buscar"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Assunto ou mensagem..."
            />
            <div>
              <label className="block text-sm font-medium text-[#D0D6DE] mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full bg-[#0F1115] border border-[#2A3038] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00E0B8]"
              >
                <option value="">Todos</option>
                <option value="open">Aberto</option>
                <option value="in_progress">Em Andamento</option>
                <option value="waiting_for_user">Aguardando Usuário</option>
                <option value="resolved">Resolvido</option>
                <option value="closed">Fechado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#D0D6DE] mb-2">Prioridade</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full bg-[#0F1115] border border-[#2A3038] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00E0B8]"
              >
                <option value="">Todas</option>
                <option value="low">Baixa</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#D0D6DE] mb-2">Categoria</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full bg-[#0F1115] border border-[#2A3038] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00E0B8]"
              >
                <option value="">Todas</option>
                <option value="technical">Técnico</option>
                <option value="billing">Financeiro</option>
                <option value="account">Conta</option>
                <option value="feature_request">Sugestão</option>
                <option value="general">Geral</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#D0D6DE] mb-2">Responsável</label>
              <Input
                value={filters.assignedToId}
                onChange={(e) => handleFilterChange('assignedToId', e.target.value)}
                placeholder="ID do responsável..."
              />
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2A3038]">
                  <th className="text-left p-4 text-[#7E8691] font-medium">Ticket</th>
                  <th className="text-left p-4 text-[#7E8691] font-medium">Usuário</th>
                  <th className="text-left p-4 text-[#7E8691] font-medium">Status</th>
                  <th className="text-left p-4 text-[#7E8691] font-medium">Prioridade</th>
                  <th className="text-left p-4 text-[#7E8691] font-medium">Categoria</th>
                  <th className="text-left p-4 text-[#7E8691] font-medium">Criado</th>
                  <th className="text-left p-4 text-[#7E8691] font-medium">Última Resposta</th>
                  <th className="text-right p-4 text-[#7E8691] font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-[#2A3038] hover:bg-[#2A3038]/30">
                    <td className="p-4">
                      <div>
                        <p className="text-white font-medium">{ticket.subject}</p>
                        <p className="text-[#7E8691] text-sm truncate max-w-xs">{ticket.message}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-white">{ticket.userName || 'Anônimo'}</p>
                        <p className="text-[#7E8691] text-sm">{ticket.userEmail}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="p-4">
                      {getPriorityBadge(ticket.priority)}
                    </td>
                    <td className="p-4">
                      <span className="text-[#7E8691] capitalize">{ticket.category}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-[#7E8691] text-sm">{formatDate(ticket.createdAt)}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-[#7E8691] text-sm">
                        {ticket.lastReplyAt ? formatDate(ticket.lastReplyAt) : 'Nunca'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedTicket(ticket)}
                          className="p-2 text-[#7E8691] hover:text-white hover:bg-[#2A3038] rounded-lg transition-colors"
                          title="Ver detalhes"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowReplyModal(true);
                          }}
                          className="p-2 text-[#7E8691] hover:text-white hover:bg-[#2A3038] rounded-lg transition-colors"
                          title="Responder"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                        </button>
                        {ticket.status === 'open' && (
                          <button
                            onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                            className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-[#2A3038] rounded-lg transition-colors"
                            title="Marcar como Em Andamento"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l.707.707A1 1 0 0012.414 11H13m-4 4h.01M15 10a1 1 0 100-2 1 1 0 000 2z" />
                            </svg>
                          </button>
                        )}
                        {ticket.status === 'in_progress' && (
                          <button
                            onClick={() => updateTicketStatus(ticket.id, 'resolved')}
                            className="p-2 text-green-400 hover:text-green-300 hover:bg-[#2A3038] rounded-lg transition-colors"
                            title="Marcar como Resolvido"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {tickets.length === 0 && (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-[#2A3038] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-[#7E8691]">Nenhum ticket encontrado</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-[#2A3038] flex items-center justify-between">
              <p className="text-[#7E8691] text-sm">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Reply Modal */}
        {showReplyModal && selectedTicket && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl w-full max-w-2xl">
              <div className="flex items-center justify-between p-6 border-b border-[#2A3038]">
                <h3 className="text-xl font-semibold text-white">Responder Ticket</h3>
                <button
                  onClick={() => {
                    setShowReplyModal(false);
                    setReplyMessage('');
                    setReplyInternal(false);
                  }}
                  className="text-[#7E8691] hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="text-white font-medium mb-2">{selectedTicket.subject}</h4>
                  <p className="text-[#7E8691] text-sm mb-4">{selectedTicket.message}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#D0D6DE] mb-2">Sua Resposta</label>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="w-full bg-[#0F1115] border border-[#2A3038] rounded-lg px-4 py-3 text-white placeholder-[#7E8691] focus:outline-none focus:border-[#00E0B8] resize-none"
                    rows={6}
                    placeholder="Digite sua resposta..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="internal"
                    checked={replyInternal}
                    onChange={(e) => setReplyInternal(e.target.checked)}
                    className="w-4 h-4 rounded border-[#3A4048] bg-[#1A1E23] text-[#00E0B8] focus:ring-[#00E0B8]"
                  />
                  <label htmlFor="internal" className="text-sm text-[#7E8691]">
                    Resposta interna (visível apenas para administradores)
                  </label>
                </div>
              </div>
              <div className="p-6 border-t border-[#2A3038] flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowReplyModal(false);
                    setReplyMessage('');
                    setReplyInternal(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={sendReply}
                  disabled={!replyMessage.trim()}
                >
                  Enviar Resposta
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
