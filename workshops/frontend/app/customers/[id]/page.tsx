'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { customersApi, Customer } from '@/lib/api/customers';
import { Button } from '@/components/ui/Button';

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setLoading(true);
      setError(null);
      const data = await customersApi.findOne(id);
      setCustomer(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar cliente';
      setError(errorMessage);
      console.error('Erro ao carregar cliente:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) {
      return;
    }

    try {
      await customersApi.remove(id);
      router.push('/customers');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir cliente';
      alert(errorMessage);
      console.error('Erro ao excluir cliente:', err);
    }
  };

  if (loading) {
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

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#FF4E3D]/10 border border-[#FF4E3D] rounded-lg p-6">
            <p className="text-[#FF4E3D]">{error || 'Cliente não encontrado'}</p>
            <Link href="/customers" className="mt-4 inline-block">
              <Button variant="secondary">Voltar para clientes</Button>
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
          <Link href="/customers" className="text-[#00E0B8] hover:text-[#3ABFF8] mb-4 inline-block">
            ← Voltar para clientes
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#D0D6DE]">{customer.name}</h1>
              <p className="text-[#7E8691] mt-2">Detalhes do cliente</p>
            </div>
            <div className="flex items-center space-x-2">
              <Link href={`/customers/${customer.id}/edit`}>
                <Button variant="primary">Editar</Button>
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
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Informações Pessoais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-[#7E8691] mb-1">Nome</p>
                <p className="text-[#D0D6DE]">{customer.name}</p>
              </div>
              <div>
                <p className="text-sm text-[#7E8691] mb-1">Telefone</p>
                <p className="text-[#D0D6DE]">{customer.phone}</p>
              </div>
              {customer.email && (
                <div>
                  <p className="text-sm text-[#7E8691] mb-1">Email</p>
                  <p className="text-[#D0D6DE]">{customer.email}</p>
                </div>
              )}
              {customer.cpf && (
                <div>
                  <p className="text-sm text-[#7E8691] mb-1">CPF</p>
                  <p className="text-[#D0D6DE]">{customer.cpf}</p>
                </div>
              )}
            </div>
          </div>

          {customer.address && (
            <div>
              <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Endereço</h2>
              <p className="text-[#D0D6DE]">{customer.address}</p>
            </div>
          )}

          {customer.notes && (
            <div>
              <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Observações</h2>
              <p className="text-[#D0D6DE] whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}

          <div className="pt-6 border-t border-[#2A3038]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-[#7E8691] mb-1">Criado em</p>
                <p className="text-[#D0D6DE]">
                  {new Date(customer.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-[#7E8691] mb-1">Última atualização</p>
                <p className="text-[#D0D6DE]">
                  {new Date(customer.updatedAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

