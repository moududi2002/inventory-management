/**
 * Dashboard aggregate stats.
 */

export interface DashboardStats {
  totalProducts: number;
  totalStockQuantity: number;
  totalStockValue: number;        // sum of (currentStock * unitPrice)
  todaySales: number;             // sum of totalAmount
  todaySoldQuantity: number;
  todayProfit: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface RecentActivityItem {
  transactionId: string;
  productId: string;
  sku: string;
  productName: string;
  type: TransactionType;          // imported from stock.ts
  quantity: number;
  direction: 'IN' | 'OUT';
  newStock: number;
  reason: string;
  createdAt: string;
}

export interface LowStockProduct {
  _id: string;
  sku: string;
  name: string;
  currentStock: number;
  minimumStock: number;
  unit: string;
  imageUrl?: string | null;
  status: 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface SalesChartPoint {
  date: string;                   // YYYY-MM-DD
  totalSales: number;
  totalQuantity: number;
  totalProfit: number;
}
