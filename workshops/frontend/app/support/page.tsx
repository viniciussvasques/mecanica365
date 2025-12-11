'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useNotification } from '@/components/NotificationProvider';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    category: 'Geral',
    question: 'Como faço para criar uma nova ordem de serviço?',
    answer: 'Acesse o menu "Ordens de Serviço" e clique no botão "Nova OS". Preencha os dados do cliente, veículo e serviços a serem realizados.',
  },
  {
    category: 'Geral',
    question: 'Como adiciono um novo cliente?',
    answer: 'Vá em "Clientes" no menu lateral e clique em "Novo Cliente". Você também pode cadastrar um cliente diretamente ao criar uma nova OS.',
  },
  {
    category: 'Orçamentos',
    question: 'Como envio um orçamento para o cliente?',
    answer: 'Após criar o orçamento, clique no botão "Enviar" para gerar um link compartilhável ou enviar por email/WhatsApp diretamente.',
  },
  {
    category: 'Orçamentos',
    question: 'O cliente pode aprovar o orçamento online?',
    answer: 'Sim! O cliente recebe um link onde pode visualizar o orçamento detalhado e aprovar com um clique. Você será notificado automaticamente.',
  },
  {
    category: 'Estoque',
    question: 'Como controlo o estoque de peças?',
    answer: 'Acesse "Estoque" para ver todas as peças. Você pode definir alertas de estoque mínimo e o sistema avisará quando precisar repor.',
  },
  {
    category: 'Estoque',
    question: 'Como importo peças em lote?',
    answer: 'Em "Peças", clique em "Importar". Baixe o modelo CSV, preencha com seus dados e faça o upload. O sistema importará automaticamente.',
  },
  {
    category: 'Financeiro',
    question: 'Como gero uma fatura?',
    answer: 'Após finalizar uma OS, vá em "Faturas" e crie uma nova fatura vinculada à OS. Você pode enviar para o cliente por email.',
  },
  {
    category: 'Financeiro',
    question: 'Quais formas de pagamento posso registrar?',
    answer: 'O sistema suporta dinheiro, cartão de crédito/débito, PIX, boleto e transferência bancária. Você pode parcelar pagamentos.',
  },
  {
    category: 'Planos',
    question: 'Como faço upgrade do meu plano?',
    answer: 'Acesse "Minha Assinatura" no menu e clique em "Alterar Plano". Escolha o novo plano e confirme. A cobrança será proporcional.',
  },
  {
    category: 'Planos',
    question: 'Posso cancelar minha assinatura?',
    answer: 'Sim, em "Minha Assinatura" você pode cancelar a qualquer momento. Seu acesso continua até o fim do período pago.',
  },
  {
    category: 'Técnico',
    question: 'O sistema funciona em celular?',
    answer: 'Sim! O sistema é responsivo e funciona em qualquer dispositivo. Seus mecânicos podem usar pelo celular na oficina.',
  },
  {
    category: 'Técnico',
    question: 'Meus dados estão seguros?',
    answer: 'Absolutamente. Usamos criptografia de ponta a ponta, backups diários e servidores seguros. Seus dados são 100% protegidos.',
  },
];

const CATEGORIES = ['Todos', 'Geral', 'Orçamentos', 'Estoque', 'Financeiro', 'Planos', 'Técnico'];

