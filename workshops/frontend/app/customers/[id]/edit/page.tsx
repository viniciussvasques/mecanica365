'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { customersApi, Customer, UpdateCustomerDto, DocumentType } from '@/lib/api/customers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { authStorage } from '@/lib/utils/localStorage';
import { logger } from '@/lib/utils/logger';

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [loadingCustomer, setLoadingCustomer] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    documentType: DocumentType;
    cpf: string;
    cnpj: string;
    address: string;
    notes: string;
  }>({
    name: '',
    email: '',
    phone: '',
    documentType: DocumentType.CPF,
    cpf: '',
    cnpj: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadCustomer();
  }, [id]);

  const loadCustomer = async () => {
    try {
      setLoadingCustomer(true);
      const customer = await customersApi.findOne(id);
      setFormData({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone,
        documentType: (customer.documentType as DocumentType) || DocumentType.CPF,
        cpf: customer.cpf || '',
        cnpj: customer.cnpj || '',
        address: customer.address || '',
        notes: customer.notes || '',
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar cliente';
      alert(errorMessage);
      logger.error('Erro ao carregar cliente:', err);
      router.push('/customers');
    } finally {
      setLoadingCustomer(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validar CPF se documentType for CPF
    if (formData.documentType === DocumentType.CPF && formData.cpf && formData.cpf.length !== 11) {
      newErrors.cpf = 'CPF deve ter 11 dígitos';
    }

    // Validar CNPJ se documentType for CNPJ
    if (formData.documentType === DocumentType.CNPJ && formData.cnpj && formData.cnpj.length !== 14) {
      newErrors.cnpj = 'CNPJ deve ter 14 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Formatar telefone se fornecido
      const formatPhone = (phone?: string): string | undefined => {
        if (!phone) return undefined;
        const numbers = phone.replace(/\D/g, '');
        if (numbers.length === 10) {
          return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
        } else if (numbers.length === 11) {
          return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
        }
        return phone;
      };
      
      const data: UpdateCustomerDto = {
        name: formData.name.trim() || undefined,
        phone: formatPhone(formData.phone.trim()),
        email: formData.email.trim() || undefined,
        documentType: formData.documentType,
        cpf: formData.documentType === DocumentType.CPF ? formData.cpf.trim() || undefined : undefined,
        cnpj: formData.documentType === DocumentType.CNPJ ? formData.cnpj.trim() || undefined : undefined,
        address: formData.address.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };

      logger.log('[EditCustomer] Enviando dados:', data);
      await customersApi.update(id, data);
      router.push(`/customers/${id}`);
    } catch (err: unknown) {
      logger.error('Erro ao atualizar cliente:', err);
      let errorMessage = 'Erro ao atualizar cliente';
      
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string | string[] } } };
        if (axiosError.response?.data?.message) {
          const message = axiosError.response.data.message;
          errorMessage = Array.isArray(message) ? message.join(', ') : message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingCustomer) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto"></div>
            <p className="mt-4 text-[#7E8691]">Carregando cliente...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link href={`/customers/${id}`} className="text-[#00E0B8] hover:text-[#3ABFF8] mb-4 inline-block text-sm sm:text-base">
            ← Voltar para detalhes
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#D0D6DE]">Editar Cliente</h1>
          <p className="text-[#7E8691] mt-2 text-sm sm:text-base">Atualize as informações do cliente</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Input
                label="Nome *"
                placeholder="Nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                required
              />
              <Input
                label="Telefone"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length > 11) value = value.slice(0, 11);
                  
                  let formatted = value;
                  if (value.length > 0) {
                    if (value.length <= 2) {
                      formatted = `(${value}`;
                    } else if (value.length <= 7) {
                      formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                    } else if (value.length <= 10) {
                      formatted = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
                    } else {
                      formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
                    }
                  }
                  
                  setFormData({ ...formData, phone: formatted });
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Input
                label="Email"
                type="email"
                placeholder="email@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
              />
              <Select
                label="Tipo de Documento *"
                value={formData.documentType}
                onChange={(e) => {
                  const newDocType = e.target.value as DocumentType;
                  setFormData({
                    ...formData,
                    documentType: newDocType,
                    cpf: newDocType === DocumentType.CPF ? formData.cpf : '',
                    cnpj: newDocType === DocumentType.CNPJ ? formData.cnpj : '',
                  });
                }}
                options={[
                  { value: DocumentType.CPF, label: 'CPF (Pessoa Física)' },
                  { value: DocumentType.CNPJ, label: 'CNPJ (Pessoa Jurídica)' },
                ]}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {formData.documentType === DocumentType.CPF ? (
                <Input
                  label="CPF"
                  placeholder="00000000000"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                  error={errors.cpf}
                  maxLength={11}
                />
              ) : (
                <Input
                  label="CNPJ"
                  placeholder="00000000000000"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value.replace(/\D/g, '').slice(0, 14) })}
                  error={errors.cnpj}
                  maxLength={14}
                />
              )}
            </div>

            <Input
              label="Endereço"
              placeholder="Rua, número, bairro, cidade/estado"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-[#D0D6DE] mb-2">
                Observações
              </label>
              <textarea
                id="notes"
                rows={4}
                placeholder="Observações sobre o cliente..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg text-[#F0F4F8] placeholder:text-[#7E8691] placeholder:opacity-60 bg-[#1A1E23] border-[#3A4048] focus:outline-none focus:ring-2 focus:ring-[#00E0B8]/50 focus:border-[#00E0B8] focus:bg-[#1F2329] transition-all duration-200"
                style={{
                  WebkitTextFillColor: '#F0F4F8',
                  color: '#F0F4F8',
                }}
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#2A3038]">
            <Link href={`/customers/${id}`} className="w-full sm:w-auto">
              <Button variant="secondary" type="button" className="w-full sm:w-auto">
                Cancelar
              </Button>
            </Link>
            <Button variant="primary" type="submit" isLoading={loading} className="w-full sm:w-auto">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

