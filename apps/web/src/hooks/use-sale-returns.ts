// apps/web/src/hooks/use-sale-returns.ts

'use client';

// Global returns list (across all sales).

import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type {
  PaginatedResponse,
  SaleReturn,
} from '@inventory/types';

export interface UseReturnsParams {
  q?: string;
  saleId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export function useReturns(params: UseReturnsParams) {
  return useQuery({
    queryKey: ['returns', 'list', params],
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: PaginatedResponse<SaleReturn>;
      }>('/returns', { params });
      return res.data.data;
    },
    placeholderData: (prev) => prev,
  });
}
