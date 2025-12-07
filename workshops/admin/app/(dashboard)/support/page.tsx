'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  supportApi,
  SupportTicket,
  SupportStats,
  SupportTicketFilters,
} from '@/lib/api/support';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
}

const Button = ({ variant = 'primary', className = '', ...props }: ButtonProps) => {
  const base =
    'px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00E0B8] focus:ring-offset-[#0F1115] disabled:opacity-50';
  const variants: Record<string, string> = {
    primary:
      'bg-gradient-to-r from-[#00E0B8] to-[#3ABFF8] text-[#0F1115] hover:opacity-90',
    outline:
      'border border-[#2A3038] text-white hover:border-[#00E0B8] hover:text-[#00E0B8]',
  };

  return <button className={`${base} ${variants[variant || 'primary']} ${className}`} {...props} />;
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = ({ label, error, className = '', ...props }: InputProps) => (
  <div className="space-y-2">
    {label && <label className="text-sm font-medium text-[#D0D6DE]">{label}</label>}
    <input
      className={`w-full bg-[#0F1115] border border-[#2A3038] rounded-lg px-4 py-2 text-white placeholder-[#7E8691] focus:outline-none focus:border-[#00E0B8] ${className}`}
      {...props}
    />
    {error && <p className="text-sm text-red-400">{error}</p>}
  </div>
);

const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  if (typeof window !== 'undefined') {
    window.alert(message);
  }
  if (type === 'error') {
    console.error(message);
  } else {
    console.log(message);
  }
};


export default function SupportPage() {
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
  }, [currentPage, filters]);

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
    const styles: Record<string, string> = {
      open: 'bg-red-500/20 text-red-400 border border-red-500/30',
      in_progress: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      waiting_for_user: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      resolved: 'bg-green-500/20 text-green-400 border border-green-500/30',
      closed: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
    };
    const labels: Record<string, string> = {
      open: 'Aberto',
      in_progress: 'Em Andamento',
      waiting_for_user: 'Aguardando Usuário',
      resolved: 'Resolvido',
      closed: 'Fechado',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.open}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      low: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
      normal: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      high: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      urgent: 'bg-red-500/20 text-red-400 border border-red-500/30',
    };
    const labels: Record<string, string> = {
      low: 'Baixa',
      normal: 'Normal',
      high: 'Alta',
      urgent: 'Urgente',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority] || styles.normal}`}>
        {labels[priority] || priority}
      </span>
    );
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      technical: 'Técnico',
      billing: 'Financeiro',
      account: 'Conta',
      feature_request: 'Sugestão',
      general: 'Geral',
    };
    return labels[category] || category;
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto mb-4"></div>
          <p className="text-[#7E8691]">Carregando tickets de suporte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Suporte - Tickets</h1>
        <p className="text-[#7E8691]">Gerencie todos os tickets de suporte da plataforma</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-5">
            <p className="text-[#7E8691] text-sm mb-1">Total</p>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-5">
            <p className="text-[#7E8691] text-sm mb-1">Abertos</p>
            <p className="text-3xl font-bold text-red-400">{stats.open}</p>
          </div>
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-5">
            <p className="text-[#7E8691] text-sm mb-1">Em Andamento</p>
            <p className="text-3xl font-bold text-yellow-400">{stats.inProgress}</p>
          </div>
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-5">
            <p className="text-[#7E8691] text-sm mb-1">Resolvidos</p>
            <p className="text-3xl font-bold text-green-400">{stats.resolved}</p>
          </div>
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-5">
            <p className="text-[#7E8691] text-sm mb-1">Tempo Médio</p>
            <p className="text-3xl font-bold text-blue-400">{stats.avgResponseTime}h</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
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
          <div className="lg:col-span-2">
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
                <tr key={ticket.id} className="border-b border-[#2A3038] hover:bg-[#2A3038]/30 transition-colors">
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
                    <span className="text-[#7E8691]">{getCategoryLabel(ticket.category)}</span>
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

      {/* Ticket Details Modal */}
      {selectedTicket && !showReplyModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#2A3038]">
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedTicket.subject}</h3>
                <p className="text-sm text-[#7E8691]">
                  Por {selectedTicket.userName || 'Anônimo'} • {formatDate(selectedTicket.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-[#7E8691] hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="flex flex-wrap gap-3 mb-6">
                {getStatusBadge(selectedTicket.status)}
                {getPriorityBadge(selectedTicket.priority)}
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#2A3038] text-[#D0D6DE]">
                  {getCategoryLabel(selectedTicket.category)}
                </span>
              </div>
              <div className="bg-[#0F1115] border border-[#2A3038] rounded-lg p-4 mb-6">
                <p className="text-[#D0D6DE] whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#7E8691]">Email</p>
                  <p className="text-white">{selectedTicket.userEmail || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[#7E8691]">Tenant ID</p>
                  <p className="text-white font-mono text-xs">{selectedTicket.tenantId || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[#7E8691]">Responsável</p>
                  <p className="text-white">{selectedTicket.assignedToName || 'Não atribuído'}</p>
                </div>
                <div>
                  <p className="text-[#7E8691]">Última Resposta</p>
                  <p className="text-white">
                    {selectedTicket.lastReplyAt ? formatDate(selectedTicket.lastReplyAt) : 'Nunca'}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[#2A3038] flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedTicket(null)}
              >
                Fechar
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => setShowReplyModal(true)}
              >
                Responder
              </Button>
            </div>
          </div>
        </div>
      )}

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
              <div className="bg-[#0F1115] border border-[#2A3038] rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">{selectedTicket.subject}</h4>
                <p className="text-[#7E8691] text-sm">{selectedTicket.message}</p>
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
  );
}

