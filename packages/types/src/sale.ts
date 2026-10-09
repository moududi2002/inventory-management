/**
 * Sale — supports multiple items per receipt, snapshots cost/price per item.
 */

export type SaleStatus = 'COMPLETED' | 'PARTIALLY_RETURNED' | 'FULLY_RETURNED';

export interface SaleItem {
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPriceAtSale: number;        // snapshot
  costPriceAtSale: number;        // snapshot (for profit)
  subtotal: number;               // quantity * unitPriceAtSale
  profit: number;                 // (unitPrice - costPrice) * quantity
  returnedQuantity: number;       // how many returned so far
}

export interface Sale {
  _id: string;
  saleId: string;                 // SL-000001
  items: SaleItem[];
  subtotal: number;
  discount: number;               // fixed amount, default 0
  totalAmount: number;            // subtotal - discount
  totalProfit: number;
  status: SaleStatus;
  soldAt: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleListItem {
  _id: string;
  saleId: string;
  itemCount: number;
  totalQuantity: number;
  totalAmount: number;
  totalProfit: number;
  status: SaleStatus;
  soldAt: string;
  firstItemName: string;          // for display: "Premium T-Shirt +2 more"
}

export interface CreateSaleItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number;             // if omitted, uses product.unitPrice
}

export interface CreateSaleInput {
  items: CreateSaleItemInput[];
  discount?: number;
  soldAt?: string;                // optional custom time (default: now)
}

export interface SaleQuery extends PaginationQuery, DateRangeQuery {
  q?: string;                     // search by saleId
  status?: SaleStatus;
}

// ---------- Sale Return ----------

export interface SaleReturnItem {
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPriceAtSale: number;
  refundAmount: number;           // quantity * unitPriceAtSale
}

export interface SaleReturn {
  _id: string;
  returnId: string;               // RT-00001
  saleId: string;                 // ref to Sale.saleId
  saleObjectId: string;           // ref to Sale._id
  items: SaleReturnItem[];
  totalRefundAmount: number;
  reason: string;
  returnedAt: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateSaleReturnInput {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  reason: string;
}

export interface SaleReturnQuery extends PaginationQuery, DateRangeQuery {
  saleId?: string;
  q?: string;
}



export interface SaleReturn {
  _id: string;
  returnId: string;               // RT-00001
  saleId: string;                 // ref to Sale.saleId (SL-000001)
  saleObjectId: string;           // ref to Sale._id
  items: SaleReturnItem[];
  totalRefundAmount: number;
  reason: string;
  returnedAt: string;
  createdBy: string;
  createdAt: string;
}