export default function SupportPage() {
  const { showNotification } = useNotification();
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    priority: 'normal',
  });
  const [sending, setSending] = useState(false);

  const filteredFAQ = FAQ_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.subject || !contactForm.message) {
      showNotification('Preencha todos os campos', 'error');
      return;
    }

    setSending(true);
    try {
      // Simular envio - em produção, enviar para API
      await new Promise((resolve) => setTimeout(resolve, 1500));
      showNotification('Mensagem enviada com sucesso! Responderemos em breve.', 'success');
      setContactForm({ subject: '', message: '', priority: 'normal' });
      setShowContactForm(false);
    } catch (error: unknown) {
      showNotification('Erro ao enviar mensagem. Tente novamente.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Central de Ajuda</h1>
          <p className="text-[#7E8691] text-lg max-w-2xl mx-auto">
            Encontre respostas para suas dúvidas ou entre em contato com nossa equipe de suporte
          </p>
        </div>

        {/* Cards de Contato Rápido */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 text-center hover:border-[#00E0B8]/50 transition-colors">
            <div className="w-12 h-12 bg-[#00E0B8]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#00E0B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Email</h3>
            <p className="text-[#7E8691] text-sm mb-3">Resposta em até 24h</p>
            <a href="mailto:suporte@mecanica365.com.br" className="text-[#00E0B8] hover:underline">
              suporte@mecanica365.com.br
            </a>
          </div>

          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 text-center hover:border-[#00E0B8]/50 transition-colors">
            <div className="w-12 h-12 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">WhatsApp</h3>
            <p className="text-[#7E8691] text-sm mb-3">Atendimento rápido</p>
            <a
              href="https://wa.me/5511999999999?text=Olá! Preciso de ajuda com o Mecânica365"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#25D366] hover:underline"
            >
              (11) 99999-9999
            </a>
          </div>

          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 text-center hover:border-[#00E0B8]/50 transition-colors">
            <div className="w-12 h-12 bg-[#3ABFF8]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#3ABFF8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Chat</h3>
            <p className="text-[#7E8691] text-sm mb-3">Online 9h às 18h</p>
            <button
              onClick={() => setShowContactForm(true)}
              className="text-[#3ABFF8] hover:underline"
            >
              Iniciar conversa
            </button>
          </div>
        </div>

        {/* Busca */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar nas perguntas frequentes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1A1E23] border border-[#2A3038] rounded-xl px-5 py-4 pl-12 text-white placeholder-[#7E8691] focus:outline-none focus:border-[#00E0B8]"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7E8691]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Categorias */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-[#00E0B8] text-[#0F1115]'
                  : 'bg-[#1A1E23] text-[#7E8691] hover:text-white hover:bg-[#2A3038]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl overflow-hidden mb-8">
          <div className="p-4 border-b border-[#2A3038]">
            <h2 className="text-xl font-semibold text-white">Perguntas Frequentes</h2>
          </div>
          <div className="divide-y divide-[#2A3038]">
            {filteredFAQ.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-[#7E8691]">Nenhuma pergunta encontrada.</p>
              </div>
            ) : (
              filteredFAQ.map((item, index) => (
                <div key={index} className="group">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#2A3038]/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-1 bg-[#2A3038] text-[#7E8691] rounded">
                        {item.category}
                      </span>
                      <span className="text-white font-medium">{item.question}</span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-[#7E8691] transition-transform ${
                        expandedFAQ === index ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedFAQ === index && (
                    <div className="px-6 pb-4">
                      <p className="text-[#D0D6DE] pl-[calc(0.5rem+2.5rem+0.75rem)]">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Não encontrou? */}
        <div className="bg-gradient-to-r from-[#00E0B8]/10 to-[#3ABFF8]/10 border border-[#00E0B8]/30 rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Não encontrou o que procurava?</h3>
          <p className="text-[#7E8691] mb-6">Nossa equipe está pronta para ajudar você!</p>
          <Button variant="primary" onClick={() => setShowContactForm(true)}>
            Enviar Mensagem
          </Button>
        </div>

        {/* Modal de Contato */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl w-full max-w-lg">
              <div className="flex items-center justify-between p-6 border-b border-[#2A3038]">
                <h3 className="text-xl font-semibold text-white">Enviar Mensagem</h3>
                <button
                  onClick={() => setShowContactForm(false)}
                  className="text-[#7E8691] hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleContactSubmit} className="p-6 space-y-4">
                <Input
                  label="Assunto"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  placeholder="Ex: Dúvida sobre orçamentos"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-[#D0D6DE] mb-2">Prioridade</label>
                  <select
                    value={contactForm.priority}
                    onChange={(e) => setContactForm({ ...contactForm, priority: e.target.value })}
                    className="w-full bg-[#0F1115] border border-[#2A3038] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00E0B8]"
                  >
                    <option value="low">Baixa - Dúvida geral</option>
                    <option value="normal">Normal - Preciso de ajuda</option>
                    <option value="high">Alta - Problema urgente</option>
                  </select>
                </div>
                <Textarea
                  label="Mensagem"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Descreva sua dúvida ou problema em detalhes..."
                  rows={5}
                  required
                />
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowContactForm(false)}
                    disabled={sending}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary" className="flex-1" disabled={sending}>
                    {sending ? 'Enviando...' : 'Enviar Mensagem'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

