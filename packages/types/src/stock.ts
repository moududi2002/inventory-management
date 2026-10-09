import type { DateRangeQuery, PaginationQuery } from './common';

/**
 * Stock transactions — every stock movement is logged.
 */

export type TransactionType = 'STOCK_IN' | 'SALE' | 'ADJUSTMENT' | 'RETURN';

export type AdjustmentReason =
  | 'DAMAGED'
  | 'LOST'
  | 'THEFT'
  | 'EXPIRED'
  | 'COUNT_MISMATCH'
  | 'OTHER';

export const ADJUSTMENT_REASON_LABELS: Record<AdjustmentReason, string> = {
  DAMAGED: 'Damaged',
  LOST: 'Lost',
  THEFT: 'Theft',
  EXPIRED: 'Expired',
  COUNT_MISMATCH: 'Stock Count Mismatch',
  OTHER: 'Other',
};

export interface StockTransaction {
  _id: string;
  transactionId: string;         // TXN-<timestamp>
  productId: string;
  sku: string;
  productName?: string;          // populated on read
  type: TransactionType;
  quantity: number;              // absolute, positive number
  direction: 'IN' | 'OUT';       // computed: IN = +stock, OUT = -stock
  previousStock: number;
  newStock: number;
  reason: string;                // free text, but ADJUSTMENT uses enum label
  adjustmentReason?: AdjustmentReason; // only for ADJUSTMENT type
  refId?: string | null;         // saleId if type=SALE or RETURN
  createdBy: string;
  createdAt: string;
}

export interface AddStockInput {
  productId: string;
  quantity: number;
  reason: string;                // e.g. "New Purchase", "Supplier X"
}

export interface AdjustStockInput {
  productId: string;
  newQuantity: number;           // target absolute quantity
  adjustmentReason: AdjustmentReason;
  note?: string;
}

export interface StockQuery extends PaginationQuery, DateRangeQuery {
  productId?: string;
  type?: TransactionType;
}
