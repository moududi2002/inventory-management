/**
 * Socket.IO event names and payloads — single source of truth.
 */

export const SOCKET_NAMESPACE = '/live';

export const SOCKET_EVENTS = {
  STOCK_UPDATED: 'stock:updated',
  SALE_CREATED: 'sale:created',
  SALE_RETURNED: 'sale:returned',
  PRODUCT_CREATED: 'product:created',
  PRODUCT_UPDATED: 'product:updated',
  PRODUCT_DELETED: 'product:deleted',
  DASHBOARD_REFRESH: 'dashboard:refresh',
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

// ---------- Payloads ----------

export interface StockUpdatedPayload {
  productId: string;
  sku: string;
  newStock: number;
  type: 'STOCK_IN' | 'SALE' | 'ADJUSTMENT' | 'RETURN';
}

export interface SaleCreatedPayload {
  saleId: string;
  totalAmount: number;
  totalProfit: number;
}

export interface SaleReturnedPayload {
  saleId: string;
  returnId: string;
  refundAmount: number;
}

export interface ProductCreatedPayload {
  productId: string;
  sku: string;
  name: string;
}

export interface ProductUpdatedPayload {
  productId: string;
  sku: string;
}

export interface ProductDeletedPayload {
  productId: string;
  sku: string;
}

export interface DashboardRefreshPayload {
  reason: string;
}

// ---------- Union type for type-safe emit/on ----------

export interface ServerToClientEvents {
  'stock:updated': (payload: StockUpdatedPayload) => void;
  'sale:created': (payload: SaleCreatedPayload) => void;
  'sale:returned': (payload: SaleReturnedPayload) => void;
  'product:created': (payload: ProductCreatedPayload) => void;
  'product:updated': (payload: ProductUpdatedPayload) => void;
  'product:deleted': (payload: ProductDeletedPayload) => void;
  'dashboard:refresh': (payload: DashboardRefreshPayload) => void;
}

export interface ClientToServerEvents {
  // No client → server events needed right now.
  // Reserved for future (e.g., 'ping').
}
