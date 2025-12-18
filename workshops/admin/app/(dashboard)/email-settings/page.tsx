'use client';

import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  CheckIcon, 
  Cross2Icon, 
  GearIcon, 
  TrashIcon,
  EnvelopeClosedIcon,
  PaperPlaneIcon,
} from '@radix-ui/react-icons';
import api from '@/lib/api';

interface EmailSetting {
  id: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  fromEmail: string;
  fromName: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
}

interface EmailFormData {
  name: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
  isActive: boolean;
}

export default function EmailSettingsPage() {
  const [settings, setSettings] = useState<EmailSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<EmailFormData>({
    name: '',
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: '',
    fromEmail: '',
    fromName: '',
    isActive: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/admin/system-email');
      setSettings(response.data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await api.patch(`/admin/system-email/${editingId}`, formData);
      } else {
        await api.post('/admin/system-email', formData);
      }
      
      await loadSettings();
      resetForm();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar configuração');
    }
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    try {
      const testEmail = prompt('Digite o email para enviar o teste:');
      if (!testEmail) {
        setTesting(null);
        return;
      }

      const response = await api.post(`/admin/system-email/${id}/test`, { testEmail });
      
      if (response.data.success) {
        alert('✅ Email de teste enviado com sucesso! Verifique sua caixa de entrada.');
      } else {
        alert(`❌ Falha no teste: ${response.data.message}`);
      }
    } catch (error: any) {
      console.error('Erro ao testar:', error);
      alert(`❌ Erro ao testar email: ${error.response?.data?.message || error.message}`);
    } finally {
      setTesting(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.patch(`/admin/system-email/${id}/default`);
      await loadSettings();
    } catch (error) {
      console.error('Erro ao definir padrão:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta configuração?')) return;
    
    try {
      await api.delete(`/admin/system-email/${id}`);
      await loadSettings();
    } catch (error) {
      console.error('Erro ao remover:', error);
    }
  };

  const handleEdit = (setting: EmailSetting) => {
    setEditingId(setting.id);
    setFormData({
      name: setting.name,
      host: setting.host,
      port: setting.port,
      secure: setting.secure,
      user: setting.user,
      password: '', // Não carrega a senha por segurança
      fromEmail: setting.fromEmail,
      fromName: setting.fromName,
      isActive: setting.isActive,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      host: '',
      port: 587,
      secure: false,
      user: '',
      password: '',
      fromEmail: '',
      fromName: '',
      isActive: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Configurações de Email</h1>
          <p className="text-gray-300 mt-1">Configure os servidores SMTP para envio de emails</p>
        </div>
        
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="w-5 h-5" />
            Nova Configuração
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-white">
            {editingId ? 'Editar Configuração' : 'Nova Configuração'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
                Nome Identificador
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: SMTP Principal"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Host SMTP
                </label>
                <input
                  type="text"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="smtp.gmail.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Porta
                </label>
                <input
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="587"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="secure"
                checked={formData.secure}
                onChange={(e) => setFormData({ ...formData, secure: e.target.checked })}
                className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="secure" className="text-sm font-medium text-gray-200">
                Usar SSL/TLS (porta 465)
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Usuário SMTP
                </label>
                <input
                  type="text"
                  value={formData.user}
                  onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="usuario@exemplo.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Senha {editingId && '(deixe em branco para não alterar)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                  required={!editingId}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Email Remetente
                </label>
                <input
                  type="email"
                  value={formData.fromEmail}
                  onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="noreply@exemplo.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Nome Remetente
                </label>
                <input
                  type="text"
                  value={formData.fromName}
                  onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Mecânica365"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-200">
                Configuração ativa
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                {editingId ? 'Atualizar' : 'Criar Configuração'}
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
        {settings.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow p-12 text-center">
            <EnvelopeClosedIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Nenhuma configuração de email
            </h3>
            <p className="text-gray-300 mb-4">
              Configure um servidor SMTP para enviar emails do sistema
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="w-5 h-5" />
              Adicionar Configuração
            </button>
          </div>
        ) : (
          settings.map((setting) => (
            <div
              key={setting.id}
              className="bg-gray-800 border border-gray-700 rounded-lg shadow p-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-900/50 rounded-lg">
                  <EnvelopeClosedIcon className="w-6 h-6 text-blue-400" />
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{setting.name}</h3>
                    {setting.isDefault && (
                      <span className="px-2 py-1 bg-green-900/50 text-green-400 text-xs font-medium rounded border border-green-700">
                        Padrão
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    {setting.host}:{setting.port} • {setting.fromEmail}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {setting.isActive ? (
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
                  onClick={() => handleTest(setting.id)}
                  disabled={testing === setting.id}
                  className="flex items-center gap-1 px-3 py-1 text-sm border border-blue-500 text-blue-400 rounded hover:bg-blue-900/30 disabled:opacity-50"
                >
                  <PaperPlaneIcon className="w-3 h-3" />
                  {testing === setting.id ? 'Testando...' : 'Testar'}
                </button>

                {!setting.isDefault && (
                  <button
                    onClick={() => handleSetDefault(setting.id)}
                    className="px-3 py-1 text-sm border border-gray-600 text-gray-300 rounded hover:bg-gray-700"
                  >
                    Definir Padrão
                  </button>
                )}

                <button
                  onClick={() => handleEdit(setting)}
                  className="p-2 text-gray-300 hover:bg-gray-700 rounded"
                >
                  <GearIcon className="w-5 h-5" />
                </button>

                <button
                  onClick={() => handleDelete(setting.id)}
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
