'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { suppliersApi, Supplier, SupplierFilters } from '@/lib/api/suppliers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export const dynamic = 'force-dynamic';

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SupplierFilters>({
    page: 1,
    limit: 20,
    isActive: true,
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

    loadSuppliers();
  }, [filters]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
      
      const response = await suppliersApi.findAll(filters);
      setSuppliers(response.data);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      });
    } catch (err: unknown) {
      console.error('[SuppliersPage] Erro ao carregar fornecedores:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar fornecedores';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof SupplierFilters, value: string | boolean | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
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
    if (!confirm('Tem certeza que deseja excluir este fornecedor?')) {
      return;
    }

    try {
      await suppliersApi.remove(id);
      await loadSuppliers();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir fornecedor';
      alert(errorMessage);
      console.error('Erro ao excluir fornecedor:', err);
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

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-[#D0D6DE]">Fornecedores</h1>
            <Link href="/suppliers/new">
              <Button variant="primary">
                + Novo Fornecedor
              </Button>
            </Link>
          </div>
          <p className="text-[#7E8691]">Gerencie seus fornecedores</p>
        </div>

        {/* Filtros */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#D0D6DE] mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Buscar"
              placeholder="Nome, documento ou email..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <Input
              label="Cidade"
              placeholder="Filtrar por cidade..."
              value={filters.city || ''}
              onChange={(e) => handleFilterChange('city', e.target.value)}
            />
            <Input
              label="Estado"
              placeholder="Filtrar por estado (UF)..."
              value={filters.state || ''}
              onChange={(e) => handleFilterChange('state', e.target.value)}
            />
            <Select
              label="Status"
              value={filters.isActive === undefined ? '' : filters.isActive.toString()}
              onChange={(e) =>
                handleFilterChange(
                  'isActive',
                  e.target.value === '' ? undefined : e.target.value === 'true',
                )
              }
              options={[
                { value: '', label: 'Todos' },
                { value: 'true', label: 'Ativos' },
                { value: 'false', label: 'Inativos' },
              ]}
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
          {loading && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto"></div>
              <p className="mt-4 text-[#7E8691]">Carregando fornecedores...</p>
            </div>
          )}
          {!loading && suppliers.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-[#7E8691]">Nenhum fornecedor encontrado</p>
            </div>
          )}
          {!loading && suppliers.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#2A3038]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Nome</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Documento</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Contato</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Cidade/Estado</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A3038]">
                    {suppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-[#2A3038]/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-[#D0D6DE]">{supplier.name}</td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">
                          {supplier.document ? formatDocument(supplier.document, supplier.documentType) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">
                          <div>
                            {supplier.phone && <div>{supplier.phone}</div>}
                            {supplier.email && <div className="text-xs">{supplier.email}</div>}
                            {!supplier.phone && !supplier.email && '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#7E8691]">
                          {supplier.city && supplier.state ? `${supplier.city}/${supplier.state}` : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              supplier.isActive
                                ? 'bg-[#00E0B8]/20 text-[#00E0B8]'
                                : 'bg-[#FF4E3D]/20 text-[#FF4E3D]'
                            }`}
                          >
                            {supplier.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Link href={`/suppliers/${supplier.id}`}>
                              <Button variant="outline" size="sm">
                                Ver
                              </Button>
                            </Link>
                            <Link href={`/suppliers/${supplier.id}/edit`}>
                              <Button variant="secondary" size="sm">
                                Editar
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(supplier.id)}
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
                    {pagination.total} fornecedores
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

