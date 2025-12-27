'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { inventoryApi, InventoryItem } from '@/lib/api/inventory';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { logger } from '@/lib/utils/logger';
import { authStorage } from '@/lib/utils/localStorage';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function InventoryMovementsPage() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = authStorage.getToken();
      const subdomain = authStorage.getSubdomain();

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

      logger.log('[InventoryMovementsPage] Carregando itens com subdomain:', subdomain);
      const response = await inventoryApi.findAll({ isActive: true, limit: 1000 });
      setItems(response.data);
    } catch (err: unknown) {
      logger.error('[InventoryMovementsPage] Erro ao carregar itens:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar itens';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.partNumber?.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower) ||
      item.brand?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#D0D6DE]">Movimentações de Estoque</h1>
              <p className="text-[#7E8691] mt-2">Histórico de alterações no estoque</p>
            </div>
            <Link href="/inventory">
              <Button variant="secondary">
                ← Voltar para Estoque
              </Button>
            </Link>
          </div>
        </div>

        {/* Nota */}
        <div className="bg-[#3ABFF8]/10 border border-[#3ABFF8] rounded-lg p-4 mb-6">
          <p className="text-[#3ABFF8] text-sm">
            ℹ️ <strong>Nota:</strong> O histórico detalhado de movimentações será implementado em uma versão futura.
            Por enquanto, você pode visualizar as informações atuais de cada item e editar as quantidades diretamente nas peças.
          </p>
        </div>

        {/* Busca */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg p-6 mb-6">
          <Input
            label="Buscar"
            placeholder="Nome, código, categoria ou marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Erro */}
        {error && (
          <div className="bg-[#FF4E3D]/10 border border-[#FF4E3D] rounded-lg p-4 mb-6">
            <p className="text-[#FF4E3D]">{error}</p>
          </div>
        )}

        {/* Lista de Itens */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg overflow-hidden">
          {loading && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto"></div>
              <p className="mt-4 text-[#7E8691]">Carregando itens...</p>
            </div>
          )}
          {!loading && filteredItems.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-[#7E8691]">Nenhum item encontrado</p>
            </div>
          )}
          {!loading && filteredItems.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#2A3038]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Código</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Nome</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Quantidade Atual</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Valor Estoque</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Última Atualização</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#D0D6DE]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A3038]">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[#2A3038]/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-[#7E8691]">{item.partNumber || '-'}</td>
                      <td className="px-6 py-4 text-sm text-[#D0D6DE]">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-[#D0D6DE] font-medium">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#D0D6DE]">
                        {formatCurrency(item.stockValue)}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#7E8691]">
                        {formatDate(item.updatedAt)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Link href={`/parts/${item.id}/edit`}>
                            <Button variant="secondary" size="sm">
                              Editar Quantidade
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

