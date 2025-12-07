'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { paymentGatewaysApi, PaymentGatewayConfig, GatewayType, CreatePaymentGatewayDto } from '@/lib/api/payment-gateways';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useNotification } from '@/components/NotificationProvider';

const GATEWAY_TYPES = [
  { value: GatewayType.STRIPE, label: 'Stripe', description: 'Gateway internacional de pagamentos', docs: 'https://stripe.com/docs' },
  { value: GatewayType.PAYPAL, label: 'PayPal', description: 'Pagamentos via PayPal', docs: 'https://developer.paypal.com/docs' },
  { value: GatewayType.PAGSEGURO, label: 'PagSeguro', description: 'Gateway brasileiro PagSeguro', docs: 'https://dev.pagseguro.uol.com.br/docs' },
  { value: GatewayType.MERCADO_PAGO, label: 'Mercado Pago', description: 'Gateway Mercado Pago', docs: 'https://www.mercadopago.com.br/developers/pt/docs' },
  { value: GatewayType.ASAAAS, label: 'Asaas', description: 'Gateway Asaas', docs: 'https://docs.asaas.com' },
  { value: GatewayType.GERENCIANET, label: 'Gerencianet', description: 'Gateway Gerencianet (Efí)', docs: 'https://dev.gerencianet.com.br/docs' },
  { value: GatewayType.PHYSICAL_TERMINAL, label: 'Maquininha Física', description: 'Maquininha de cartão física (Stone, PagSeguro, etc.)', docs: '' },
  { value: GatewayType.OTHER, label: 'Outro', description: 'Outro gateway de pagamento', docs: '' },
];

interface HelpTooltipProps {
  readonly content: React.ReactNode;
  readonly title?: string;
}

function HelpTooltip({ content, title }: HelpTooltipProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="ml-2 text-[#7E8691] hover:text-[#00E0B8] transition-colors"
        aria-label="Ajuda"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      </button>
      {show && (
        <div className="absolute z-50 w-80 p-4 bg-[#1A1E23] border border-[#2A3038] rounded-lg shadow-lg left-0 top-6">
          {title && <h4 className="font-semibold text-[#D0D6DE] mb-2">{title}</h4>}
          <div className="text-sm text-[#7E8691]">{content}</div>
        </div>
      )}
    </div>
  );
}

export default function PaymentGatewaysSettingsPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingGateway, setEditingGateway] = useState<PaymentGatewayConfig | null>(null);
  const [subdomain, setSubdomain] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [formData, setFormData] = useState<CreatePaymentGatewayDto>({
    name: '',
    type: GatewayType.STRIPE,
    isActive: true,
    isDefault: false,
    credentials: {},
    settings: {
      autoCapture: true,
      installments: {
        enabled: true,
        maxInstallments: 12,
        minInstallmentValue: 5,
      },
    },
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Obter subdomain e base URL
    const currentSubdomain = localStorage.getItem('subdomain') || '';
    const currentBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    setSubdomain(currentSubdomain);
    setBaseUrl(currentBaseUrl);

    loadGateways();
  }, []);

  const getWebhookUrl = (gatewayType: GatewayType): string => {
    const apiBase = baseUrl.includes('localhost') && subdomain
      ? `http://${subdomain}.localhost:3001/api`
      : `${baseUrl}/api`;
    
    return `${apiBase}/webhooks/payments/${gatewayType}`;
  };

  const loadGateways = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await paymentGatewaysApi.findAll();
      setGateways(data);
    } catch (err: unknown) {
      console.error('[PaymentGatewaysSettingsPage] Erro ao carregar gateways:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar gateways';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getCredentialsFields = (type: GatewayType) => {
    const webhookUrl = getWebhookUrl(type);
    const gatewayInfo = GATEWAY_TYPES.find(gt => gt.value === type);
    
    switch (type) {
      case GatewayType.STRIPE:
        return [
          {
            key: 'publishableKey',
            label: 'Chave Pública (Publishable Key)',
            type: 'text',
            required: true,
            help: (
              <div>
                <p className="mb-2">Encontre suas chaves no Dashboard do Stripe:</p>
                <ol className="list-decimal list-inside space-y-1 mb-2">
                  <li>Acesse <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="text-[#00E0B8] hover:underline">dashboard.stripe.com</a></li>
                  <li>Vá em Developers → API keys</li>
                  <li>Copie a Publishable key</li>
                </ol>
                <p className="mb-2 font-semibold">URL do Webhook:</p>
                <code className="block p-2 bg-[#0F1115] rounded text-xs break-all text-[#00E0B8]">{webhookUrl}</code>
                <p className="mt-2 text-xs">Configure este webhook no Stripe Dashboard → Webhooks → Add endpoint</p>
              </div>
            ),
          },
          {
            key: 'secretKey',
            label: 'Chave Secreta (Secret Key)',
            type: 'password',
            required: true,
            help: (
              <div>
                <p className="mb-2">Mesma página do Stripe Dashboard:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Na seção API keys, copie a Secret key</li>
                  <li>Nunca compartilhe esta chave publicamente</li>
                </ol>
              </div>
            ),
          },
        ];
      case GatewayType.PAYPAL:
        return [
          {
            key: 'clientId',
            label: 'Client ID',
            type: 'text',
            required: true,
            help: (
              <div>
                <p className="mb-2">Obtenha no PayPal Developer:</p>
                <ol className="list-decimal list-inside space-y-1 mb-2">
                  <li>Acesse <a href="https://developer.paypal.com" target="_blank" rel="noopener noreferrer" className="text-[#00E0B8] hover:underline">developer.paypal.com</a></li>
                  <li>Vá em My Apps & Credentials</li>
                  <li>Copie o Client ID</li>
                </ol>
                <p className="mb-2 font-semibold">URL do Webhook:</p>
                <code className="block p-2 bg-[#0F1115] rounded text-xs break-all text-[#00E0B8]">{webhookUrl}</code>
              </div>
            ),
          },
          {
            key: 'clientSecret',
            label: 'Client Secret',
            type: 'password',
            required: true,
            help: (
              <div>
                <p className="mb-2">Na mesma página do PayPal Developer:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Copie o Client Secret</li>
                  <li>Mantenha esta informação segura</li>
                </ol>
              </div>
            ),
          },
          {
            key: 'sandbox',
            label: 'Modo Sandbox (Teste)',
            type: 'checkbox',
            required: false,
            help: 'Marque para usar ambiente de testes. Desmarque para produção.',
          },
        ];
      case GatewayType.PAGSEGURO:
        return [
          {
            key: 'email',
            label: 'Email da Conta PagSeguro',
            type: 'email',
            required: true,
            help: (
              <div>
                <p className="mb-2">Email cadastrado no PagSeguro:</p>
                <ol className="list-decimal list-inside space-y-1 mb-2">
                  <li>Acesse <a href="https://pagseguro.uol.com.br" target="_blank" rel="noopener noreferrer" className="text-[#00E0B8] hover:underline">pagseguro.uol.com.br</a></li>
                  <li>Vá em Integrações → Tokens</li>
                  <li>Use o email da sua conta</li>
                </ol>
                <p className="mb-2 font-semibold">URL do Webhook:</p>
                <code className="block p-2 bg-[#0F1115] rounded text-xs break-all text-[#00E0B8]">{webhookUrl}</code>
                <p className="mt-2 text-xs">Configure em Integrações → Notificações</p>
              </div>
            ),
          },
          {
            key: 'token',
            label: 'Token de Segurança',
            type: 'password',
            required: true,
            help: (
              <div>
                <p className="mb-2">Na mesma página de Tokens do PagSeguro:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Gere um novo token ou use um existente</li>
                  <li>Copie o token gerado</li>
                </ol>
              </div>
            ),
          },
          {
            key: 'sandbox',
            label: 'Modo Sandbox (Teste)',
            type: 'checkbox',
            required: false,
            help: 'Marque para usar ambiente de testes. Desmarque para produção.',
          },
        ];
      case GatewayType.MERCADO_PAGO:
        return [
          {
            key: 'accessToken',
            label: 'Access Token',
            type: 'password',
            required: true,
            help: (
              <div>
                <p className="mb-2">Obtenha no Mercado Pago:</p>
                <ol className="list-decimal list-inside space-y-1 mb-2">
                  <li>Acesse <a href="https://www.mercadopago.com.br/developers" target="_blank" rel="noopener noreferrer" className="text-[#00E0B8] hover:underline">mercadopago.com.br/developers</a></li>
                  <li>Vá em Suas integrações → Credenciais</li>
                  <li>Copie o Access Token</li>
                </ol>
                <p className="mb-2 font-semibold">URL do Webhook:</p>
                <code className="block p-2 bg-[#0F1115] rounded text-xs break-all text-[#00E0B8]">{webhookUrl}</code>
              </div>
            ),
          },
          {
            key: 'publicKey',
            label: 'Public Key',
            type: 'text',
            required: true,
            help: (
              <div>
                <p className="mb-2">Na mesma página de Credenciais:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Copie a Public Key</li>
                  <li>Esta chave pode ser exposta no frontend</li>
                </ol>
              </div>
            ),
          },
        ];
      case GatewayType.ASAAAS:
        return [
          {
            key: 'apiKey',
            label: 'API Key',
            type: 'password',
            required: true,
            help: (
              <div>
                <p className="mb-2">Obtenha no Asaas:</p>
                <ol className="list-decimal list-inside space-y-1 mb-2">
                  <li>Acesse <a href="https://www.asaas.com" target="_blank" rel="noopener noreferrer" className="text-[#00E0B8] hover:underline">asaas.com</a></li>
                  <li>Vá em Configurações → Integrações → API</li>
                  <li>Gere uma nova API Key ou use existente</li>
                </ol>
                <p className="mb-2 font-semibold">URL do Webhook:</p>
                <code className="block p-2 bg-[#0F1115] rounded text-xs break-all text-[#00E0B8]">{webhookUrl}</code>
              </div>
            ),
          },
        ];
      case GatewayType.GERENCIANET:
        return [
          {
            key: 'clientId',
            label: 'Client ID',
            type: 'text',
            required: true,
            help: (
              <div>
                <p className="mb-2">Obtenha no Gerencianet:</p>
                <ol className="list-decimal list-inside space-y-1 mb-2">
                  <li>Acesse <a href="https://gerencianet.com.br" target="_blank" rel="noopener noreferrer" className="text-[#00E0B8] hover:underline">gerencianet.com.br</a></li>
                  <li>Vá em Integrações → Credenciais</li>
                  <li>Copie o Client ID</li>
                </ol>
                <p className="mb-2 font-semibold">URL do Webhook:</p>
                <code className="block p-2 bg-[#0F1115] rounded text-xs break-all text-[#00E0B8]">{webhookUrl}</code>
              </div>
            ),
          },
          {
            key: 'clientSecret',
            label: 'Client Secret',
            type: 'password',
            required: true,
            help: (
              <div>
                <p className="mb-2">Na mesma página de Credenciais:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Copie o Client Secret</li>
                  <li>Mantenha esta informação segura</li>
                </ol>
              </div>
            ),
          },
          {
            key: 'sandbox',
            label: 'Modo Sandbox (Teste)',
            type: 'checkbox',
            required: false,
            help: 'Marque para usar ambiente de testes. Desmarque para produção.',
          },
        ];
      case GatewayType.PHYSICAL_TERMINAL:
        return [
          {
            key: 'terminalId',
            label: 'ID da Maquininha',
            type: 'text',
            required: true,
            help: (
              <div>
                <p className="mb-2">Informações da maquininha física:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Stone: Encontre no app Stone ou no painel administrativo</li>
                  <li>PagSeguro: No app PagSeguro, vá em Configurações → Terminal</li>
                  <li>Outros: Consulte a documentação do fabricante</li>
                </ul>
              </div>
            ),
          },
          {
            key: 'merchantId',
            label: 'ID do Estabelecimento',
            type: 'text',
            required: true,
            help: 'ID do estabelecimento comercial fornecido pelo gateway da maquininha.',
          },
        ];
      default:
        return [
          {
            key: 'apiKey',
            label: 'API Key',
            type: 'text',
            required: true,
            help: 'Chave de API fornecida pelo gateway de pagamento.',
          },
          {
            key: 'apiSecret',
            label: 'API Secret',
            type: 'password',
            required: false,
            help: 'Chave secreta fornecida pelo gateway de pagamento (se aplicável).',
          },
        ];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload: CreatePaymentGatewayDto = {
        name: formData.name,
        type: formData.type,
        isActive: formData.isActive,
        isDefault: formData.isDefault || false,
        credentials: formData.credentials,
        settings: {
          ...formData.settings,
          webhookUrl: getWebhookUrl(formData.type),
          notificationUrl: getWebhookUrl(formData.type),
        },
      };

      if (editingGateway) {
        await paymentGatewaysApi.update(editingGateway.id, payload);
      } else {
        await paymentGatewaysApi.create(payload);
      }

      await loadGateways();
      showNotification(editingGateway ? 'Gateway atualizado com sucesso!' : 'Gateway criado com sucesso!', 'success');
      resetForm();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar gateway';
      showNotification(errorMessage, 'error');
      console.error('Erro ao salvar gateway:', err);
    }
  };

  const handleEdit = (gateway: PaymentGatewayConfig) => {
    setEditingGateway(gateway);
    setFormData({
      name: gateway.name,
      type: gateway.type,
      isActive: gateway.isActive,
      isDefault: gateway.isDefault,
      credentials: gateway.credentials,
      settings: gateway.settings || {
        autoCapture: true,
        installments: {
          enabled: true,
          maxInstallments: 12,
          minInstallmentValue: 5,
        },
      },
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este gateway?')) {
      return;
    }

    try {
      await paymentGatewaysApi.remove(id);
      await loadGateways();
      showNotification('Gateway excluído com sucesso!', 'success');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir gateway';
      showNotification(errorMessage, 'error');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await paymentGatewaysApi.setDefault(id);
      await loadGateways();
      showNotification('Gateway definido como padrão', 'success');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao definir gateway padrão';
      showNotification(errorMessage, 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: GatewayType.STRIPE,
      isActive: true,
      isDefault: false,
      credentials: {},
      settings: {
        autoCapture: true,
        installments: {
          enabled: true,
          maxInstallments: 12,
          minInstallmentValue: 5,
        },
      },
    });
    setEditingGateway(null);
    setShowForm(false);
  };

  const handleTestConnection = async (id: string) => {
    try {
      const result = await paymentGatewaysApi.testConnection(id);
      showNotification(result.message, result.success ? 'success' : 'error');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao testar conexão';
      showNotification(errorMessage, 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification('URL copiada para a área de transferência!', 'success');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto"></div>
            <p className="mt-4 text-[#7E8691]">Carregando configurações...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentWebhookUrl = getWebhookUrl(formData.type);
  const gatewayInfo = GATEWAY_TYPES.find(gt => gt.value === formData.type);

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-[#D0D6DE]">Configuração de Gateways de Pagamento</h1>
            <div className="flex space-x-2">
              <Link href="/payments">
                <Button variant="secondary">Voltar para Pagamentos</Button>
              </Link>
              {!showForm && (
                <Button variant="primary" onClick={() => setShowForm(true)}>
                  + Novo Gateway
                </Button>
              )}
            </div>
          </div>
          <p className="text-[#7E8691]">
            Configure os gateways de pagamento que você utiliza (Stripe, PayPal, maquininha física, etc.)
          </p>
        </div>

        {/* Erro */}
        {error && (
          <div className="bg-[#FF4E3D]/10 border border-[#FF4E3D] rounded-lg p-4 mb-6">
            <p className="text-[#FF4E3D]">{error}</p>
          </div>
        )}

        {/* Formulário */}
        {showForm && (
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">
              {editingGateway ? 'Editar Gateway' : 'Novo Gateway'}
            </h2>
            
            {/* Informações do Gateway */}
            {gatewayInfo && gatewayInfo.docs && (
              <div className="bg-[#0F1115] border border-[#2A3038] rounded-lg p-4 mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[#D0D6DE] mb-1">Documentação</h3>
                    <p className="text-sm text-[#7E8691] mb-2">
                      Consulte a documentação oficial do {gatewayInfo.label} para obter suas credenciais.
                    </p>
                    <a
                      href={gatewayInfo.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00E0B8] hover:text-[#3ABFF8] text-sm flex items-center gap-1"
                    >
                      Abrir documentação
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome do Gateway"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Stripe Principal, Maquininha Loja 1"
                  required
                />
                <Select
                  label="Tipo de Gateway"
                  value={formData.type}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      type: e.target.value as GatewayType,
                      credentials: {}, // Limpar credenciais ao mudar tipo
                    });
                  }}
                  options={GATEWAY_TYPES.map(gt => ({
                    value: gt.value,
                    label: `${gt.label} - ${gt.description}`,
                  }))}
                  required
                />
              </div>

              {/* URL do Webhook - Sempre visível */}
              <div className="bg-[#0F1115] border border-[#2A3038] rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
                      URL do Webhook
                      <HelpTooltip
                        title="O que é um Webhook?"
                        content={
                          <div>
                            <p className="mb-2">O webhook é uma URL que o gateway de pagamento usa para notificar nosso sistema sobre mudanças no status dos pagamentos.</p>
                            <p className="mb-2">Copie esta URL e configure no painel do gateway de pagamento escolhido.</p>
                            <p className="text-xs text-[#7E8691]">Esta URL é única para seu tenant ({subdomain || 'seu-tenant'})</p>
                          </div>
                        }
                      />
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-[#0F1115] border border-[#2A3038] rounded text-xs break-all text-[#00E0B8]">
                        {currentWebhookUrl}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(currentWebhookUrl)}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Credenciais */}
              <div className="bg-[#0F1115] border border-[#2A3038] rounded-lg p-4">
                <h3 className="text-lg font-semibold text-[#D0D6DE] mb-4">Credenciais</h3>
                <div className="space-y-4">
                  {getCredentialsFields(formData.type).map((field) => (
                    <div key={field.key}>
                      <div className="flex items-center mb-1">
                        <label htmlFor={field.key} className="block text-sm font-medium text-[#D0D6DE]">
                          {field.label}
                          {field.required && <span className="text-[#FF4E3D] ml-1">*</span>}
                        </label>
                        {field.help && <HelpTooltip content={field.help} title={field.label} />}
                      </div>
                      {field.type === 'checkbox' ? (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={field.key}
                            checked={formData.credentials[field.key] === true}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                credentials: {
                                  ...formData.credentials,
                                  [field.key]: e.target.checked,
                                },
                              });
                            }}
                            className="mr-2"
                          />
                          <label htmlFor={field.key} className="text-sm text-[#D0D6DE]">
                            {field.label}
                          </label>
                        </div>
                      ) : (
                        <Input
                          label=""
                          type={field.type}
                          value={(formData.credentials[field.key] as string) || ''}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              credentials: {
                                ...formData.credentials,
                                [field.key]: e.target.value,
                              },
                            });
                          }}
                          required={field.required}
                          placeholder={`Digite ${field.label.toLowerCase()}`}
                          className="mt-1"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Configurações */}
              <div className="bg-[#0F1115] border border-[#2A3038] rounded-lg p-4">
                <h3 className="text-lg font-semibold text-[#D0D6DE] mb-4">Configurações</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="isActive" className="text-sm text-[#D0D6DE]">
                      Gateway ativo
                    </label>
                    <HelpTooltip content="Desative para pausar temporariamente este gateway sem excluí-lo." />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="isDefault" className="text-sm text-[#D0D6DE]">
                      Gateway padrão (usado por padrão em novos pagamentos)
                    </label>
                    <HelpTooltip content="Quando marcado, este gateway será usado automaticamente ao criar novos pagamentos." />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="autoCapture"
                      checked={formData.settings?.autoCapture || false}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          settings: {
                            ...formData.settings,
                            autoCapture: e.target.checked,
                          },
                        });
                      }}
                      className="mr-2"
                    />
                    <label htmlFor="autoCapture" className="text-sm text-[#D0D6DE]">
                      Captura automática de pagamentos
                    </label>
                    <HelpTooltip content="Quando ativado, os pagamentos serão capturados automaticamente assim que aprovados pelo gateway." />
                  </div>
                  {(formData.type === GatewayType.STRIPE || formData.type === GatewayType.PAGSEGURO || formData.type === GatewayType.MERCADO_PAGO || formData.type === GatewayType.PHYSICAL_TERMINAL) ? (
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="installmentsEnabled"
                          checked={formData.settings?.installments?.enabled || false}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              settings: {
                                ...formData.settings,
                                installments: {
                                  enabled: e.target.checked,
                                  maxInstallments: formData.settings?.installments?.maxInstallments || 12,
                                  minInstallmentValue: formData.settings?.installments?.minInstallmentValue || 5,
                                },
                              },
                            });
                          }}
                          className="mr-2"
                        />
                        <label htmlFor="installmentsEnabled" className="text-sm text-[#D0D6DE]">
                          Permitir parcelamento
                        </label>
                        <HelpTooltip content="Permite que clientes parcelem pagamentos em cartão de crédito." />
                      </div>
                      {formData.settings?.installments?.enabled && (
                        <div className="grid grid-cols-2 gap-4 ml-6">
                          <Input
                            label="Máximo de Parcelas"
                            type="number"
                            min="1"
                            max="24"
                            value={formData.settings.installments.maxInstallments}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                settings: {
                                  ...formData.settings,
                                  installments: {
                                    enabled: formData.settings?.installments?.enabled || true,
                                    maxInstallments: Number.parseInt(e.target.value, 10) || 12,
                                    minInstallmentValue: formData.settings?.installments?.minInstallmentValue || 5,
                                  },
                                },
                              });
                            }}
                          />
                          <Input
                            label="Valor Mínimo por Parcela (R$)"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.settings.installments.minInstallmentValue}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                settings: {
                                  ...formData.settings,
                                  installments: {
                                    enabled: formData.settings?.installments?.enabled || true,
                                    maxInstallments: formData.settings?.installments?.maxInstallments || 12,
                                    minInstallmentValue: Number.parseFloat(e.target.value) || 5,
                                  },
                                },
                              });
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-4">
                <Button variant="secondary" type="button" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit">
                  {editingGateway ? 'Atualizar' : 'Criar'} Gateway
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Gateways */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Gateways Configurados</h2>
            {gateways.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#7E8691] mb-4">Nenhum gateway configurado ainda.</p>
                <Button variant="primary" onClick={() => setShowForm(true)}>
                  + Adicionar Primeiro Gateway
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {gateways.map((gateway) => {
                  const gatewayType = GATEWAY_TYPES.find(gt => gt.value === gateway.type);
                  const gatewayWebhookUrl = getWebhookUrl(gateway.type);
                  return (
                    <div
                      key={gateway.id}
                      className="bg-[#0F1115] border border-[#2A3038] rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-[#D0D6DE]">{gateway.name}</h3>
                            {gateway.isDefault && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#00E0B8]/20 text-[#00E0B8]">
                                Padrão
                              </span>
                            )}
                            {gateway.isActive ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#00E0B8]/20 text-[#00E0B8]">
                                Ativo
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#7E8691]/20 text-[#7E8691]">
                                Inativo
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[#7E8691] mb-2">
                            Tipo: {gatewayType?.label || gateway.type}
                          </p>
                          {gateway.settings?.installments?.enabled && (
                            <p className="text-sm text-[#7E8691] mb-2">
                              Parcelamento: até {gateway.settings.installments.maxInstallments}x
                            </p>
                          )}
                          <div className="mt-3">
                            <p className="text-xs text-[#7E8691] mb-1">Webhook URL:</p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 p-2 bg-[#1A1E23] border border-[#2A3038] rounded text-xs break-all text-[#00E0B8]">
                                {gatewayWebhookUrl}
                              </code>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(gatewayWebhookUrl)}
                              >
                                Copiar
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestConnection(gateway.id)}
                          >
                            Testar
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEdit(gateway)}
                          >
                            Editar
                          </Button>
                          {!gateway.isDefault && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleSetDefault(gateway.id)}
                            >
                              Definir padrão
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(gateway.id)}
                            className="text-[#FF4E3D] border-[#FF4E3D] hover:bg-[#FF4E3D]/10"
                          >
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
