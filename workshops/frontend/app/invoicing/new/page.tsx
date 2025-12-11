'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { invoicingApi, CreateInvoiceDto, InvoiceType, InvoiceItemType, InvoiceItem, PaymentPreference } from '@/lib/api/invoicing';
import { customersApi, Customer } from '@/lib/api/customers';
import { serviceOrdersApi, ServiceOrder } from '@/lib/api/service-orders';
import { paymentGatewaysApi, PaymentGatewayConfig, GatewayType } from '@/lib/api/payment-gateways';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useNotification } from '@/components/NotificationProvider';
import { logger } from '@/lib/utils/logger';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function NewInvoicePage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [formData, setFormData] = useState<CreateInvoiceDto>({
    type: InvoiceType.SERVICE,
    items: [],
    discount: 0,
    taxAmount: 0,
    paymentPreference: PaymentPreference.MANUAL,
  });
  const [editingItem, setEditingItem] = useState<Partial<InvoiceItem>>({
    type: InvoiceItemType.SERVICE,
    name: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
  });
  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.customerId) {
      loadServiceOrders(formData.customerId);
    } else {
      setServiceOrders([]);
    }
  }, [formData.customerId]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      const [customersResponse, gatewaysResponse] = await Promise.all([
        customersApi.findAll({ limit: 100 }),
        paymentGatewaysApi.findAll().catch(() => []),
      ]);
      setCustomers(customersResponse.data);
      setGateways(gatewaysResponse);
    } catch (err: unknown) {
      logger.error('Erro ao carregar dados:', err);
      showNotification('Erro ao carregar dados', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  const loadServiceOrders = async (customerId: string) => {
    try {
      const response = await serviceOrdersApi.findAll({ customerId, limit: 100 });
      setServiceOrders(response.data);
    } catch (err: unknown) {
      logger.error('Erro ao carregar ordens de serviço:', err);
    }
  };

  const addItem = () => {
    if (!editingItem.name || !editingItem.unitPrice || editingItem.quantity === 0) {
      setErrors({ items: 'Preencha nome, quantidade e preço unitário do item' });
      return;
    }

    const totalPrice = (editingItem.quantity || 1) * (editingItem.unitPrice || 0);
    const newItem: InvoiceItem = {
      type: editingItem.type || InvoiceItemType.SERVICE,
      name: editingItem.name || '',
      description: editingItem.description,
      quantity: editingItem.quantity || 1,
      unitPrice: editingItem.unitPrice || 0,
      totalPrice,
    };

    setFormData({
      ...formData,
      items: [...formData.items, newItem],
    });

    setEditingItem({
      type: InvoiceItemType.SERVICE,
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    });
    setErrors({});
  };

  const removeItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    const itemsTotal = formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
    return itemsTotal - (formData.discount || 0) + (formData.taxAmount || 0);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const onlineGateways = gateways.filter(
      gateway => gateway.type !== GatewayType.PHYSICAL_TERMINAL && gateway.isActive,
    );
    const terminalGateways = gateways.filter(
      gateway => gateway.type === GatewayType.PHYSICAL_TERMINAL && gateway.isActive,
    );

    if (!formData.customerId && !formData.serviceOrderId) {
      newErrors.customerId = 'Cliente ou Ordem de Serviço é obrigatório';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'Adicione pelo menos um item à fatura';
    }

    if (
      formData.paymentPreference === PaymentPreference.ONLINE_GATEWAY &&
      onlineGateways.length > 0 &&
      !formData.paymentGatewayId
    ) {
      newErrors.paymentPreference = 'Selecione um gateway online';
    }

    if (
      formData.paymentPreference === PaymentPreference.POS_TERMINAL &&
      terminalGateways.length > 0 &&
      !formData.paymentGatewayId
    ) {
      newErrors.paymentPreference = 'Selecione uma maquininha configurada';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showNotification('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const total = calculateTotal();
      const data: CreateInvoiceDto = {
        ...formData,
        total,
        paymentGatewayId:
          formData.paymentPreference === PaymentPreference.MANUAL
            ? undefined
            : formData.paymentGatewayId,
      };

      const invoice = await invoicingApi.create(data);
      showNotification('Fatura criada com sucesso!', 'success');
      router.push(`/invoicing/${invoice.id}`);
    } catch (err: unknown) {
      logger.error('Erro ao criar fatura:', err);
      let errorMessage = 'Erro ao criar fatura';
      
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string | string[] } } };
        if (axiosError.response?.data?.message) {
          const message = axiosError.response.data.message;
          errorMessage = Array.isArray(message) ? message.join(', ') : message;
        }
      }
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto"></div>
            <p className="mt-4 text-[#7E8691]">Carregando dados...</p>
          </div>
        </div>
      </div>
    );
  }

  const onlineGateways = gateways.filter(
    (gateway) => gateway.type !== GatewayType.PHYSICAL_TERMINAL && gateway.isActive,
  );
  const terminalGateways = gateways.filter(
    (gateway) => gateway.type === GatewayType.PHYSICAL_TERMINAL && gateway.isActive,
  );

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#D0D6DE] mb-2">Nova Fatura</h1>
          <p className="text-[#7E8691]">Preencha os dados para criar uma nova fatura.</p>
        </div>

        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cliente e Ordem de Serviço */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Cliente"
                value={formData.customerId || ''}
                onChange={(e) => {
                  setFormData({ ...formData, customerId: e.target.value || undefined, serviceOrderId: undefined });
                  setErrors({ ...errors, customerId: '' });
                }}
                options={[
                  { value: '', label: 'Selecione um cliente' },
                  ...customers.map(customer => ({ value: customer.id, label: customer.name })),
                ]}
                error={errors.customerId}
              />
              <Select
                label="Ordem de Serviço (Opcional)"
                value={formData.serviceOrderId || ''}
                onChange={(e) => {
                  setFormData({ ...formData, serviceOrderId: e.target.value || undefined });
                }}
                disabled={!formData.customerId}
                options={[
                  { value: '', label: 'Nenhuma' },
                  ...serviceOrders.map(so => ({ value: so.id, label: `OS-${so.number}` })),
                ]}
              />
            </div>

            {/* Tipo */}
            <Select
              label="Tipo de Fatura"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as InvoiceType })}
              options={[
                { value: InvoiceType.SERVICE, label: 'Serviço' },
                { value: InvoiceType.SALE, label: 'Venda' },
                { value: InvoiceType.PART, label: 'Peça' },
              ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Preferência de Pagamento"
                value={formData.paymentPreference || PaymentPreference.MANUAL}
                onChange={(e) => {
                  const preference = e.target.value as PaymentPreference;
                  setFormData({
                    ...formData,
                    paymentPreference: preference,
                    paymentGatewayId: undefined,
                  });
                  setErrors({ ...errors, paymentPreference: '' });
                }}
                options={[
                  { value: PaymentPreference.MANUAL, label: 'Sem cobrança automática' },
                  { value: PaymentPreference.ONLINE_GATEWAY, label: 'Gateway Online' },
                  { value: PaymentPreference.POS_TERMINAL, label: 'Maquininha Física' },
                ]}
              />

              {formData.paymentPreference === PaymentPreference.ONLINE_GATEWAY && (
                <Select
                  label="Gateway Online"
                  value={formData.paymentGatewayId || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentGatewayId: e.target.value || undefined })
                  }
                  disabled={onlineGateways.length === 0}
                  options={[
                    { value: '', label: onlineGateways.length > 0 ? 'Selecione um gateway' : 'Nenhum gateway disponível' },
                    ...onlineGateways.map((gateway) => ({
                      value: gateway.id,
                      label: gateway.name,
                    })),
                  ]}
                />
              )}

              {formData.paymentPreference === PaymentPreference.POS_TERMINAL && (
                <Select
                  label="Maquininha Física"
                  value={formData.paymentGatewayId || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentGatewayId: e.target.value || undefined })
                  }
                  disabled={terminalGateways.length === 0}
                  options={[
                    { value: '', label: terminalGateways.length > 0 ? 'Selecione uma maquininha' : 'Nenhuma maquininha disponível' },
                    ...terminalGateways.map((gateway) => ({
                      value: gateway.id,
                      label: gateway.name,
                    })),
                  ]}
                />
              )}
            </div>
            {errors.paymentPreference && (
              <p className="text-sm text-[#FF4E3D]">{errors.paymentPreference}</p>
            )}
            {formData.paymentPreference === PaymentPreference.ONLINE_GATEWAY && onlineGateways.length === 0 && (
              <p className="text-sm text-[#F59E0B]">
                Configure um gateway online em <Link href="/payments/settings" className="text-[#00E0B8] underline">Pagamentos &gt; Configurações</Link>.
              </p>
            )}
            {formData.paymentPreference === PaymentPreference.POS_TERMINAL && terminalGateways.length === 0 && (
              <p className="text-sm text-[#F59E0B]">
                Configure uma maquininha física em <Link href="/payments/settings" className="text-[#00E0B8] underline">Pagamentos &gt; Configurações</Link>.
              </p>
            )}

            {/* Itens */}
            <div>
              <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Itens da Fatura</h2>
              
              {/* Formulário para adicionar item */}
              <div className="bg-[#0F1115] border border-[#2A3038] rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-3">
                    <Select
                      label="Tipo"
                      value={editingItem.type || InvoiceItemType.SERVICE}
                      onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value as InvoiceItemType })}
                      options={[
                        { value: InvoiceItemType.SERVICE, label: 'Serviço' },
                        { value: InvoiceItemType.PART, label: 'Peça' },
                      ]}
                    />
                  </div>
                  <div className="md:col-span-4">
                    <Input
                      label="Nome"
                      value={editingItem.name || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      placeholder="Nome do item"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label="Quantidade"
                      type="number"
                      min="1"
                      value={editingItem.quantity || 1}
                      onChange={(e) => {
                        const quantity = Number.parseInt(e.target.value, 10) || 1;
                        const unitPrice = editingItem.unitPrice || 0;
                        setEditingItem({ ...editingItem, quantity, totalPrice: quantity * unitPrice });
                      }}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label="Preço Unitário"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingItem.unitPrice || 0}
                      onChange={(e) => {
                        const unitPrice = Number.parseFloat(e.target.value) || 0;
                        const quantity = editingItem.quantity || 1;
                        setEditingItem({ ...editingItem, unitPrice, totalPrice: quantity * unitPrice });
                      }}
                      id="item-unit-price"
                      required
                    />
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={addItem}
                      className="w-full"
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div className="mt-2">
                  <Input
                    label="Descrição (Opcional)"
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    placeholder="Descrição do item"
                  />
                </div>
                {(editingItem.totalPrice || 0) > 0 && (
                  <div className="mt-2 text-right">
                    <p className="text-sm text-[#7E8691]">
                      Total: <span className="text-[#00E0B8] font-semibold">{formatCurrency(editingItem.totalPrice || 0)}</span>
                    </p>
                  </div>
                )}
              </div>

              {errors.items && (
                <p className="text-sm text-[#FF4E3D] mb-2">{errors.items}</p>
              )}

              {/* Lista de itens */}
              {formData.items.length > 0 && (
                <div className="space-y-2">
                  {formData.items.map((item, itemIndex) => (
                    <div key={item.id || `${item.name}-${item.type}-${itemIndex}-${item.quantity}-${item.unitPrice}`} className="bg-[#0F1115] border border-[#2A3038] rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[#D0D6DE] font-medium">{item.name}</span>
                            <span className="text-xs text-[#7E8691] px-2 py-0.5 bg-[#2A3038] rounded">
                              {item.type === InvoiceItemType.SERVICE ? 'Serviço' : 'Peça'}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-sm text-[#7E8691] mb-2">{item.description}</p>
                          )}
                          <p className="text-sm text-[#7E8691]">
                            {item.quantity} × {formatCurrency(item.unitPrice)} = {formatCurrency(item.totalPrice)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(itemIndex)}
                          className="text-[#FF4E3D] border-[#FF4E3D] hover:bg-[#FF4E3D]/10"
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totais */}
            <div className="bg-[#0F1115] border border-[#2A3038] rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#7E8691]">Subtotal:</span>
                  <span className="text-[#D0D6DE]">
                    {formatCurrency(formData.items.reduce((sum, item) => sum + item.totalPrice, 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#7E8691]">Desconto:</span>
                  <Input
                    label=""
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount || 0}
                    onChange={(e) => setFormData({ ...formData, discount: Number.parseFloat(e.target.value) || 0 })}
                    className="w-32"
                  />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#7E8691]">Impostos:</span>
                  <Input
                    label=""
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.taxAmount || 0}
                    onChange={(e) => setFormData({ ...formData, taxAmount: Number.parseFloat(e.target.value) || 0 })}
                    className="w-32"
                  />
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-[#2A3038] pt-2 mt-2">
                  <span className="text-[#D0D6DE]">Total:</span>
                  <span className="text-[#00E0B8]">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>

            {/* Data de Vencimento */}
            <Input
              label="Data de Vencimento"
              type="date"
              value={formData.dueDate || ''}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value || undefined })}
            />

            {/* Botões */}
            <div className="flex justify-end space-x-4 mt-6">
              <Link href="/invoicing">
                <Button variant="secondary" type="button">
                  Cancelar
                </Button>
              </Link>
              <Button variant="primary" type="submit" isLoading={loading}>
                {loading ? 'Salvando...' : 'Criar Fatura'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

