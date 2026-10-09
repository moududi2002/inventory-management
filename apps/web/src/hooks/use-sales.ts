// apps/web/src/hooks/use-sales.ts

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api, getApiErrorMessage } from '@/lib/api';
import type {
  PaginatedResponse,
  Sale,
  SaleListItem,
  SaleStatus,
  CreateSaleInput,
  CreateSaleReturnInput,
  SaleReturn,
} from '@inventory/types';

const SALES_KEY = ['sales'] as const;
const SALE_KEY = (id: string) => ['sale', id] as const;

// ---------- List ----------
export interface UseSalesParams {
  q?: string;
  status?: SaleStatus;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export function useSales(params: UseSalesParams) {
  return useQuery({
    queryKey: [...SALES_KEY, 'list', params],
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: PaginatedResponse<SaleListItem>;
      }>('/sales', { params });
      return res.data.data;
    },
    placeholderData: (prev) => prev,
  });
}

// ---------- Single (by ObjectId) ----------
export function useSale(id: string | undefined) {
  return useQuery({
    queryKey: id ? SALE_KEY(id) : ['sale', 'none'],
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: { sale: Sale };
      }>(`/sales/${id}`);
      return res.data.data.sale;
    },
    enabled: !!id,
  });
}

// ---------- Create ----------
export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSaleInput) => {
      const res = await api.post<{
        success: true;
        data: { sale: Sale };
      }>('/sales', input);
      return res.data.data.sale;
    },
    onSuccess: (sale) => {
      qc.invalidateQueries({ queryKey: SALES_KEY });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['stock-transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Sale ${sale.saleId} created`);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

// ---------- Create Return ----------
export function useCreateSaleReturn(saleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSaleReturnInput) => {
      const res = await api.post<{
        success: true;
        data: { return: SaleReturn };
      }>(`/sales/${saleId}/return`, input);
      return res.data.data.return;
    },
    onSuccess: (ret) => {
      qc.invalidateQueries({ queryKey: SALES_KEY });
      qc.invalidateQueries({ queryKey: SALE_KEY(saleId) });
      qc.invalidateQueries({ queryKey: ['returns'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['stock-transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Return ${ret.returnId} recorded`);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

// ---------- Returns for a specific sale ----------
export function useSaleReturns(saleId: string | undefined) {
  return useQuery({
    queryKey: ['returns', 'sale', saleId],
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: { returns: SaleReturn[] };
      }>(`/sales/${saleId}/returns`);
      return res.data.data.returns;
    },
    enabled: !!saleId,
  });
}
