'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onboardingApi } from '@/lib/api';
import { getLocalStorageItem, setLocalStorageItem } from '@/lib/utils/localStorage';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { PlanCard } from '@/components/PlanCard';
import { FormSection } from '@/components/FormSection';
import { ErrorModal } from '@/components/ErrorModal';

const STORAGE_KEY = 'onboarding_tenant_id';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    documentType: 'cpf' as 'cpf' | 'cnpj',
    document: '',
    subdomain: '',
    password: '',
    plan: 'workshops_starter' as 'workshops_starter' | 'workshops_professional' | 'workshops_enterprise',
    billingCycle: 'monthly' as 'monthly' | 'annual',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tenantId, setTenantId] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Recuperar estado do localStorage ao carregar
  useEffect(() => {
    const savedTenantId = getLocalStorageItem(STORAGE_KEY);
    if (savedTenantId) {
      setTenantId(savedTenantId);
      setStep(2);
    }
  }, []);


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const registerPayload: any = {
        name: formData.name,
        email: formData.email,
        documentType: formData.documentType,
        document: formData.document,
        subdomain: formData.subdomain,
        plan: formData.plan,
      };

      // Só incluir password se não estiver vazio
      if (formData.password && formData.password.trim().length > 0) {
        registerPayload.password = formData.password;
      }

      const response = await onboardingApi.register(registerPayload);

      setTenantId(response.tenantId);
      setLocalStorageItem(STORAGE_KEY, response.tenantId);
      setStep(2);
    } catch (err: unknown) {
      let errorMessage = 'Erro ao registrar. Tente novamente.';

      const apiError = err as any;

      if (apiError.response?.data) {
        if (Array.isArray(apiError.response.data.message)) {
          errorMessage = apiError.response.data.message.join('\n');
        } else if (typeof apiError.response.data.message === 'string') {
          errorMessage = apiError.response.data.message;
        } else if (apiError.response.data.error) {
          errorMessage = apiError.response.data.error;
        }
      } else if (apiError.message) {
        errorMessage = apiError.message;
      }

      setError(errorMessage);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!tenantId) return;

    setError('');
    setLoading(true);

    try {
      // Salvar subdomain no localStorage para usar na página de sucesso
      localStorage.setItem('onboarding_subdomain', formData.subdomain);

      const response = await onboardingApi.checkout({
        tenantId,
        plan: formData.plan,
        billingCycle: formData.billingCycle,
      });

      if (response.url) {
        window.location.href = response.url;
      }
    } catch (err: unknown) {
      let errorMessage = 'Erro ao criar checkout. Tente novamente.';

      const apiError = err as any;

      if (apiError.response?.data) {
        if (Array.isArray(apiError.response.data.message)) {
          errorMessage = apiError.response.data.message.join('\n');
        } else if (typeof apiError.response.data.message === 'string') {
          errorMessage = apiError.response.data.message;
        } else if (apiError.response.data.error) {
          errorMessage = apiError.response.data.error;
        }
      } else if (apiError.message) {
        errorMessage = apiError.message;
      }

      setError(errorMessage);
      setShowErrorModal(true);
      setLoading(false);
    }
  };

  // Estado para planos da API
  const [apiPlans, setApiPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Buscar planos da API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.mecanica365.com';
        const response = await fetch(`${apiUrl}/api/plans`);
        if (response.ok) {
          const data = await response.json();
          setApiPlans(data);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Função para formatar preço
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Função para obter preço do plano baseado no ciclo
  const getPlanPrice = (planCode: string, cycle: 'monthly' | 'annual') => {
    const plan = apiPlans.find(p => p.code === planCode);
    if (!plan) return 0;
    return cycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  };

  // Transformar planos da API para formato da UI
  const plans = apiPlans.map(plan => {
    const features = [];
    if (plan.serviceOrdersLimit) {
      features.push(`${plan.serviceOrdersLimit} ROs por mês`);
    } else {
      features.push('ROs ilimitadas');
    }
    if (plan.partsLimit) {
      features.push(`${plan.partsLimit} peças no estoque`);
    } else {
      features.push('Estoque ilimitado');
    }
    if (plan.usersLimit) {
      features.push(`${plan.usersLimit} usuários`);
    } else {
      features.push('Usuários ilimitados');
    }
    if (plan.features.includes('advanced_reports')) {
      features.push('Relatórios avançados');
    }
    if (plan.features.includes('api_access')) {
      features.push('API access');
    }
    if (plan.features.includes('white_label')) {
      features.push('White label');
    }
    if (plan.features.includes('priority_support')) {
      features.push('Suporte prioritário');
    }
    if (plan.features.includes('custom_integrations')) {
      features.push('Integrações customizadas');
    }

    return {
      value: plan.code,
      label: plan.name,
      features,
      popular: plan.code.includes('professional') || plan.highlightText?.toLowerCase().includes('popular'),
    };
  });

  return (
    <div className="min-h-screen bg-[#0F1115]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <h1 className="text-4xl font-bold neon-turquoise">
              Mecânica365
            </h1>
          </Link>
          <h2 className="text-3xl font-bold text-[#D0D6DE] mb-2">
            {step === 1 ? 'Crie sua conta e escolha seu plano' : 'Finalize seu pagamento'}
          </h2>
          <p className="text-[#7E8691]">
            {step === 1
              ? 'Preencha os dados abaixo e selecione o plano que melhor atende sua oficina'
              : 'Escolha o ciclo de cobrança e finalize seu pagamento'
            }
          </p>
        </div>

        {/* Error Modal */}
        <ErrorModal
          isOpen={showErrorModal}
          onClose={() => {
            setShowErrorModal(false);
            setError('');
          }}
          error={error}
        />

        {/* Form Card */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-10">
          {step === 1 ? (
            <form onSubmit={handleRegister} className="space-y-4 sm:space-y-6" autoComplete="off">
              {/* Dados da Oficina */}
              <div className="space-y-3 sm:space-y-4">
                <Input
                  id="name"
                  label="Nome da Oficina"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Oficina do João"
                  autoComplete="organization"
                />

                <Input
                  id="email"
                  label="Email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="seu@email.com"
                  autoComplete="email"
                />

                <Select
                  id="documentType"
                  label="Tipo de Documento"
                  value={formData.documentType}
                  onChange={(e) => setFormData({
                    ...formData,
                    documentType: e.target.value as 'cpf' | 'cnpj',
                    document: ''
                  })}
                  options={[
                    { value: 'cpf', label: 'CPF (Pessoa Física)' },
                    { value: 'cnpj', label: 'CNPJ (Pessoa Jurídica)' },
                  ]}
                />

                <Input
                  id="document"
                  label={formData.documentType === 'cpf' ? 'CPF' : 'CNPJ'}
                  type="text"
                  required
                  pattern={formData.documentType === 'cpf' ? '[0-9]{11}' : '[0-9]{14}'}
                  maxLength={formData.documentType === 'cpf' ? 11 : 14}
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value.replace(/\D/g, '') })}
                  placeholder={formData.documentType === 'cpf' ? '00000000000' : '00000000000000'}
                  helperText="Apenas números"
                  autoComplete="off"
                />

                <Input
                  id="subdomain"
                  label="Subdomain"
                  type="text"
                  required
                  value={formData.subdomain}
                  onChange={(e) => setFormData({
                    ...formData,
                    subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  })}
                  placeholder="minha-oficina"
                  helperText={`Seu acesso será: ${formData.subdomain || 'seu-subdomain'}.mecanica365.app`}
                  autoComplete="off"
                />

                <Input
                  id="password"
                  label="Senha"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Deixe em branco para gerar automaticamente"
                  helperText="Opcional - será gerada automaticamente se não informada"
                  autoComplete="new-password"
                />
              </div>

              {/* Seleção de Plano */}
              <FormSection
                title="📦 Escolha seu plano"
                description="Selecione o plano que melhor atende às necessidades da sua oficina"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan) => {
                    const monthlyPrice = getPlanPrice(plan.value, 'monthly');
                    return (
                      <PlanCard
                        key={plan.value}
                        value={plan.value}
                        label={plan.label}
                        price={formatPrice(monthlyPrice)}
                        period="/mês"
                        features={plan.features}
                        popular={plan.popular}
                        selected={formData.plan === plan.value}
                        onClick={() => setFormData({ ...formData, plan: plan.value as any })}
                      />
                    );
                  })}
                </div>
                {formData.plan && (
                  <p className="mt-4 text-center text-sm text-[#7E8691]">
                    Plano selecionado: <strong className="text-[#00E0B8] font-semibold">
                      {plans.find(p => p.value === formData.plan)?.label}
                    </strong>
                  </p>
                )}
              </FormSection>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={loading}
                className="w-full"
              >
                Continuar
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Resumo do Plano */}
              <div className="bg-gradient-to-r from-[#00E0B8]/10 to-[#3ABFF8]/10 rounded-xl p-6 border border-[#00E0B8]/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#7E8691] mb-1">Plano selecionado</p>
                    <p className="text-2xl font-bold text-[#00E0B8]">
                      {plans.find(p => p.value === formData.plan)?.label}
                    </p>
                    <p className="text-sm text-[#7E8691] mt-1">
                      {formData.billingCycle === 'annual' ? (
                        <>
                          <span className="text-lg font-semibold text-[#00E0B8]">
                            {formatPrice(getPlanPrice(formData.plan, 'annual'))}
                          </span>
                          <span className="text-[#7E8691]">/ano</span>
                          <span className="ml-2 text-xs text-[#00E0B8] font-semibold">
                            (Economia de {formatPrice((getPlanPrice(formData.plan, 'monthly') * 12) - getPlanPrice(formData.plan, 'annual'))})
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-lg font-semibold text-[#00E0B8]">
                            {formatPrice(getPlanPrice(formData.plan, 'monthly'))}
                          </span>
                          <span className="text-[#7E8691]">/mês</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#00E0B8] to-[#3ABFF8] text-[#0F1115] rounded-full text-sm font-semibold">
                      ✓ Confirmado
                    </div>
                  </div>
                </div>
              </div>

              {/* Ciclo de Cobrança */}
              <FormSection
                title="💳 Ciclo de cobrança"
                description="Escolha como prefere ser cobrado"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, billingCycle: 'monthly' })}
                    className={`
                      p-6 border-2 rounded-xl text-left transition-all
                      ${formData.billingCycle === 'monthly'
                        ? 'border-[#00E0B8] bg-[#00E0B8]/10 shadow-md'
                        : 'border-[#2A3038] hover:border-[#00E0B8]/50 bg-[#1A1E23]'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-lg text-[#D0D6DE]">Mensal</div>
                      <div className="text-lg font-bold text-[#00E0B8]">
                        {formatPrice(getPlanPrice(formData.plan, 'monthly'))}
                        <span className="text-sm font-normal text-[#7E8691]">/mês</span>
                      </div>
                    </div>
                    <div className="text-sm text-[#7E8691]">Cobrança recorrente mensal</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, billingCycle: 'annual' })}
                    className={`
                      p-6 border-2 rounded-xl text-left transition-all
                      ${formData.billingCycle === 'annual'
                        ? 'border-[#00E0B8] bg-[#00E0B8]/10 shadow-md'
                        : 'border-[#2A3038] hover:border-[#00E0B8]/50 bg-[#1A1E23]'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-semibold text-lg text-[#D0D6DE]">Anual</div>
                        <div className="text-xs text-[#00E0B8] font-semibold mt-1">
                          Economia de {formatPrice((getPlanPrice(formData.plan, 'monthly') * 12) - getPlanPrice(formData.plan, 'annual'))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-[#00E0B8]">
                          {formatPrice(getPlanPrice(formData.plan, 'annual'))}
                          <span className="text-sm font-normal text-[#7E8691]">/ano</span>
                        </div>
                        <div className="text-xs text-[#7E8691] mt-1">
                          {formatPrice(getPlanPrice(formData.plan, 'annual') / 12)}/mês
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-[#7E8691]">Pagamento único anual com desconto</div>
                  </button>
                </div>
              </FormSection>

              <Button
                onClick={handleCheckout}
                variant="primary"
                size="lg"
                isLoading={loading}
                className="w-full"
              >
                Finalizar Pagamento
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-[#7E8691]">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-[#00E0B8] font-semibold hover:text-[#3ABFF8] transition-colors">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
