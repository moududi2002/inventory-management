// apps/web/src/hooks/use-stock.ts

'use client';

// Stock mutations + history queries.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api, getApiErrorMessage } from '@/lib/api';
import type {
  PaginatedResponse,
  StockTransaction,
  TransactionType,
  AdjustmentReason,
} from '@inventory/types';


import type { ProductListItem } from '@inventory/types';

export function useProductSearch(query: string, enabled = true) {
  const q = query.trim();
  return useQuery({
    queryKey: ['products', 'search-picker', q],
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: PaginatedResponse<ProductListItem>;
      }>('/products', {
        params: { q: q || undefined, limit: 8, page: 1, sortBy: 'name', sortOrder: 'asc' },
      });
      return res.data.data.data;
    },
    enabled: enabled && q.length >= 1,
    staleTime: 15_000,
  });
}

// ---------- Full transaction list with type + date filters ----------
export interface UseStockHistoryParams {
  productId?: string;
  type?: TransactionType;
  from?: string; // ISO
  to?: string;   // ISO
  page?: number;
  limit?: number;
}

export function useStockHistory(params: UseStockHistoryParams) {
  return useQuery({
    queryKey: ['stock-transactions', 'history', params],
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: PaginatedResponse<StockTransaction>;
      }>('/stock/transactions', { params });
      return res.data.data;
    },
    placeholderData: (prev) => prev,
  });
}

// ---------- List transactions ----------
export interface UseStockTransactionsParams {
  productId?: string;
  type?: TransactionType;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export function useStockTransactions(params: UseStockTransactionsParams) {
  return useQuery({
    queryKey: ['stock-transactions', params],
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: PaginatedResponse<StockTransaction>;
      }>('/stock/transactions', { params });
      return res.data.data;
    },
  });
}

// ---------- Product history (shortcut) ----------
export function useProductStockHistory(productId: string | undefined, limit = 5) {
  return useQuery({
    queryKey: ['stock-transactions', 'product', productId, limit],
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: PaginatedResponse<StockTransaction>;
      }>(`/stock/history/${productId}`, {
        params: { limit, page: 1 },
      });
      return res.data.data;
    },
    enabled: !!productId,
    staleTime: 10_000,
  });
}

// ---------- Add stock ----------
export interface AddStockInput {
  productId: string;
  quantity: number;
  reason: string;
}

export function useAddStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddStockInput) => {
      const res = await api.post<{
        success: true;
        data: {
          productId: string;
          sku: string;
          previousStock: number;
          newStock: number;
          transactionId: string;
        };
      }>('/stock/add', input);
      return res.data.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['product', data.productId] });
      qc.invalidateQueries({ queryKey: ['stock-transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Stock updated: ${data.previousStock} → ${data.newStock}`);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

// ---------- Adjust stock ----------
export interface AdjustStockInput {
  productId: string;
  newQuantity: number;
  adjustmentReason: AdjustmentReason;
  note?: string;
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AdjustStockInput) => {
      const res = await api.post<{
        success: true;
        data: {
          productId: string;
          sku: string;
          previousStock: number;
          newStock: number;
          transactionId: string;
        };
      }>('/stock/adjust', input);
      return res.data.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['product', data.productId] });
      qc.invalidateQueries({ queryKey: ['stock-transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Stock adjusted: ${data.previousStock} → ${data.newStock}`);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
