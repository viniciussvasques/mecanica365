'use client';

import { useState, useEffect } from 'react';
import { RocketIcon, CheckCircledIcon, StarIcon, Pencil1Icon, Cross2Icon, CheckIcon } from '@radix-ui/react-icons';
import { billingApi, Plan, tenantsApi, Tenant } from '@/lib/api';

// Helper para converter preço (string do Prisma Decimal ou número)
const toPrice = (value: string | number | undefined | null): number => {
  if (value === null || value === undefined) return 0;
  return typeof value === 'string' ? parseFloat(value) : value;
};

function PlanCard({ 
  plan, 
  count, 
  isPopular,
  onManageTenants 
}: Readonly<{ 
  plan: Plan; 
  count: number; 
  isPopular?: boolean;
  onManageTenants: () => void;
}>) {
  const monthlyPrice = toPrice(plan.price?.monthly);
  const yearlyPrice = toPrice(plan.price?.yearly ?? plan.price?.annual) || monthlyPrice * 10;
  const features = plan.features ?? plan.limits?.features ?? [];
  const description = plan.description ?? `Plano ${plan.name}`;

  return (
    <div className={`relative bg-[#12121A] border rounded-xl p-6 ${isPopular ? 'border-[#FF6B6B]' : 'border-[#1F1F28]'}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 bg-gradient-to-r from-[#FF6B6B] to-[#EE5A5A] rounded-full text-white text-xs font-medium flex items-center gap-1"><StarIcon className="w-3 h-3" />Popular</span>
        </div>
      )}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
        <p className="text-[#6B6B7E] text-sm mt-1">{description}</p>
      </div>
      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-3xl font-bold text-white">R$ {monthlyPrice.toFixed(2)}</span>
          <span className="text-[#6B6B7E]">/mês</span>
        </div>
        <p className="text-[#6B6B7E] text-sm mt-1">ou R$ {yearlyPrice.toFixed(2)}/ano</p>
      </div>
      <div className="mb-6">
        <div className="flex items-center justify-between py-2 border-b border-[#1F1F28]">
          <span className="text-[#8B8B9E]">Tenants ativos</span>
          <span className="text-white font-semibold">{count}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-[#1F1F28]">
          <span className="text-[#8B8B9E]">Limite de OS</span>
          <span className="text-white font-semibold">{plan.limits?.serviceOrdersLimit ?? '∞'}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-[#1F1F28]">
          <span className="text-[#8B8B9E]">Limite de Usuários</span>
          <span className="text-white font-semibold">{plan.limits?.usersLimit ?? '∞'}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-[#1F1F28]">
          <span className="text-[#8B8B9E]">Limite de Peças</span>
          <span className="text-white font-semibold">{plan.limits?.partsLimit ?? '∞'}</span>
        </div>
      </div>
      <div className="space-y-3 mb-6">
        {features.map((f) => (
          <div key={f} className="flex items-start gap-2"><CheckCircledIcon className="w-5 h-5 text-[#4ADE80] flex-shrink-0 mt-0.5" /><span className="text-[#8B8B9E] text-sm">{f}</span></div>
        ))}
      </div>
      <button
        onClick={onManageTenants}
        className="w-full py-2 px-4 bg-[#1F1F28] hover:bg-[#2A2A35] text-white rounded-lg transition-colors text-sm font-medium"
      >
        Ver Tenants ({count})
      </button>
    </div>
  );
}

function TenantPlanModal({ 
  tenant, 
  plans, 
  onClose, 
  onSave 
}: { 
  tenant: Tenant; 
  plans: Plan[]; 
  onClose: () => void; 
  onSave: (tenantId: string, newPlan: string) => Promise<void>;
}) {
  const [selectedPlan, setSelectedPlan] = useState(tenant.plan || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(tenant.id, selectedPlan);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-[#1F1F28]">
          <h3 className="text-lg font-semibold text-white">Alterar Plano</h3>
          <button onClick={onClose} className="text-[#6B6B7E] hover:text-white">
            <Cross2Icon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <p className="text-[#8B8B9E] text-sm mb-1">Tenant</p>
            <p className="text-white font-medium">{tenant.name}</p>
            <p className="text-[#6B6B7E] text-xs">{tenant.subdomain}</p>
          </div>
          <div>
            <label className="block text-[#8B8B9E] text-sm mb-2">Plano</label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full bg-[#1F1F28] border border-[#2A2A35] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6B6B]"
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - R$ {toPrice(plan.price?.monthly).toFixed(2)}/mês
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 p-4 border-t border-[#1F1F28]">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-[#1F1F28] hover:bg-[#2A2A35] text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || selectedPlan === tenant.plan}
            className="flex-1 py-2 px-4 bg-[#FF6B6B] hover:bg-[#EE5A5A] disabled:bg-[#FF6B6B]/50 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckIcon className="w-4 h-4" />
                Salvar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function TenantsListModal({
  planId,
  planName,
  tenants,
  plans,
  onClose,
  onEditTenant,
}: {
  planId: string;
  planName: string;
  tenants: Tenant[];
  plans: Plan[];
  onClose: () => void;
  onEditTenant: (tenant: Tenant) => void;
}) {
  const filteredTenants = tenants.filter(t => t.plan?.includes(planId));

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#1F1F28]">
          <h3 className="text-lg font-semibold text-white">Tenants no plano {planName}</h3>
          <button onClick={onClose} className="text-[#6B6B7E] hover:text-white">
            <Cross2Icon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {filteredTenants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#6B6B7E]">Nenhum tenant neste plano</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-3 bg-[#1F1F28] rounded-lg"
                >
                  <div>
                    <p className="text-white font-medium">{tenant.name}</p>
                    <p className="text-[#6B6B7E] text-sm">{tenant.subdomain} • {tenant.document}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      tenant.status === 'active' ? 'bg-[#4ADE80]/20 text-[#4ADE80]' :
                      tenant.status === 'suspended' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' :
                      'bg-[#EF4444]/20 text-[#EF4444]'
                    }`}>
                      {tenant.status}
                    </span>
                    <button
                      onClick={() => onEditTenant(tenant)}
                      className="p-2 text-[#6B6B7E] hover:text-white hover:bg-[#2A2A35] rounded-lg transition-colors"
                      title="Alterar plano"
                    >
                      <Pencil1Icon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-[#1F1F28]">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-[#1F1F28] hover:bg-[#2A2A35] text-white rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedPlanForList, setSelectedPlanForList] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [plansData, tenantsData] = await Promise.all([
        billingApi.getPlans().catch(() => [
          { id: 'workshops_starter', name: 'Starter', description: 'Para pequenas oficinas', price: { monthly: 99, annual: 990 }, limits: { serviceOrdersLimit: 50, usersLimit: 3, partsLimit: 100, features: ['basic_service_orders', 'basic_customers'] } },
          { id: 'workshops_professional', name: 'Professional', description: 'Para oficinas em crescimento', price: { monthly: 299, annual: 2990 }, limits: { serviceOrdersLimit: 500, usersLimit: 10, partsLimit: 1000, features: ['basic_service_orders', 'basic_customers', 'advanced_reports', 'multiple_locations', 'api_access'] } },
          { id: 'workshops_enterprise', name: 'Enterprise', description: 'Para grandes operações', price: { monthly: 999, annual: 9990 }, limits: { serviceOrdersLimit: null, usersLimit: null, partsLimit: null, features: ['basic_service_orders', 'basic_customers', 'advanced_reports', 'multiple_locations', 'api_access', 'white_label', 'priority_support', 'custom_integrations'] } },
        ]),
        tenantsApi.findAll(),
      ]);
      setPlans(plansData);
      setTenants(tenantsData);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePlan = async (tenantId: string, newPlan: string) => {
    try {
      await tenantsApi.update(tenantId, { plan: newPlan });
      await loadData();
    } catch (error) {
      console.error('Erro ao alterar plano:', error);
      throw error;
    }
  };

  const getCount = (planId: string) => tenants.filter(t => t.plan?.includes(planId)).length;
  const getRevenue = () => {
    let monthly = 0;
    tenants.filter(t => t.status === 'active').forEach(t => {
      const plan = plans.find(p => t.plan?.includes(p.id));
      if (plan?.price?.monthly) monthly += plan.price.monthly;
    });
    return { monthly, yearly: monthly * 12 };
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-10 h-10 border-4 border-[#FF6B6B]/20 border-t-[#FF6B6B] rounded-full animate-spin" /></div>;

  const revenue = getRevenue();
  const activeCount = tenants.filter(t => t.status === 'active').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Planos & Billing</h1>
        <p className="text-[#8B8B9E] mt-1">Gerencie os planos e assinaturas dos tenants</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2"><div className="p-2 bg-[#4ADE80]/20 rounded-lg"><RocketIcon className="w-5 h-5 text-[#4ADE80]" /></div><p className="text-[#6B6B7E] text-sm">Tenants Ativos</p></div>
          <p className="text-3xl font-bold text-white">{activeCount}</p>
        </div>
        <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2"><div className="p-2 bg-[#3B82F6]/20 rounded-lg"><RocketIcon className="w-5 h-5 text-[#3B82F6]" /></div><p className="text-[#6B6B7E] text-sm">MRR</p></div>
          <p className="text-3xl font-bold text-white">R$ {revenue.monthly.toFixed(2)}</p>
        </div>
        <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2"><div className="p-2 bg-[#A855F7]/20 rounded-lg"><RocketIcon className="w-5 h-5 text-[#A855F7]" /></div><p className="text-[#6B6B7E] text-sm">ARR</p></div>
          <p className="text-3xl font-bold text-white">R$ {revenue.yearly.toFixed(2)}</p>
        </div>
        <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2"><div className="p-2 bg-[#FF6B6B]/20 rounded-lg"><RocketIcon className="w-5 h-5 text-[#FF6B6B]" /></div><p className="text-[#6B6B7E] text-sm">Ticket Médio</p></div>
          <p className="text-3xl font-bold text-white">R$ {activeCount > 0 ? (revenue.monthly / activeCount).toFixed(2) : '0.00'}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Planos Disponíveis</h2>
          <p className="text-[#6B6B7E] text-sm">Os planos são configurados no sistema. Clique para ver os tenants de cada plano.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard 
              key={plan.id} 
              plan={plan} 
              count={getCount(plan.id)} 
              isPopular={!!plan.highlightText}
              onManageTenants={() => setSelectedPlanForList({ id: plan.id, name: plan.name })}
            />
          ))}
        </div>
      </div>

      <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Distribuição por Plano</h2>
        <div className="space-y-4">
          {plans.map((plan, i) => {
            const count = getCount(plan.id);
            const pct = tenants.length ? (count / tenants.length) * 100 : 0;
            const colors = ['bg-[#3B82F6]', 'bg-[#A855F7]', 'bg-[#FF6B6B]'];
            return (
              <div key={plan.id}>
                <div className="flex justify-between text-sm mb-1"><span className="text-[#8B8B9E]">{plan.name}</span><span className="text-white">{count} ({pct.toFixed(1)}%)</span></div>
                <div className="h-2 bg-[#1F1F28] rounded-full overflow-hidden"><div className={`h-full ${colors[i % colors.length]} rounded-full transition-all`} style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabela de todos os tenants */}
      <div className="bg-[#12121A] border border-[#1F1F28] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#1F1F28]">
          <h2 className="text-lg font-semibold text-white">Todos os Tenants</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#1F1F28]">
                <th className="text-left text-[#8B8B9E] text-sm font-medium px-4 py-3">Tenant</th>
                <th className="text-left text-[#8B8B9E] text-sm font-medium px-4 py-3">Subdomain</th>
                <th className="text-left text-[#8B8B9E] text-sm font-medium px-4 py-3">Plano</th>
                <th className="text-left text-[#8B8B9E] text-sm font-medium px-4 py-3">Status</th>
                <th className="text-left text-[#8B8B9E] text-sm font-medium px-4 py-3">Valor</th>
                <th className="text-right text-[#8B8B9E] text-sm font-medium px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => {
                const tenantPlan = plans.find(p => tenant.plan?.includes(p.id));
                return (
                  <tr key={tenant.id} className="border-t border-[#1F1F28] hover:bg-[#1F1F28]/50">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{tenant.name}</p>
                      <p className="text-[#6B6B7E] text-xs">{tenant.document}</p>
                    </td>
                    <td className="px-4 py-3 text-[#8B8B9E]">{tenant.subdomain}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-[#2A2A35] text-white rounded text-sm">
                        {tenantPlan?.name || tenant.plan || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        tenant.status === 'active' ? 'bg-[#4ADE80]/20 text-[#4ADE80]' :
                        tenant.status === 'suspended' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' :
                        tenant.status === 'pending' ? 'bg-[#3B82F6]/20 text-[#3B82F6]' :
                        'bg-[#EF4444]/20 text-[#EF4444]'
                      }`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white">
                      R$ {toPrice(tenantPlan?.price?.monthly).toFixed(2)}/mês
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedTenant(tenant)}
                        className="p-2 text-[#6B6B7E] hover:text-white hover:bg-[#2A2A35] rounded-lg transition-colors"
                        title="Alterar plano"
                      >
                        <Pencil1Icon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de alterar plano */}
      {selectedTenant && (
        <TenantPlanModal
          tenant={selectedTenant}
          plans={plans}
          onClose={() => setSelectedTenant(null)}
          onSave={handleChangePlan}
        />
      )}

      {/* Modal de lista de tenants por plano */}
      {selectedPlanForList && (
        <TenantsListModal
          planId={selectedPlanForList.id}
          planName={selectedPlanForList.name}
          tenants={tenants}
          plans={plans}
          onClose={() => setSelectedPlanForList(null)}
          onEditTenant={(tenant) => {
            setSelectedPlanForList(null);
            setSelectedTenant(tenant);
          }}
        />
      )}
    </div>
  );
}
