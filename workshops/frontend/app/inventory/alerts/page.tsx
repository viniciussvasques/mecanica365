'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { inventoryApi, InventoryAlert, AlertStatus } from '@/lib/api/inventory';
import { Button } from '@/components/ui/Button';
import { logger } from '@/lib/utils/logger';
import { authStorage } from '@/lib/utils/localStorage';

const getStatusBadge = (status: AlertStatus) => {
  const badges = {
    low_stock: { label: 'Estoque Baixo', className: 'bg-[#FFA500]/20 text-[#FFA500]' },
    out_of_stock: { label: 'Sem Estoque', className: 'bg-[#FF4E3D]/20 text-[#FF4E3D]' },
  };
  const badge = badges[status];
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
      {badge.label}
    </span>
  );
};

export default function InventoryAlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadAlerts();
  }, []);

  const loadAlerts = async () => {
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

      logger.log('[InventoryAlertsPage] Carregando alertas com subdomain:', subdomain);
      const alertsData = await inventoryApi.getAlerts();
      setAlerts(alertsData);
    } catch (err: unknown) {
      logger.error('[InventoryAlertsPage] Erro ao carregar alertas:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar alertas';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const outOfStockAlerts = alerts.filter(alert => alert.status === 'out_of_stock');
  const lowStockAlerts = alerts.filter(alert => alert.status === 'low_stock');

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#D0D6DE] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#D0D6DE]">Alertas de Estoque</h1>
              <p className="text-[#7E8691] mt-2">Itens com estoque baixo ou zerado</p>
            </div>
            <Link href="/inventory">
              <Button variant="secondary">
                ← Voltar para Estoque
              </Button>
            </Link>
          </div>
        </div>

        {/* Resumo */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-[#FF4E3D]/10 border border-[#FF4E3D] rounded-lg p-4">
              <p className="text-sm text-[#7E8691] mb-1">Sem Estoque</p>
              <p className="text-3xl font-bold text-[#FF4E3D]">{outOfStockAlerts.length}</p>
            </div>
            <div className="bg-[#FFA500]/10 border border-[#FFA500] rounded-lg p-4">
              <p className="text-sm text-[#7E8691] mb-1">Estoque Baixo</p>
              <p className="text-3xl font-bold text-[#FFA500]">{lowStockAlerts.length}</p>
            </div>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="bg-[#FF4E3D]/10 border border-[#FF4E3D] rounded-lg p-4 mb-6">
            <p className="text-[#FF4E3D]">{error}</p>
          </div>
        )}

        {/* Lista de Alertas */}
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-lg overflow-hidden">
          {loading && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E0B8] mx-auto"></div>
              <p className="mt-4 text-[#7E8691]">Carregando alertas...</p>
            </div>
          )}
          {!loading && alerts.length === 0 && (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-[#7E8691] text-lg">Nenhum alerta de estoque</p>
              <p className="text-[#7E8691] text-sm mt-2">Todos os itens estão com estoque adequado</p>
            </div>
          )}
          {!loading && alerts.length > 0 && (
            <>
              {/* Sem Estoque */}
              {outOfStockAlerts.length > 0 && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-[#FF4E3D] mb-4">
                    ⚠️ Sem Estoque ({outOfStockAlerts.length})
                  </h2>
                  <div className="space-y-3">
                    {outOfStockAlerts.map((alert) => (
                      <div
                        key={alert.partId}
                        className="bg-[#FF4E3D]/10 border border-[#FF4E3D] rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-[#D0D6DE]">{alert.name}</h3>
                              {getStatusBadge(alert.status)}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-[#7E8691]">Código</p>
                                <p className="text-[#D0D6DE]">{alert.partNumber || '-'}</p>
                              </div>
                              <div>
                                <p className="text-[#7E8691]">Quantidade Atual</p>
                                <p className="text-[#FF4E3D] font-bold">{alert.currentQuantity}</p>
                              </div>
                              <div>
                                <p className="text-[#7E8691]">Quantidade Mínima</p>
                                <p className="text-[#D0D6DE]">{alert.minQuantity}</p>
                              </div>
                              <div>
                                <p className="text-[#7E8691]">Localização</p>
                                <p className="text-[#D0D6DE]">{alert.location || '-'}</p>
                              </div>
                            </div>
                            {(alert.category || alert.brand) && (
                              <div className="flex gap-4 mt-2 text-sm text-[#7E8691]">
                                {alert.category && <span>Categoria: {alert.category}</span>}
                                {alert.brand && <span>Marca: {alert.brand}</span>}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <Link href={`/parts/${alert.partId}/edit`}>
                              <Button variant="primary" size="sm">
                                Reabastecer
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Estoque Baixo */}
              {lowStockAlerts.length > 0 && (
                <div className={`p-6 ${outOfStockAlerts.length > 0 ? 'border-t border-[#2A3038]' : ''}`}>
                  <h2 className="text-xl font-semibold text-[#FFA500] mb-4">
                    ⚠️ Estoque Baixo ({lowStockAlerts.length})
                  </h2>
                  <div className="space-y-3">
                    {lowStockAlerts.map((alert) => (
                      <div
                        key={alert.partId}
                        className="bg-[#FFA500]/10 border border-[#FFA500] rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-[#D0D6DE]">{alert.name}</h3>
                              {getStatusBadge(alert.status)}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-[#7E8691]">Código</p>
                                <p className="text-[#D0D6DE]">{alert.partNumber || '-'}</p>
                              </div>
                              <div>
                                <p className="text-[#7E8691]">Quantidade Atual</p>
                                <p className="text-[#FFA500] font-bold">{alert.currentQuantity}</p>
                              </div>
                              <div>
                                <p className="text-[#7E8691]">Quantidade Mínima</p>
                                <p className="text-[#D0D6DE]">{alert.minQuantity}</p>
                              </div>
                              <div>
                                <p className="text-[#7E8691]">Localização</p>
                                <p className="text-[#D0D6DE]">{alert.location || '-'}</p>
                              </div>
                            </div>
                            {(alert.category || alert.brand) && (
                              <div className="flex gap-4 mt-2 text-sm text-[#7E8691]">
                                {alert.category && <span>Categoria: {alert.category}</span>}
                                {alert.brand && <span>Marca: {alert.brand}</span>}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <Link href={`/parts/${alert.partId}/edit`}>
                              <Button variant="secondary" size="sm">
                                Reabastecer
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
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

