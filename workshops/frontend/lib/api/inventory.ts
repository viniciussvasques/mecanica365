import { partsApi, Part, PartFilters, PartsResponse } from './parts';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface InventoryItem extends Part {
  stockStatus: StockStatus;
  stockValue: number; // quantity * costPrice
  profitMargin: number; // ((sellPrice - costPrice) / costPrice) * 100
}

export interface InventoryFilters extends PartFilters {
  stockStatus?: StockStatus;
  minStockValue?: number;
  maxStockValue?: number;
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  inStockItems: number;
  categories: Array<{
    name: string;
    count: number;
    totalValue: number;
  }>;
}

export type AlertStatus = 'low_stock' | 'out_of_stock';

export interface InventoryAlert {
  partId: string;
  partNumber?: string;
  name: string;
  currentQuantity: number;
  minQuantity: number;
  status: AlertStatus;
  category?: string;
  brand?: string;
  location?: string;
}

export interface InventoryMovement {
  id: string;
  partId: string;
  part: Part;
  type: 'entry' | 'exit' | 'adjustment';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  userId?: string;
  userName?: string;
  createdAt: string;
}

export interface InventoryResponse extends PartsResponse {
  data: InventoryItem[];
  stats?: InventoryStats;
}

/**
 * Calcula o status do estoque baseado na quantidade atual e mínima
 */
const calculateStockStatus = (quantity: number, minQuantity: number): StockStatus => {
  if (quantity === 0) return 'out_of_stock';
  if (quantity <= minQuantity) return 'low_stock';
  return 'in_stock';
};

/**
 * Converte Part para InventoryItem
 */
const toInventoryItem = (part: Part): InventoryItem => {
  const stockStatus = calculateStockStatus(part.quantity, part.minQuantity);
  const stockValue = part.quantity * part.costPrice;
  const profitMargin = part.costPrice > 0 
    ? ((part.sellPrice - part.costPrice) / part.costPrice) * 100 
    : 0;

  return {
    ...part,
    stockStatus,
    stockValue,
    profitMargin,
  };
};

/**
 * Calcula estatísticas do estoque
 */
const calculateStats = (items: InventoryItem[]): InventoryStats => {
  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + item.stockValue, 0);
  const lowStockItems = items.filter(item => item.stockStatus === 'low_stock').length;
  const outOfStockItems = items.filter(item => item.stockStatus === 'out_of_stock').length;
  const inStockItems = items.filter(item => item.stockStatus === 'in_stock').length;

  // Agrupar por categoria
  const categoryMap = new Map<string, { count: number; totalValue: number }>();
  items.forEach(item => {
    const category = item.category || 'Sem categoria';
    const existing = categoryMap.get(category) || { count: 0, totalValue: 0 };
    categoryMap.set(category, {
      count: existing.count + 1,
      totalValue: existing.totalValue + item.stockValue,
    });
  });

  const categories = Array.from(categoryMap.entries()).map(([name, data]) => ({
    name,
    ...data,
  }));

  return {
    totalItems,
    totalValue,
    lowStockItems,
    outOfStockItems,
    inStockItems,
    categories,
  };
};

export const inventoryApi = {
  /**
   * Lista itens de estoque com filtros e paginação
   */
  findAll: async (filters?: InventoryFilters): Promise<InventoryResponse> => {
    const partsResponse = await partsApi.findAll(filters);
    
    const inventoryItems: InventoryItem[] = partsResponse.data.map(toInventoryItem);
    
    // Filtrar por status de estoque se especificado
    let filteredItems = inventoryItems;
    if (filters?.stockStatus) {
      filteredItems = inventoryItems.filter(item => item.stockStatus === filters.stockStatus);
    }

    // Filtrar por valor mínimo/máximo se especificado
    if (filters?.minStockValue !== undefined) {
      filteredItems = filteredItems.filter(item => item.stockValue >= filters.minStockValue!);
    }
    if (filters?.maxStockValue !== undefined) {
      filteredItems = filteredItems.filter(item => item.stockValue <= filters.maxStockValue!);
    }

    // Calcular estatísticas
    const stats = calculateStats(inventoryItems);

    return {
      ...partsResponse,
      data: filteredItems,
      stats,
    };
  },

  /**
   * Busca um item de estoque por ID
   */
  findOne: async (id: string): Promise<InventoryItem> => {
    const part = await partsApi.findOne(id);
    return toInventoryItem(part);
  },

  /**
   * Obtém alertas de estoque baixo/zerado
   */
  getAlerts: async (): Promise<InventoryAlert[]> => {
    const response = await partsApi.findAll({ lowStock: true, isActive: true });
    
    return response.data
      .filter(part => part.quantity <= part.minQuantity)
      .map(part => ({
        partId: part.id,
        partNumber: part.partNumber,
        name: part.name,
        currentQuantity: part.quantity,
        minQuantity: part.minQuantity,
        status: (part.quantity === 0 ? 'out_of_stock' : 'low_stock') as AlertStatus,
        category: part.category,
        brand: part.brand,
        location: part.location,
      }));
  },

  /**
   * Obtém estatísticas do estoque
   */
  getStats: async (): Promise<InventoryStats> => {
    const response = await inventoryApi.findAll({ isActive: true });
    return response.stats || calculateStats(response.data);
  },

  /**
   * Atualiza quantidade de estoque (movimentação)
   */
  updateQuantity: async (id: string, quantity: number, reason?: string): Promise<InventoryItem> => {
    const part = await partsApi.update(id, { quantity });
    return toInventoryItem(part);
  },
};

