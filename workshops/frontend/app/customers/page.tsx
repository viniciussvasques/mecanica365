'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { customersApi, Customer, CustomerFilters } from '@/lib/api/customers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CustomerFilters>({
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadCustomers();
  }, [filters]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar se token e subdomain estão disponíveis
      const token = localStorage.getItem('token');
      const subdomain = localStorage.getItem('subdomain');
      
      if (!token) {
        setError('Token de autenticação não encontrado. Faça login novamente.');
        router.push('/login');
        return;
      }
      
      if (!subdomain) {
        setError('Subdomain não encontrado. Faça login novamente.');
        router.push('/login');
        return;
      }
      
      console.log('[CustomersPage] Carregando clientes com subdomain:', subdomain);
      const response = await customersApi.findAll(filters);
      setCustomers(response.data);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      });
    } catch (err: unknown) {
      console.error('[CustomersPage] Erro ao carregar clientes:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar clientes';
      setError(errorMessage);
      console.error('Erro ao carregar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof CustomerFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 1, // Reset para primeira página ao filtrar
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) {
      return;
    }

    try {
      await customersApi.remove(id);
      await loadCustomers();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir cliente';
      alert(errorMessage);
      console.error('Erro ao excluir cliente:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-[#D0D6DE]">Clientes</h1>
            <Link href="/customers/new">
              <Button variant="primary">
                + Novo Cliente
              </Button>
            </Link>
          </div>
          <p className="text-[#7E8691]">Gerencie seus clientes</p>
        </div>

        {/* Filtros */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Input
              label="Nome"
              placeholder="Buscar por nome..."
              value={filters.name || ''}
              onChange={(e) => handleFilterChange('name', e.target.value)}
            />
            <Input
              label="Telefone"
              placeholder="Buscar por telefone..."
              value={filters.phone || ''}
              onChange={(e) => handleFilterChange('phone', e.target.value)}
            />
            <Input
              label="Email"
              placeholder="Buscar por email..."
              value={filters.email || ''}
              onChange={(e) => handleFilterChange('email', e.target.value)}
            />
            <Select
              label="Tipo de Documento"
              value={filters.documentType || ''}
              onChange={(e) => handleFilterChange('documentType', e.target.value)}
              options={[
                { value: '', label: 'Todos' },
                { value: 'cpf', label: 'CPF' },
                { value: 'cnpj', label: 'CNPJ' },
              ]}
            />
            <Input
              label="CPF"
              placeholder="Buscar por CPF..."
              value={filters.cpf || ''}
              onChange={(e) => handleFilterChange('cpf', e.target.value)}
            />
            <Input
              label="CNPJ"
              placeholder="Buscar por CNPJ..."
              value={filters.cnpj || ''}
              onChange={(e) => handleFilterChange('cnpj', e.target.value)}
            />
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="bg-[#FF4E3D]/10 border border-[#FF4E3D] rounded-lg p-4 mb-6">
            <p className="text-[#FF4E3D]">{error}</p>
          </div>
        )}

        {/* Tabela */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto"></div>
              <p className="mt-4 text-[#7E8691]">Carregando clientes...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[#7E8691]">Nenhum cliente encontrado</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#2A3038]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Nome</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Telefone</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Tipo</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Documento</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A3038]">
                    {customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-[#2A3038]/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-[#D0D6DE]">{customer.name}</td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">{customer.phone}</td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">{customer.email || '-'}</td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">
                          {customer.documentType === 'cpf' ? 'CPF' : 'CNPJ'}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">
                          {customer.documentType === 'cpf' ? (customer.cpf || '-') : (customer.cnpj || '-')}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Link href={`/customers/${customer.id}`}>
                              <Button variant="outline" size="sm">
                                Ver
                              </Button>
                            </Link>
                            <Link href={`/customers/${customer.id}/edit`}>
                              <Button variant="secondary" size="sm">
                                Editar
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(customer.id)}
                              className="text-[#FF4E3D] border-[#FF4E3D] hover:bg-[#FF4E3D]/10"
                            >
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 bg-[#2A3038] flex items-center justify-between">
                  <p className="text-sm text-[#7E8691]">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                    {pagination.total} clientes
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-[#D0D6DE]">
                      Página {pagination.page} de {pagination.totalPages}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

