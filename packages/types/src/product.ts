import type { Category } from './category';
import type { PaginationQuery } from './common';

/**
 * Product — core entity. Includes cost price for profit calculation.
 */

export type ProductStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface Product {
  _id: string;
  sku: string;                    // PRD-10001 (immutable)
  name: string;
  categoryId: string;
  category?: Category | null;     // populated on read
  unit: string;                   // pcs, kg, etc.
  currentStock: number;
  minimumStock: number;
  costPrice: number;              // buying price (for profit)
  unitPrice: number;              // selling price (default)
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// For list view — includes computed status
export interface ProductListItem {
  _id: string;
  sku: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  costPrice: number;
  unitPrice: number;
  imageUrl?: string | null;
  status: ProductStatus;
  stockValue: number;             // currentStock * unitPrice
  isActive: boolean;
}

export interface CreateProductInput {
  name: string;
  categoryId: string;
  unit?: string;
  currentStock?: number;
  minimumStock?: number;
  costPrice: number;
  unitPrice: number;
  imageUrl?: string | null;
}

export interface UpdateProductInput {
  name?: string;
  categoryId?: string;
  unit?: string;
  minimumStock?: number;
  costPrice?: number;
  unitPrice?: number;
  imageUrl?: string | null;
  isActive?: boolean;
}

export interface ProductQuery extends PaginationQuery {
  q?: string;                     // search by name or SKU
  categoryId?: string;
  status?: ProductStatus;
  isActive?: boolean;
  lowStockOnly?: boolean;
}

// Helper to compute status — used on both ends
export function getProductStatus(currentStock: number, minimumStock: number): ProductStatus {
  if (currentStock <= 0) return 'OUT_OF_STOCK';
  if (currentStock <= minimumStock) return 'LOW_STOCK';
  return 'IN_STOCK';
}
