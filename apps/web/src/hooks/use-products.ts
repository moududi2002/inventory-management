// apps/web/src/hooks/use-products.ts

'use client';

// Product list / single / create / update / delete hooks.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api, getApiErrorMessage } from '@/lib/api';
import type {
  PaginatedResponse,
  Product,
  ProductListItem,
  ProductQuery,
  ProductStatus,
  CreateProductInput,
  UpdateProductInput,
} from '@inventory/types';

// ---------- Query keys ----------
// Any invalidation of ['products'] also invalidates 'products/list' etc.
const PRODUCTS_KEY = ['products'] as const;
const PRODUCT_KEY = (id: string) => ['product', id] as const;

// ---------- List ----------
export interface UseProductsParams {
  q?: string;
  categoryId?: string;
  status?: ProductStatus;
  page?: number;
  limit?: number;
}

export function useProducts(params: UseProductsParams) {
  // Build a stable query string for the cache key.
  const normalized: ProductQuery = {
    q: params.q?.trim() || undefined,
    categoryId: params.categoryId || undefined,
    status: params.status || undefined,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };

  return useQuery({
    queryKey: [...PRODUCTS_KEY, 'list', normalized],
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: PaginatedResponse<ProductListItem>;
      }>('/products', { params: normalized });
      return res.data.data;
    },
    placeholderData: (prev) => prev, // keeps prior page visible while loading
  });
}

// ---------- Single ----------
export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: id ? PRODUCT_KEY(id) : ['product', 'none'],
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: { product: Product };
      }>(`/products/${id}`);
      return res.data.data.product;
    },
    enabled: !!id,
  });
}

// ---------- Lookup by SKU ----------
export function useProductBySku(sku: string | undefined) {
  return useQuery({
    queryKey: ['product', 'sku', sku],
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: { product: Product | null };
      }>(`/products/lookup/${sku}`);
      return res.data.data.product;
    },
    enabled: !!sku && sku.length > 2,
  });
}

// ---------- Create ----------
export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      const res = await api.post<{
        success: true;
        data: { product: Product };
      }>('/products', input);
      return res.data.data.product;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Product created');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

// ---------- Update ----------
export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateProductInput) => {
      const res = await api.patch<{
        success: true;
        data: { product: Product };
      }>(`/products/${id}`, input);
      return res.data.data.product;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
      qc.invalidateQueries({ queryKey: PRODUCT_KEY(id) });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Product updated');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

// ---------- Delete (soft) ----------
export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Product deleted');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
