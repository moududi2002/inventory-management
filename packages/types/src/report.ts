import type { DateRangeQuery } from './common';

/**
 * Reports — all report types share a common filter shape.
 */

export type ReportType =
  | 'sales'
  | 'profit'
  | 'stock-movement'
  | 'low-stock'
  | 'out-of-stock'
  | 'top-selling'
  | 'dead-stock'
  | 'category-stock'
  | 'daily-summary';

export type GroupBy = 'day' | 'week' | 'month';

export interface ReportQuery extends DateRangeQuery {
  groupBy?: GroupBy;
  limit?: number;                 // for top-selling
  days?: number;                  // for dead-stock
  categoryId?: string;
}

// ---------- Sales Report ----------
export interface SalesReportRow {
  date: string;
  saleCount: number;
  totalQuantity: number;
  totalAmount: number;
  totalProfit: number;
}

export interface SalesReportResponse {
  summary: {
    totalSales: number;
    totalQuantity: number;
    totalAmount: number;
    totalProfit: number;
    totalRefunds: number;
  };
  rows: SalesReportRow[];
  range: { from: string; to: string };
}

// ---------- Profit Report ----------
export interface ProfitReportRow {
  productId: string;
  sku: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;          // (profit / revenue) * 100
}

export interface ProfitReportResponse {
  summary: {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    marginPercent: number;
  };
  rows: ProfitReportRow[];
  range: { from: string; to: string };
}

// ---------- Stock Movement ----------
export interface StockMovementRow {
  date: string;
  opening: number;
  stockIn: number;
  stockOut: number;
  adjustment: number;
  returnIn: number;
  closing: number;
}

export interface StockMovementReportResponse {
  productId: string;
  sku: string;
  productName: string;
  rows: StockMovementRow[];
  range: { from: string; to: string };
}

// ---------- Low Stock ----------
export interface LowStockReportRow {
  productId: string;
  sku: string;
  name: string;
  categoryName: string;
  currentStock: number;
  minimumStock: number;
  unit: string;
  status: 'LOW_STOCK' | 'OUT_OF_STOCK';
}

// ---------- Top Selling ----------
export interface TopSellingRow {
  productId: string;
  sku: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  profit: number;
}

// ---------- Dead Stock ----------
export interface DeadStockRow {
  productId: string;
  sku: string;
  productName: string;
  currentStock: number;
  stockValue: number;
  lastSoldAt: string | null;
  daysSinceLastSale: number | null;
}

// ---------- Category Stock ----------
export interface CategoryStockRow {
  categoryId: string;
  categoryName: string;
  productCount: number;
  totalQuantity: number;
  totalStockValue: number;
}

// ---------- Daily Summary ----------
export interface DailySummaryRow {
  date: string;
  saleCount: number;
  totalSales: number;
  totalProfit: number;
  totalReturns: number;
}
