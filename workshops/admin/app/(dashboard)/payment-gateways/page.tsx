'use client';

import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  CheckIcon, 
  Cross2Icon, 
  GearIcon, 
  TrashIcon,
  CardStackIcon,
} from '@radix-ui/react-icons';
import api from '@/lib/api';

interface PaymentGateway {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
}

interface GatewayFormData {
  name: string;
  type: string;
  isActive: boolean;
  credentials: {
    apiKey?: string;
    secretKey?: string;
    publicKey?: string;
    webhookSecret?: string;
  };
  settings?: Record<string, any>;
}

export default function PaymentGatewaysPage() {
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<GatewayFormData>({
    name: '',
    type: 'stripe',
    isActive: true,
    credentials: {},
    settings: {},
  });

  useEffect(() => {
    loadGateways();
  }, []);

  const loadGateways = async () => {
    try {
      const response = await api.get('/admin/system-payment');
      setGateways(response.data);
    } catch (error) {
      console.error('Erro ao carregar gateways:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await api.patch(`/admin/system-payment/${editingId}`, formData);
      } else {
        await api.post('/admin/system-payment', formData);
      }
      
      await loadGateways();
      resetForm();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar gateway');
    }
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    try {
      const response = await api.post(`/admin/system-payment/${id}/test`);
      
      if (response.data.success) {
        alert('✅ Conexão testada com sucesso!');
      } else {
        alert(`❌ Falha no teste: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Erro ao testar:', error);
      alert('Erro ao testar conexão');
    } finally {
      setTesting(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.patch(`/admin/system-payment/${id}/default`);
      await loadGateways();
    } catch (error) {
      console.error('Erro ao definir padrão:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este gateway?')) return;
    
    try {
      await api.delete(`/admin/system-payment/${id}`);
      await loadGateways();
    } catch (error) {
      console.error('Erro ao remover:', error);
    }
  };

  const handleEdit = (gateway: PaymentGateway) => {
    setEditingId(gateway.id);
    setFormData({
      name: gateway.name,
      type: gateway.type,
      isActive: gateway.isActive,
      credentials: {},
      settings: {},
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'stripe',
      isActive: true,
      credentials: {},
      settings: {},
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getGatewayIcon = (type: string) => {
    return <CardStackIcon className="w-8 h-8" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Payment Gateways</h1>
          <p className="text-gray-300 mt-1">Configure os gateways de pagamento</p>
        </div>
        
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="w-5 h-5" />
            Novo Gateway
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-white">
            {editingId ? 'Editar Gateway' : 'Novo Gateway'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Stripe Produção"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="stripe">Stripe</option>
                  <option value="mercadopago">Mercado Pago</option>
                  <option value="pagseguro">PagSeguro</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
            </div>

            {formData.type === 'stripe' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    Secret Key
                  </label>
                  <input
                    type="password"
                    value={formData.credentials.secretKey || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      credentials: { ...formData.credentials, secretKey: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="sk_..."
                    required={!editingId}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    Publishable Key
                  </label>
                  <input
                    type="text"
                    value={formData.credentials.publicKey || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      credentials: { ...formData.credentials, publicKey: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="pk_..."
                    required={!editingId}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    Webhook Secret
                  </label>
                  <input
                    type="password"
                    value={formData.credentials.webhookSecret || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      credentials: { ...formData.credentials, webhookSecret: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="whsec_..."
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-200">
                Gateway ativo
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                {editingId ? 'Atualizar' : 'Criar Gateway'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {gateways.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow p-12 text-center">
            <CardStackIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Nenhum gateway configurado
            </h3>
            <p className="text-gray-300 mb-4">
              Configure um gateway de pagamento para aceitar pagamentos
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="w-5 h-5" />
              Adicionar Gateway
            </button>
          </div>
        ) : (
          gateways.map((gateway) => (
            <div
              key={gateway.id}
              className="bg-gray-800 border border-gray-700 rounded-lg shadow p-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-900/50 rounded-lg">
                  {getGatewayIcon(gateway.type)}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{gateway.name}</h3>
                    {gateway.isDefault && (
                      <span className="px-2 py-1 bg-green-900/50 text-green-400 text-xs font-medium rounded border border-green-700">
                        Padrão
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 capitalize">{gateway.type}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {gateway.isActive ? (
                  <span className="flex items-center gap-1 text-green-400 text-sm font-medium">
                    <CheckIcon className="w-4 h-4" />
                    Ativo
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-400 text-sm font-medium">
                    <Cross2Icon className="w-4 h-4" />
                    Inativo
                  </span>
                )}

                <button
                  onClick={() => handleTest(gateway.id)}
                  disabled={testing === gateway.id}
                  className="px-3 py-1 text-sm border border-blue-500 text-blue-400 rounded hover:bg-blue-900/30 disabled:opacity-50"
                >
                  {testing === gateway.id ? 'Testando...' : 'Testar'}
                </button>

                {!gateway.isDefault && (
                  <button
                    onClick={() => handleSetDefault(gateway.id)}
                    className="px-3 py-1 text-sm border border-gray-600 text-gray-300 rounded hover:bg-gray-700"
                  >
                    Definir Padrão
                  </button>
                )}

                <button
                  onClick={() => handleEdit(gateway)}
                  className="p-2 text-gray-300 hover:bg-gray-700 rounded"
                >
                  <GearIcon className="w-5 h-5" />
                </button>

                <button
                  onClick={() => handleDelete(gateway.id)}
                  className="p-2 text-red-400 hover:bg-red-900/30 rounded"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
