'use client';

import { useState, useEffect, useCallback } from 'react';
import { plansApi, Plan, CreatePlanDto } from '@/lib/api';
import { PlusIcon, Pencil1Icon, TrashIcon, CheckCircledIcon, CrossCircledIcon, StarFilledIcon } from '@radix-ui/react-icons';

// Lista de features disponíveis
const AVAILABLE_FEATURES = [
  { code: 'basic_service_orders', label: 'Ordens de Serviço Básicas' },
  { code: 'basic_customers', label: 'Clientes Básicos' },
  { code: 'advanced_reports', label: 'Relatórios Avançados' },
  { code: 'multiple_locations', label: 'Múltiplas Localizações' },
  { code: 'api_access', label: 'Acesso à API' },
  { code: 'white_label', label: 'White Label' },
  { code: 'priority_support', label: 'Suporte Prioritário' },
  { code: 'custom_integrations', label: 'Integrações Customizadas' },
  { code: 'elevators', label: 'Elevadores' },
  { code: 'inventory', label: 'Inventário' },
  { code: 'quotes', label: 'Orçamentos' },
  { code: 'appointments', label: 'Agendamentos' },
  { code: 'invoices', label: 'Faturas' },
  { code: 'payments', label: 'Pagamentos' },
  { code: 'automations', label: 'Automações' },
];

interface PlanFormData {
  code: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  serviceOrdersLimit: number | null;
  partsLimit: number | null;
  usersLimit: number | null;
  features: string[];
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  highlightText: string;
}

