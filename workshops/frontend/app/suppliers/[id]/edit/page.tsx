'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { suppliersApi, UpdateSupplierDto, DocumentType } from '@/lib/api/suppliers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [loadingSupplier, setLoadingSupplier] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<UpdateSupplierDto>({
    name: '',
    documentType: undefined,
    document: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    contactName: '',
    notes: '',
    isActive: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadSupplier();
  }, [id]);

  const loadSupplier = async () => {
    try {
      setLoadingSupplier(true);
      const supplier = await suppliersApi.findOne(id);
      setFormData({
        name: supplier.name,
        documentType: supplier.documentType,
        document: supplier.document || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        city: supplier.city || '',
        state: supplier.state || '',
        zipCode: supplier.zipCode || '',
        contactName: supplier.contactName || '',
        notes: supplier.notes || '',
        isActive: supplier.isActive,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar fornecedor';
      alert(errorMessage);
      logger.error('Erro ao carregar fornecedor:', err);
      router.push('/suppliers');
    } finally {
      setLoadingSupplier(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.name && formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.document && formData.documentType) {
      const doc = formData.document.replace(/\D/g, '');
      if (formData.documentType === DocumentType.CNPJ && doc.length !== 14) {
        newErrors.document = 'CNPJ deve ter 14 dígitos';
      }
      if (formData.documentType === DocumentType.CPF && doc.length !== 11) {
        newErrors.document = 'CPF deve ter 11 dígitos';
      }
    }

    if (formData.state && formData.state.length !== 2) {
      newErrors.state = 'Estado deve ter 2 caracteres (UF)';
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

      const data: UpdateSupplierDto = {
        name: formData.name?.trim(),
        documentType: formData.documentType,
        document: formData.document?.replace(/\D/g, '') || undefined,
        phone: formData.phone?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        city: formData.city?.trim() || undefined,
        state: formData.state?.trim().toUpperCase() || undefined,
        zipCode: formData.zipCode?.replace(/\D/g, '') || undefined,
        contactName: formData.contactName?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        isActive: formData.isActive,
      };

      await suppliersApi.update(id, data);
      router.push(`/suppliers/${id}`);
    } catch (err: unknown) {
      logger.error('Erro ao atualizar fornecedor:', err);
      let errorMessage = 'Erro ao atualizar fornecedor';

      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string | string[] } } };
        if (axiosError.response?.data?.message) {
          const message = axiosError.response.data.message;
          errorMessage = Array.isArray(message) ? message.join(', ') : message;
        }
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDocument = (value: string): string => {
    if (!formData.documentType) return value;
    const numbers = value.replace(/\D/g, '');
    if (formData.documentType === DocumentType.CNPJ) {
      return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    if (formData.documentType === DocumentType.CPF) {
      return numbers.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    }
    return value;
  };

  const formatPhone = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    }
    return numbers.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  };

  const formatZipCode = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  };

  if (loadingSupplier) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto"></div>
            <p className="mt-4 text-[#7E8691]">Carregando fornecedor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#D0D6DE] mb-2">Editar Fornecedor</h1>
          <p className="text-[#7E8691]">Atualize as informações do fornecedor</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
          <div className="space-y-6">
            {/* Informações Básicas */}
            <div>
              <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Informações Básicas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome *"
                  placeholder="Nome do fornecedor"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                  required
                />
                <Select
                  label="Tipo de Documento"
                  value={formData.documentType || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      documentType: e.target.value ? (e.target.value as DocumentType) : undefined,
                      document: '',
                    })
                  }
                  options={[
                    { value: '', label: 'Selecione...' },
                    { value: DocumentType.CNPJ, label: 'CNPJ' },
                    { value: DocumentType.CPF, label: 'CPF' },
                  ]}
                />
                {formData.documentType && (
                  <Input
                    label={formData.documentType === DocumentType.CNPJ ? 'CNPJ' : 'CPF'}
                    placeholder={formData.documentType === DocumentType.CNPJ ? '00.000.000/0000-00' : '000.000.000-00'}
                    value={formData.document || ''}
                    onChange={(e) => {
                      const formatted = formatDocument(e.target.value);
                      setFormData({ ...formData, document: formatted });
                    }}
                    error={errors.document}
                  />
                )}
                <Input
                  label="Telefone"
                  placeholder="(00) 00000-0000"
                  value={formData.phone || ''}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value);
                    setFormData({ ...formData, phone: formatted });
                  }}
                />
                <Input
                  label="Email"
                  placeholder="email@exemplo.com"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={errors.email}
                />
              </div>
            </div>

            {/* Endereço */}
            <div>
              <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Endereço</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Endereço"
                  placeholder="Rua, número, complemento"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="md:col-span-2"
                />
                <Input
                  label="Cidade"
                  placeholder="Cidade"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                <Input
                  label="Estado (UF)"
                  placeholder="SP"
                  value={formData.state || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value.toUpperCase().slice(0, 2) })
                  }
                  error={errors.state}
                  maxLength={2}
                />
                <Input
                  label="CEP"
                  placeholder="00000-000"
                  value={formData.zipCode || ''}
                  onChange={(e) => {
                    const formatted = formatZipCode(e.target.value);
                    setFormData({ ...formData, zipCode: formatted });
                  }}
                />
              </div>
            </div>

            {/* Contato e Observações */}
            <div>
              <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Contato e Observações</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome do Contato"
                  placeholder="Nome da pessoa de contato"
                  value={formData.contactName || ''}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive ?? true}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="form-checkbox h-5 w-5 text-[#00E0B8] bg-[#1A1E23] border-[#3A4048] rounded focus:ring-[#00E0B8]"
                  />
                  <label htmlFor="isActive" className="text-sm text-[#D0D6DE]">
                    Fornecedor ativo
                  </label>
                </div>
                <Textarea
                  label="Observações"
                  placeholder="Observações sobre o fornecedor"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="md:col-span-2"
                  rows={4}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-[#2A3038]">
              <Link href={`/suppliers/${id}`}>
                <Button variant="secondary" type="button">
                  Cancelar
                </Button>
              </Link>
              <Button variant="primary" type="submit" isLoading={loading}>
                Salvar Alterações
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

