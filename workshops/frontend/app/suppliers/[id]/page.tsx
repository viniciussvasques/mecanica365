'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { suppliersApi, Supplier } from '@/lib/api/suppliers';
import { Button } from '@/components/ui/Button';
import { logger } from '@/lib/utils/logger';
import { authStorage } from '@/lib/utils/localStorage';

export const dynamic = 'force-dynamic';

export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = authStorage.getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    loadSupplier();
  }, [id]);

  const loadSupplier = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await suppliersApi.findOne(id);
      setSupplier(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar fornecedor';
      setError(errorMessage);
      logger.error('Erro ao carregar fornecedor:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este fornecedor?')) {
      return;
    }

    try {
      await suppliersApi.remove(id);
      router.push('/suppliers');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir fornecedor';
      alert(errorMessage);
      logger.error('Erro ao excluir fornecedor:', err);
    }
  };

  const formatDocument = (document?: string, documentType?: string): string => {
    if (!document) return '-';
    if (documentType === 'cnpj') {
      return document.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    if (documentType === 'cpf') {
      return document.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    }
    return document;
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
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

  if (error || !supplier) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#FF4E3D]/10 border border-[#FF4E3D] rounded-lg p-6 text-center">
            <p className="text-[#FF4E3D] mb-4">{error || 'Fornecedor não encontrado'}</p>
            <Link href="/suppliers">
              <Button variant="secondary">Voltar para Fornecedores</Button>
            </Link>
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#D0D6DE] mb-2">{supplier.name}</h1>
              <p className="text-[#7E8691]">Detalhes do fornecedor</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link href={`/suppliers/${supplier.id}/edit`}>
                <Button variant="secondary">Editar</Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-[#FF4E3D] border-[#FF4E3D] hover:bg-[#FF4E3D]/10"
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>

        {/* Informações */}
        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Informações Básicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#7E8691] mb-1">Nome</p>
                <p className="text-[#D0D6DE]">{supplier.name}</p>
              </div>
              {supplier.documentType && (
                <div>
                  <p className="text-sm text-[#7E8691] mb-1">
                    {supplier.documentType === 'cnpj' ? 'CNPJ' : 'CPF'}
                  </p>
                  <p className="text-[#D0D6DE]">{formatDocument(supplier.document, supplier.documentType)}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-[#7E8691] mb-1">Status</p>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    supplier.isActive
                      ? 'bg-[#00E0B8]/20 text-[#00E0B8]'
                      : 'bg-[#FF4E3D]/20 text-[#FF4E3D]'
                  }`}
                >
                  {supplier.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Contato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supplier.phone && (
                <div>
                  <p className="text-sm text-[#7E8691] mb-1">Telefone</p>
                  <p className="text-[#D0D6DE]">{supplier.phone}</p>
                </div>
              )}
              {supplier.email && (
                <div>
                  <p className="text-sm text-[#7E8691] mb-1">Email</p>
                  <p className="text-[#D0D6DE]">{supplier.email}</p>
                </div>
              )}
              {supplier.contactName && (
                <div>
                  <p className="text-sm text-[#7E8691] mb-1">Nome do Contato</p>
                  <p className="text-[#D0D6DE]">{supplier.contactName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Endereço */}
          {(supplier.address || supplier.city || supplier.state || supplier.zipCode) && (
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
              <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Endereço</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supplier.address && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-[#7E8691] mb-1">Endereço</p>
                    <p className="text-[#D0D6DE]">{supplier.address}</p>
                  </div>
                )}
                {supplier.city && (
                  <div>
                    <p className="text-sm text-[#7E8691] mb-1">Cidade</p>
                    <p className="text-[#D0D6DE]">{supplier.city}</p>
                  </div>
                )}
                {supplier.state && (
                  <div>
                    <p className="text-sm text-[#7E8691] mb-1">Estado</p>
                    <p className="text-[#D0D6DE]">{supplier.state}</p>
                  </div>
                )}
                {supplier.zipCode && (
                  <div>
                    <p className="text-sm text-[#7E8691] mb-1">CEP</p>
                    <p className="text-[#D0D6DE]">{supplier.zipCode}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Observações */}
          {supplier.notes && (
            <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
              <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Observações</h2>
              <p className="text-[#D0D6DE] whitespace-pre-wrap">{supplier.notes}</p>
            </div>
          )}

          {/* Informações do Sistema */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Informações do Sistema</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#7E8691] mb-1">Criado em</p>
                <p className="text-[#D0D6DE]">{formatDate(supplier.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-[#7E8691] mb-1">Atualizado em</p>
                <p className="text-[#D0D6DE]">{formatDate(supplier.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end space-x-3">
          <Link href="/suppliers">
            <Button variant="secondary">Voltar para Fornecedores</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