const initialFormData: PlanFormData = {
  code: '',
  name: '',
  description: '',
  monthlyPrice: 0,
  annualPrice: 0,
  serviceOrdersLimit: null,
  partsLimit: null,
  usersLimit: null,
  features: [],
  isActive: true,
  isDefault: false,
  sortOrder: 0,
  highlightText: '',
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<{
    totalPlans: number;
    activePlans: number;
    totalSubscriptions: number;
    subscriptionsByPlan: Array<{ planId: string; planName: string; count: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [plansData, statsData] = await Promise.all([
        plansApi.findAll(includeInactive),
        plansApi.getStats(),
      ]);
      setPlans(plansData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      ...initialFormData,
      sortOrder: plans.length + 1,
    });
    setShowModal(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      code: plan.code ?? plan.id,
      name: plan.name,
      description: plan.description ?? '',
      monthlyPrice: plan.monthlyPrice ?? plan.price?.monthly ?? 0,
      annualPrice: plan.annualPrice ?? plan.price?.annual ?? 0,
      serviceOrdersLimit: plan.serviceOrdersLimit ?? plan.limits?.serviceOrdersLimit ?? null,
      partsLimit: plan.partsLimit ?? plan.limits?.partsLimit ?? null,
      usersLimit: plan.usersLimit ?? plan.limits?.usersLimit ?? null,
      features: plan.features ?? plan.limits?.features ?? [],
      isActive: plan.isActive ?? true,
      isDefault: plan.isDefault ?? false,
      sortOrder: plan.sortOrder ?? 0,
      highlightText: plan.highlightText ?? '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPlan(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data: CreatePlanDto = {
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        monthlyPrice: formData.monthlyPrice,
        annualPrice: formData.annualPrice,
        serviceOrdersLimit: formData.serviceOrdersLimit,
        partsLimit: formData.partsLimit,
        usersLimit: formData.usersLimit,
        features: formData.features,
        isActive: formData.isActive,
        isDefault: formData.isDefault,
        sortOrder: formData.sortOrder,
        highlightText: formData.highlightText || undefined,
      };

      if (editingPlan) {
        await plansApi.update(editingPlan.id, data);
      } else {
        await plansApi.create(data);
      }

      await loadData();
      closeModal();
    } catch (err) {
      console.error('Erro ao salvar plano:', err);
      setError('Erro ao salvar plano');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plan: Plan) => {
    if (!confirm(`Tem certeza que deseja excluir o plano "${plan.name}"?`)) {
      return;
    }

    try {
      await plansApi.remove(plan.id);
      await loadData();
    } catch (err) {
      console.error('Erro ao excluir plano:', err);
      setError('Erro ao excluir plano. Verifique se não há assinaturas ativas.');
    }
  };

  const toggleFeature = (featureCode: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(featureCode)
        ? prev.features.filter(f => f !== featureCode)
        : [...prev.features, featureCode],
    }));
  };

  const getSubscriptionCount = (planId: string) => {
    return stats?.subscriptionsByPlan.find(s => s.planId === planId)?.count ?? 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4ADE80]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gerenciar Planos</h1>
          <p className="text-[#6B6B7E] mt-1">Configure os planos de assinatura disponíveis</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#4ADE80] text-black font-medium rounded-lg hover:bg-[#22C55E] transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Novo Plano
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#1A1A2E] border border-[#2D2D3B] rounded-xl p-4">
            <p className="text-[#6B6B7E] text-sm">Total de Planos</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.totalPlans}</p>
          </div>
          <div className="bg-[#1A1A2E] border border-[#2D2D3B] rounded-xl p-4">
            <p className="text-[#6B6B7E] text-sm">Planos Ativos</p>
            <p className="text-2xl font-bold text-[#4ADE80] mt-1">{stats.activePlans}</p>
          </div>
          <div className="bg-[#1A1A2E] border border-[#2D2D3B] rounded-xl p-4">
            <p className="text-[#6B6B7E] text-sm">Total de Assinaturas</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.totalSubscriptions}</p>
          </div>
          <div className="bg-[#1A1A2E] border border-[#2D2D3B] rounded-xl p-4">
            <p className="text-[#6B6B7E] text-sm">Receita Mensal Est.</p>
            <p className="text-2xl font-bold text-[#4ADE80] mt-1">
              R$ {plans.reduce((acc, plan) => {
                const count = getSubscriptionCount(plan.id);
                const price = plan.monthlyPrice ?? plan.price?.monthly ?? 0;
                return acc + (count * price);
              }, 0).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-[#8B8B9E]">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="w-4 h-4 rounded border-[#2D2D3B] bg-[#0D0D15] text-[#4ADE80] focus:ring-[#4ADE80]"
          />
          Mostrar planos inativos
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-[#1A1A2E] border rounded-xl p-6 relative ${
              plan.highlightText ? 'border-[#4ADE80]' : 'border-[#2D2D3B]'
            } ${!plan.isActive ? 'opacity-60' : ''}`}
          >
            {/* Highlight Badge */}
            {plan.highlightText && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#4ADE80] text-black text-xs font-bold px-3 py-1 rounded-full">
                  {plan.highlightText}
                </span>
              </div>
            )}

            {/* Default Badge */}
            {plan.isDefault && (
              <div className="absolute top-4 right-4">
                <StarFilledIcon className="w-5 h-5 text-yellow-500" />
              </div>
            )}

            {/* Status Badge */}
            <div className="flex items-center gap-2 mb-4">
              {plan.isActive ? (
                <span className="flex items-center gap-1 text-xs text-[#4ADE80]">
                  <CheckCircledIcon className="w-4 h-4" />
                  Ativo
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-red-400">
                  <CrossCircledIcon className="w-4 h-4" />
                  Inativo
                </span>
              )}
              <span className="text-xs text-[#6B6B7E]">
                Ordem: {plan.sortOrder}
              </span>
            </div>

            {/* Plan Info */}
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <p className="text-[#6B6B7E] text-sm mt-1">{plan.description ?? `Código: ${plan.code ?? plan.id}`}</p>
            </div>

            {/* Price */}
            <div className="text-center mb-4">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold text-white">
                  R$ {(plan.monthlyPrice ?? plan.price?.monthly ?? 0).toFixed(2)}
                </span>
                <span className="text-[#6B6B7E]">/mês</span>
              </div>
              <p className="text-[#6B6B7E] text-sm mt-1">
                ou R$ {(plan.annualPrice ?? plan.price?.annual ?? 0).toFixed(2)}/ano
              </p>
            </div>

            {/* Limits */}
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between text-[#8B8B9E]">
                <span>Ordens de Serviço:</span>
                <span className="text-white">
                  {(plan.serviceOrdersLimit ?? plan.limits?.serviceOrdersLimit) ?? 'Ilimitado'}
                </span>
              </div>
              <div className="flex justify-between text-[#8B8B9E]">
                <span>Usuários:</span>
                <span className="text-white">
                  {(plan.usersLimit ?? plan.limits?.usersLimit) ?? 'Ilimitado'}
                </span>
              </div>
              <div className="flex justify-between text-[#8B8B9E]">
                <span>Peças:</span>
                <span className="text-white">
                  {(plan.partsLimit ?? plan.limits?.partsLimit) ?? 'Ilimitado'}
                </span>
              </div>
            </div>

            {/* Features */}
            <div className="mb-4">
              <p className="text-xs text-[#6B6B7E] mb-2">Features ({(plan.features ?? plan.limits?.features ?? []).length}):</p>
              <div className="flex flex-wrap gap-1">
                {(plan.features ?? plan.limits?.features ?? []).slice(0, 4).map((f) => (
                  <span key={f} className="text-xs bg-[#2D2D3B] text-[#8B8B9E] px-2 py-1 rounded">
                    {f}
                  </span>
                ))}
                {(plan.features ?? plan.limits?.features ?? []).length > 4 && (
                  <span className="text-xs text-[#6B6B7E]">
                    +{(plan.features ?? plan.limits?.features ?? []).length - 4} mais
                  </span>
                )}
              </div>
            </div>

            {/* Subscription Count */}
            <div className="text-center mb-4 py-2 bg-[#0D0D15] rounded-lg">
              <span className="text-[#6B6B7E] text-sm">
                {getSubscriptionCount(plan.id)} assinaturas ativas
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => openEditModal(plan)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#2D2D3B] text-white rounded-lg hover:bg-[#3D3D4B] transition-colors"
              >
                <Pencil1Icon className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => handleDelete(plan)}
                className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                title="Excluir plano"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {plans.length === 0 && (
        <div className="text-center py-12 bg-[#1A1A2E] border border-[#2D2D3B] rounded-xl">
          <p className="text-[#6B6B7E] mb-4">Nenhum plano cadastrado</p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#4ADE80] text-black font-medium rounded-lg hover:bg-[#22C55E] transition-colors"
          >
            Criar Primeiro Plano
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A2E] border border-[#2D2D3B] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2D2D3B]">
              <h2 className="text-xl font-bold text-white">
                {editingPlan ? 'Editar Plano' : 'Novo Plano'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#8B8B9E] mb-2">
                    Código *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-2 bg-[#0D0D15] border border-[#2D2D3B] rounded-lg text-white focus:border-[#4ADE80] focus:outline-none"
                    placeholder="workshops_starter"
                    required
                    disabled={!!editingPlan}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8B8B9E] mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-[#0D0D15] border border-[#2D2D3B] rounded-lg text-white focus:border-[#4ADE80] focus:outline-none"
                    placeholder="Starter"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8B8B9E] mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0D0D15] border border-[#2D2D3B] rounded-lg text-white focus:border-[#4ADE80] focus:outline-none"
                  rows={2}
                  placeholder="Para pequenas oficinas que estão começando"
                />
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#8B8B9E] mb-2">
                    Preço Mensal (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monthlyPrice}
                    onChange={(e) => setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-[#0D0D15] border border-[#2D2D3B] rounded-lg text-white focus:border-[#4ADE80] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8B8B9E] mb-2">
                    Preço Anual (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.annualPrice}
                    onChange={(e) => setFormData({ ...formData, annualPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-[#0D0D15] border border-[#2D2D3B] rounded-lg text-white focus:border-[#4ADE80] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Limits */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#8B8B9E] mb-2">
                    Limite de OS
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.serviceOrdersLimit ?? ''}
                    onChange={(e) => setFormData({ ...formData, serviceOrdersLimit: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-4 py-2 bg-[#0D0D15] border border-[#2D2D3B] rounded-lg text-white focus:border-[#4ADE80] focus:outline-none"
                    placeholder="Ilimitado"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8B8B9E] mb-2">
                    Limite de Usuários
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.usersLimit ?? ''}
                    onChange={(e) => setFormData({ ...formData, usersLimit: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-4 py-2 bg-[#0D0D15] border border-[#2D2D3B] rounded-lg text-white focus:border-[#4ADE80] focus:outline-none"
                    placeholder="Ilimitado"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8B8B9E] mb-2">
                    Limite de Peças
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.partsLimit ?? ''}
                    onChange={(e) => setFormData({ ...formData, partsLimit: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-4 py-2 bg-[#0D0D15] border border-[#2D2D3B] rounded-lg text-white focus:border-[#4ADE80] focus:outline-none"
                    placeholder="Ilimitado"
                  />
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-[#8B8B9E] mb-2">
                  Features Incluídas
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-4 bg-[#0D0D15] rounded-lg border border-[#2D2D3B]">
                  {AVAILABLE_FEATURES.map((feature) => (
                    <label key={feature.code} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.features.includes(feature.code)}
                        onChange={() => toggleFeature(feature.code)}
                        className="w-4 h-4 rounded border-[#2D2D3B] bg-[#0D0D15] text-[#4ADE80] focus:ring-[#4ADE80]"
                      />
                      <span className="text-sm text-[#8B8B9E]">{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#8B8B9E] mb-2">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-[#0D0D15] border border-[#2D2D3B] rounded-lg text-white focus:border-[#4ADE80] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8B8B9E] mb-2">
                    Texto de Destaque
                  </label>
                  <input
                    type="text"
                    value={formData.highlightText}
                    onChange={(e) => setFormData({ ...formData, highlightText: e.target.value })}
                    className="w-full px-4 py-2 bg-[#0D0D15] border border-[#2D2D3B] rounded-lg text-white focus:border-[#4ADE80] focus:outline-none"
                    placeholder="Popular, Recomendado..."
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-[#2D2D3B] bg-[#0D0D15] text-[#4ADE80] focus:ring-[#4ADE80]"
                  />
                  <span className="text-sm text-[#8B8B9E]">Plano Ativo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded border-[#2D2D3B] bg-[#0D0D15] text-[#4ADE80] focus:ring-[#4ADE80]"
                  />
                  <span className="text-sm text-[#8B8B9E]">Plano Padrão para Novos Tenants</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t border-[#2D2D3B]">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-[#2D2D3B] text-white rounded-lg hover:bg-[#3D3D4B] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-[#4ADE80] text-black font-medium rounded-lg hover:bg-[#22C55E] transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : editingPlan ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

