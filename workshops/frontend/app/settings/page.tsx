'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { workshopSettingsApi, WorkshopSettings, CreateWorkshopSettingsDto } from '@/lib/api/workshop-settings';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useNotification } from '@/components/NotificationProvider';
import { logger } from '@/lib/utils/logger';

export default function SettingsPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [settings, setSettings] = useState<WorkshopSettings | null>(null);
  const [formData, setFormData] = useState<CreateWorkshopSettingsDto>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await workshopSettingsApi.findOne();
      setSettings(data);
      setFormData({
        displayName: data.displayName || '',
        logoUrl: data.logoUrl || '',
        primaryColor: data.primaryColor || '',
        secondaryColor: data.secondaryColor || '',
        accentColor: data.accentColor || '',
        phone: data.phone || '',
        email: data.email || '',
        whatsapp: data.whatsapp || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zipCode || '',
        country: data.country || 'BR',
        website: data.website || '',
        facebook: data.facebook || '',
        instagram: data.instagram || '',
        linkedin: data.linkedin || '',
        showLogoOnQuotes: data.showLogoOnQuotes,
        showAddressOnQuotes: data.showAddressOnQuotes,
        showContactOnQuotes: data.showContactOnQuotes,
        quoteFooterText: data.quoteFooterText || '',
        invoiceFooterText: data.invoiceFooterText || '',
      });
      
      // Definir preview do logo se existir
      if (data.logoUrl) {
        // Se for URL relativa, construir URL completa usando a API base
        if (data.logoUrl.startsWith('/uploads/')) {
          // Construir URL completa baseada na API
          const getApiBaseUrl = () => {
            if (typeof globalThis.window === 'undefined') return 'http://localhost:3001';
            const subdomain = authStorage.getSubdomain();
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            if (subdomain && baseUrl.includes('localhost')) {
              return `http://${subdomain}.localhost:3001`;
            }
            return baseUrl;
          };
          const fullUrl = `${getApiBaseUrl()}${data.logoUrl}`;
          logger.log('[Settings] Definindo preview do logo:', fullUrl);
          setLogoPreview(fullUrl);
        } else if (data.logoUrl.startsWith('http://') || data.logoUrl.startsWith('https://')) {
          logger.log('[Settings] Definindo preview do logo (URL completa):', data.logoUrl);
          setLogoPreview(data.logoUrl);
        } else {
          // URL relativa ou incompleta, tentar construir
          const getApiBaseUrl2 = () => {
            if (typeof globalThis.window === 'undefined') return 'http://localhost:3001';
            const subdomain = authStorage.getSubdomain();
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            if (subdomain && baseUrl.includes('localhost')) {
              return `http://${subdomain}.localhost:3001`;
            }
            return baseUrl;
          };
          const prefix = data.logoUrl.startsWith('/') ? '' : '/';
          const fullUrl = `${getApiBaseUrl2()}${prefix}${data.logoUrl}`;
          logger.log('[Settings] Definindo preview do logo (construída):', fullUrl);
          setLogoPreview(fullUrl);
        }
      } else {
        setLogoPreview(null);
      }
    } catch (err: unknown) {
      logger.error('Erro ao carregar configurações:', err);
      showNotification('Erro ao carregar configurações', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // Enviar todos os campos, removendo strings vazias e valores inválidos
      const cleanedData: CreateWorkshopSettingsDto = {};
      Object.entries(formData).forEach(([key, value]) => {
        // Pular valores nulos ou undefined
        if (value === null || value === undefined) return;
        
        // Para strings vazias, enviar como undefined (será ignorado pelo backend)
        if (value === '') return;
        
        // Para cores, validar formato antes de enviar
        if (['primaryColor', 'secondaryColor', 'accentColor'].includes(key)) {
          // Se não for um hex válido, não enviar
          if (typeof value === 'string' && value !== '' && !/^#[\dA-Fa-f]{6}$/i.test(value)) {
            return;
          }
        }
        
        cleanedData[key as keyof CreateWorkshopSettingsDto] = value;
      });

      await workshopSettingsApi.upsert(cleanedData);
      showNotification('Configurações salvas com sucesso!', 'success');
      await loadSettings();
    } catch (err: unknown) {
      logger.error('Erro ao salvar configurações:', err);
      showNotification(
        err instanceof Error ? err.message : 'Erro ao salvar configurações',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]:
          type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : type === 'number'
              ? Number.parseFloat(value) || 0
              : value,
      };
      
      // Atualizar preview do logo se a URL mudar
      if (name === 'logoUrl' && value) {
        const getApiBaseUrl3 = () => {
          if (typeof globalThis.window === 'undefined') return 'http://localhost:3001';
          const subdomain = localStorage.getItem('subdomain');
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          if (subdomain && baseUrl.includes('localhost')) {
            return `http://${subdomain}.localhost:3001`;
          }
          return baseUrl;
        };
        
        if (value.startsWith('/uploads/')) {
          setLogoPreview(`${getApiBaseUrl3()}${value}`);
        } else if (value.startsWith('http://') || value.startsWith('https://')) {
          setLogoPreview(value);
        } else if (value.trim() !== '') {
          // Tentar construir URL completa
          setLogoPreview(value);
        } else {
          setLogoPreview(null);
        }
      } else if (name === 'logoUrl' && !value) {
        setLogoPreview(null);
      }
      
      return newData;
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const imageTypeRegex = /^image\/(jpg|jpeg|png|gif|webp|svg)$/;
    if (!imageTypeRegex.exec(file.type)) {
      showNotification('Apenas imagens são permitidas (JPG, PNG, GIF, WEBP, SVG)', 'error');
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('A imagem deve ter no máximo 5MB', 'error');
      return;
    }

    try {
      setUploadingLogo(true);
      
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Fazer upload
      const result = await workshopSettingsApi.uploadLogo(file);
      
      // Construir URL completa para preview
      const getApiBaseUrl = () => {
        if (typeof window === 'undefined') return 'http://localhost:3001';
        const subdomain = localStorage.getItem('subdomain');
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        if (subdomain && baseUrl.includes('localhost')) {
          return `http://${subdomain}.localhost:3001`;
        }
        return baseUrl;
      };
      
      const fullUrl = result.url.startsWith('/') 
        ? `${getApiBaseUrl()}${result.url}`
        : result.url;
      
      setLogoPreview(fullUrl);
      
      // Atualizar formData com a URL retornada
      setFormData((prev) => ({
        ...prev,
        logoUrl: result.url,
      }));

      showNotification('Logo enviado com sucesso!', 'success');
      
      // Recarregar configurações para garantir sincronização
      await loadSettings();
    } catch (err: unknown) {
      logger.error('Erro ao fazer upload do logo:', err);
      showNotification(
        err instanceof Error ? err.message : 'Erro ao fazer upload do logo',
        'error',
      );
      setLogoPreview(null);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto mb-4"></div>
          <p className="text-[#7E8691]">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#D0D6DE] mb-2">
            Configurações da Oficina
          </h1>
          <p className="text-[#7E8691]">
            Personalize as informações e aparência da sua oficina
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">
              Informações Básicas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome de Exibição"
                name="displayName"
                value={formData.displayName || ''}
                onChange={handleChange}
                placeholder="Ex: Oficina Mecânica Silva"
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#D0D6DE]">
                  Logo da Oficina
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="block w-full text-sm text-[#D0D6DE] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#00E0B8] file:text-[#0F1115] hover:file:bg-[#00C9A3] file:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-[#7E8691]">
                      Formatos aceitos: JPG, PNG, GIF, WEBP, SVG (máx. 5MB)
                    </p>
                  </div>
                  {logoPreview && (
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <img
                          src={logoPreview}
                          alt="Preview do logo"
                          className="h-16 w-16 object-contain rounded border border-[#2A3038] bg-[#0F1115] p-1"
                          onError={(e) => {
                            logger.error('Erro ao carregar preview do logo:', logoPreview);
                            setLogoPreview(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setLogoPreview(null)}
                          className="absolute -top-1 -right-1 bg-[#FF4E3D] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-[#FF3D2A] transition-colors"
                          title="Remover preview"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {uploadingLogo && (
                  <p className="text-xs text-[#00E0B8]">Enviando logo...</p>
                )}
              </div>
              <div className="md:col-span-2">
                <Input
                  label="URL do Logo (alternativa)"
                  name="logoUrl"
                  value={formData.logoUrl || ''}
                  onChange={handleChange}
                  placeholder="https://example.com/logo.png ou /uploads/logos/logo.png"
                  type="text"
                />
                <p className="mt-1 text-xs text-[#7E8691]">
                  Ou informe uma URL externa do logo ou caminho relativo
                </p>
              </div>
            </div>
          </div>

          {/* Cores */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Cores</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="primaryColor" className="block text-sm font-medium text-[#D0D6DE] mb-2">
                  Cor Primária
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.primaryColor || '#00E0B8'}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, primaryColor: e.target.value }));
                    }}
                    className="h-10 w-20 rounded border border-[#2A3038] cursor-pointer"
                  />
                  <Input
                    label=""
                    name="primaryColor"
                    value={formData.primaryColor || ''}
                    onChange={handleChange}
                    placeholder="#00E0B8"
                    type="text"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="secondaryColor" className="block text-sm font-medium text-[#D0D6DE] mb-2">
                  Cor Secundária
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.secondaryColor || '#3ABFF8'}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, secondaryColor: e.target.value }));
                    }}
                    className="h-10 w-20 rounded border border-[#2A3038] cursor-pointer"
                  />
                  <Input
                    label=""
                    name="secondaryColor"
                    value={formData.secondaryColor || ''}
                    onChange={handleChange}
                    placeholder="#3ABFF8"
                    type="text"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="accentColor" className="block text-sm font-medium text-[#D0D6DE] mb-2">
                  Cor de Destaque
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.accentColor || '#FF4E3D'}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, accentColor: e.target.value }));
                    }}
                    className="h-10 w-20 rounded border border-[#2A3038] cursor-pointer"
                  />
                  <Input
                    label=""
                    name="accentColor"
                    value={formData.accentColor || ''}
                    onChange={handleChange}
                    placeholder="#FF4E3D"
                    type="text"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contatos */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Contatos</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Telefone"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                placeholder="(11) 98765-4321"
              />
              <Input
                label="Email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                placeholder="contato@oficina.com.br"
                type="email"
              />
              <Input
                label="WhatsApp"
                name="whatsapp"
                value={formData.whatsapp || ''}
                onChange={handleChange}
                placeholder="5511987654321"
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">Endereço</h2>
            <div className="space-y-4">
              <Input
                label="Endereço"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                placeholder="Rua das Flores, 123"
              />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  label="Cidade"
                  name="city"
                  value={formData.city || ''}
                  onChange={handleChange}
                  placeholder="São Paulo"
                />
                <Input
                  label="Estado (UF)"
                  name="state"
                  value={formData.state || ''}
                  onChange={handleChange}
                  placeholder="SP"
                  maxLength={2}
                />
                <Input
                  label="CEP"
                  name="zipCode"
                  value={formData.zipCode || ''}
                  onChange={handleChange}
                  placeholder="01234-567"
                />
                <Input
                  label="País"
                  name="country"
                  value={formData.country || 'BR'}
                  onChange={handleChange}
                  placeholder="BR"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          {/* Redes Sociais */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">
              Redes Sociais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Website"
                name="website"
                value={formData.website || ''}
                onChange={handleChange}
                placeholder="https://www.oficina.com.br"
                type="url"
              />
              <Input
                label="Facebook"
                name="facebook"
                value={formData.facebook || ''}
                onChange={handleChange}
                placeholder="https://www.facebook.com/oficina"
                type="url"
              />
              <Input
                label="Instagram"
                name="instagram"
                value={formData.instagram || ''}
                onChange={handleChange}
                placeholder="https://www.instagram.com/oficina"
                type="url"
              />
              <Input
                label="LinkedIn"
                name="linkedin"
                value={formData.linkedin || ''}
                onChange={handleChange}
                placeholder="https://www.linkedin.com/company/oficina"
                type="url"
              />
            </div>
          </div>

          {/* Configurações de Documentos */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">
              Configurações de Documentos
            </h2>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showLogoOnQuotes ?? true}
                  onChange={(e) =>
                    handleCheckboxChange('showLogoOnQuotes', e.target.checked)
                  }
                  className="w-5 h-5 rounded border-[#3A4048] bg-[#1A1E23] text-[#00E0B8] focus:ring-[#00E0B8]"
                />
                <span className="text-[#D0D6DE]">Mostrar logo nos orçamentos</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showAddressOnQuotes ?? true}
                  onChange={(e) =>
                    handleCheckboxChange('showAddressOnQuotes', e.target.checked)
                  }
                  className="w-5 h-5 rounded border-[#3A4048] bg-[#1A1E23] text-[#00E0B8] focus:ring-[#00E0B8]"
                />
                <span className="text-[#D0D6DE]">Mostrar endereço nos orçamentos</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showContactOnQuotes ?? true}
                  onChange={(e) =>
                    handleCheckboxChange('showContactOnQuotes', e.target.checked)
                  }
                  className="w-5 h-5 rounded border-[#3A4048] bg-[#1A1E23] text-[#00E0B8] focus:ring-[#00E0B8]"
                />
                <span className="text-[#D0D6DE]">Mostrar contato nos orçamentos</span>
              </label>
            </div>
          </div>

          {/* Textos Personalizados */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#D0D6DE] mb-4">
              Textos Personalizados
            </h2>
            <div className="space-y-4">
              <Textarea
                label="Texto do Rodapé (Orçamentos)"
                name="quoteFooterText"
                value={formData.quoteFooterText || ''}
                onChange={handleChange}
                placeholder="Ex: Obrigado pela preferência!"
                rows={3}
              />
              <Textarea
                label="Texto do Rodapé (Faturas)"
                name="invoiceFooterText"
                value={formData.invoiceFooterText || ''}
                onChange={handleChange}
                placeholder="Ex: Pagamento em até 30 dias"
                rows={3}
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

