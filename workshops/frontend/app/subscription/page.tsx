'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  billingApi,
  Plan,
  Subscription,
  PlanCode,
  getPlanDisplayName,
  getStatusDisplayName,
  getStatusColor,
  formatCurrency,
  formatDate,
  getFeatureLabel,
} from '@/lib/api/billing';
import { Button } from '@/components/ui/Button';
import { useNotification } from '@/components/NotificationProvider';

export default function SubscriptionPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [subscriptionData, plansData] = await Promise.all([
        billingApi.getSubscription().catch(() => null),
        billingApi.getPlans().catch(() => []),
      ]);
      setSubscription(subscriptionData);
      setPlans(plansData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showNotification('Erro ao carregar dados da assinatura', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getCurrentPlan = (): Plan | undefined => {
    if (!subscription) return undefined;
    return plans.find(p => p.code === subscription.plan);
  };

  const canUpgrade = (plan: Plan): boolean => {
    if (!subscription) return false;
    const currentPlan = getCurrentPlan();
    if (!currentPlan) return true;
    return plan.sortOrder > currentPlan.sortOrder;
  };

  const canDowngrade = (plan: Plan): boolean => {
    if (!subscription) return false;
    const currentPlan = getCurrentPlan();
    if (!currentPlan) return false;
    return plan.sortOrder < currentPlan.sortOrder;
  };

  const handleChangePlan = async () => {
    if (!selectedPlan || !subscription) return;

    try {
      setProcessing(true);
      const isUpgrade = canUpgrade(selectedPlan);
      
      if (isUpgrade) {
        await billingApi.upgrade(selectedPlan.code as PlanCode);
        showNotification(`Upgrade para ${selectedPlan.name} realizado com sucesso!`, 'success');
      } else {
        await billingApi.downgrade(selectedPlan.code as PlanCode);
        showNotification(`Downgrade para ${selectedPlan.name} realizado com sucesso!`, 'success');
      }
      
      setShowUpgradeModal(false);
      setSelectedPlan(null);
      await loadData();
    } catch (error) {
      console.error('Erro ao alterar plano:', error);
      showNotification('Erro ao alterar plano. Tente novamente.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setProcessing(true);
      await billingApi.cancel();
      showNotification('Assinatura cancelada com sucesso', 'success');
      setShowCancelModal(false);
      await loadData();
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      showNotification('Erro ao cancelar assinatura. Tente novamente.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReactivate = async () => {
    try {
      setProcessing(true);
      await billingApi.reactivate();
      showNotification('Assinatura reativada com sucesso!', 'success');
      await loadData();
    } catch (error) {
      console.error('Erro ao reativar assinatura:', error);
      showNotification('Erro ao reativar assinatura. Tente novamente.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const getUsagePercentage = (used: number, limit: number | null): number | null => {
    if (limit === null) return null;
    return Math.min((used / limit) * 100, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto mb-4"></div>
          <p className="text-[#7E8691]">Carregando...</p>
        </div>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#D0D6DE] mb-2">Minha Assinatura</h1>
          <p className="text-[#7E8691]">Gerencie seu plano e veja seu uso</p>
        </div>

        {/* Status da Assinatura */}
        {subscription && (
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">
                    Plano {currentPlan?.name || getPlanDisplayName(subscription.plan)}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.status)}`}>
                    {getStatusDisplayName(subscription.status)}
                  </span>
                </div>
                <p className="text-[#7E8691]">
                  {currentPlan?.description || 'Seu plano atual'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-[#00E0B8]">
                  {formatCurrency(currentPlan?.monthlyPrice || 0)}
                  <span className="text-sm text-[#7E8691] font-normal">/mês</span>
                </p>
                <p className="text-sm text-[#7E8691]">
                  Ciclo: {subscription.billingCycle === 'annual' ? 'Anual' : 'Mensal'}
                </p>
              </div>
            </div>

            {/* Período */}
            <div className="mt-6 pt-6 border-t border-[#2A3038] grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-[#7E8691] mb-1">Início do Período</p>
                <p className="text-white font-medium">{formatDate(subscription.currentPeriodStart)}</p>
              </div>
              <div>
                <p className="text-sm text-[#7E8691] mb-1">Fim do Período</p>
                <p className="text-white font-medium">{formatDate(subscription.currentPeriodEnd)}</p>
              </div>
              <div>
                <p className="text-sm text-[#7E8691] mb-1">Próxima Cobrança</p>
                <p className="text-white font-medium">
                  {subscription.status === 'active' 
                    ? formatCurrency(subscription.billingCycle === 'annual' 
                        ? (currentPlan?.annualPrice || 0) 
                        : (currentPlan?.monthlyPrice || 0))
                    : '-'}
                </p>
              </div>
            </div>

            {/* Ações */}
            <div className="mt-6 pt-6 border-t border-[#2A3038] flex flex-wrap gap-3">
              {subscription.status === 'active' && (
                <>
                  <Button
                    variant="primary"
                    onClick={() => setShowUpgradeModal(true)}
                  >
                    Alterar Plano
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/subscription/invoices')}
                  >
                    Ver Faturas
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelModal(true)}
                  >
                    Cancelar Assinatura
                  </Button>
                </>
              )}
              {subscription.status === 'cancelled' && (
                <Button
                  variant="primary"
                  onClick={handleReactivate}
                  disabled={processing}
                >
                  {processing ? 'Reativando...' : 'Reativar Assinatura'}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Uso dos Recursos */}
        {subscription && (
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-6">Uso dos Recursos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Ordens de Serviço */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-[#7E8691]">Ordens de Serviço</span>
                  <span className="text-white">
                    {subscription.serviceOrdersUsed} / {subscription.serviceOrdersLimit ?? '∞'}
                  </span>
                </div>
                <div className="h-2 bg-[#2A3038] rounded-full overflow-hidden">
                  {subscription.serviceOrdersLimit && (
                    <div
                      className={`h-full rounded-full transition-all ${
                        getUsagePercentage(subscription.serviceOrdersUsed, subscription.serviceOrdersLimit)! > 80
                          ? 'bg-[#EF4444]'
                          : getUsagePercentage(subscription.serviceOrdersUsed, subscription.serviceOrdersLimit)! > 60
                          ? 'bg-[#F59E0B]'
                          : 'bg-[#00E0B8]'
                      }`}
                      style={{
                        width: `${getUsagePercentage(subscription.serviceOrdersUsed, subscription.serviceOrdersLimit)}%`,
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Usuários */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-[#7E8691]">Usuários</span>
                  <span className="text-white">
                    - / {currentPlan?.usersLimit ?? '∞'}
                  </span>
                </div>
                <div className="h-2 bg-[#2A3038] rounded-full overflow-hidden">
                  <div className="h-full bg-[#00E0B8] rounded-full" style={{ width: '0%' }} />
                </div>
              </div>

              {/* Peças */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-[#7E8691]">Peças no Estoque</span>
                  <span className="text-white">
                    - / {subscription.partsLimit ?? '∞'}
                  </span>
                </div>
                <div className="h-2 bg-[#2A3038] rounded-full overflow-hidden">
                  <div className="h-full bg-[#00E0B8] rounded-full" style={{ width: '0%' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Incluídas */}
        {subscription && currentPlan && (
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-6">Recursos Incluídos</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(subscription.activeFeatures || currentPlan.features || []).map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#00E0B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[#D0D6DE]">{getFeatureLabel(feature)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comparativo de Planos */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-6">Todos os Planos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = subscription?.plan === plan.code;
              const canUp = canUpgrade(plan);
              const canDown = canDowngrade(plan);

              return (
                <div
                  key={plan.id}
                  className={`relative bg-[#1A1E23] border rounded-xl p-6 ${
                    isCurrentPlan
                      ? 'border-[#00E0B8] ring-2 ring-[#00E0B8]/20'
                      : plan.highlightText
                      ? 'border-[#3ABFF8]'
                      : 'border-[#2A3038]'
                  }`}
                >
                  {/* Badge */}
                  {plan.highlightText && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 bg-gradient-to-r from-[#3ABFF8] to-[#00E0B8] rounded-full text-[#0F1115] text-xs font-bold">
                        {plan.highlightText}
                      </span>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4">
                      <span className="px-3 py-1 bg-[#00E0B8] rounded-full text-[#0F1115] text-xs font-bold">
                        Atual
                      </span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="text-center mb-6 pt-2">
                    <h4 className="text-xl font-bold text-white">{plan.name}</h4>
                    <p className="text-[#7E8691] text-sm mt-1">{plan.description}</p>
                  </div>

                  {/* Preço */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold text-white">
                        {formatCurrency(plan.monthlyPrice)}
                      </span>
                      <span className="text-[#7E8691]">/mês</span>
                    </div>
                    <p className="text-[#7E8691] text-sm mt-1">
                      ou {formatCurrency(plan.annualPrice)}/ano
                    </p>
                  </div>

                  {/* Limites */}
                  <div className="space-y-2 mb-6 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#7E8691]">Ordens de Serviço</span>
                      <span className="text-white">{plan.serviceOrdersLimit ?? 'Ilimitado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7E8691]">Usuários</span>
                      <span className="text-white">{plan.usersLimit ?? 'Ilimitado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7E8691]">Peças</span>
                      <span className="text-white">{plan.partsLimit ?? 'Ilimitado'}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {plan.features.slice(0, 5).map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-[#00E0B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[#D0D6DE]">{getFeatureLabel(feature)}</span>
                      </div>
                    ))}
                    {plan.features.length > 5 && (
                      <p className="text-[#7E8691] text-xs">+{plan.features.length - 5} recursos</p>
                    )}
                  </div>

                  {/* Ação */}
                  {isCurrentPlan ? (
                    <Button variant="outline" disabled className="w-full">
                      Plano Atual
                    </Button>
                  ) : canUp ? (
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => {
                        setSelectedPlan(plan);
                        setShowUpgradeModal(true);
                      }}
                    >
                      Fazer Upgrade
                    </Button>
                  ) : canDown ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSelectedPlan(plan);
                        setShowUpgradeModal(true);
                      }}
                    >
                      Fazer Downgrade
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      Selecionar
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal de Alteração de Plano */}
        {showUpgradeModal && selectedPlan && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl w-full max-w-md">
              <div className="p-6 border-b border-[#2A3038]">
                <h3 className="text-xl font-semibold text-white">
                  {canUpgrade(selectedPlan) ? 'Confirmar Upgrade' : 'Confirmar Downgrade'}
                </h3>
              </div>
              <div className="p-6">
                <p className="text-[#D0D6DE] mb-4">
                  Você está prestes a {canUpgrade(selectedPlan) ? 'fazer upgrade' : 'fazer downgrade'} para o plano{' '}
                  <strong className="text-white">{selectedPlan.name}</strong>.
                </p>
                <div className="bg-[#0F1115] rounded-lg p-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-[#7E8691]">Plano atual:</span>
                    <span className="text-white">{currentPlan?.name}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[#7E8691]">Novo plano:</span>
                    <span className="text-[#00E0B8]">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7E8691]">Novo valor:</span>
                    <span className="text-white">{formatCurrency(selectedPlan.monthlyPrice)}/mês</span>
                  </div>
                </div>
                {canDowngrade(selectedPlan) && (
                  <p className="text-[#F59E0B] text-sm mb-4">
                    ⚠️ Ao fazer downgrade, você pode perder acesso a alguns recursos.
                  </p>
                )}
              </div>
              <div className="p-6 border-t border-[#2A3038] flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setSelectedPlan(null);
                  }}
                  disabled={processing}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleChangePlan}
                  disabled={processing}
                >
                  {processing ? 'Processando...' : 'Confirmar'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Cancelamento */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl w-full max-w-md">
              <div className="p-6 border-b border-[#2A3038]">
                <h3 className="text-xl font-semibold text-white">Cancelar Assinatura</h3>
              </div>
              <div className="p-6">
                <p className="text-[#D0D6DE] mb-4">
                  Tem certeza que deseja cancelar sua assinatura?
                </p>
                <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg p-4 mb-4">
                  <p className="text-[#EF4444] text-sm">
                    ⚠️ Ao cancelar, você perderá acesso aos recursos do sistema ao final do período atual.
                  </p>
                </div>
                <p className="text-[#7E8691] text-sm">
                  Seu acesso continuará até: <strong className="text-white">{subscription && formatDate(subscription.currentPeriodEnd)}</strong>
                </p>
              </div>
              <div className="p-6 border-t border-[#2A3038] flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCancelModal(false)}
                  disabled={processing}
                >
                  Manter Assinatura
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 !bg-[#EF4444] hover:!bg-[#DC2626]"
                  onClick={handleCancelSubscription}
                  disabled={processing}
                >
                  {processing ? 'Cancelando...' : 'Confirmar Cancelamento'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

