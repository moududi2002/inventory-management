// apps/web/src/hooks/use-reports.ts

'use client';

// TanStack Query hooks for all reports.
// Every report takes { from?, to?, ... } and returns the shape defined in
// @inventory/types. Queries share a base key so useLiveStock can invalidate
// the whole group.

import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type {
  SalesReportResponse,
  ProfitReportResponse,
  StockMovementReportResponse,
  LowStockReportRow,
  TopSellingRow,
  DeadStockRow,
  CategoryStockRow,
  DailySummaryRow,
} from '@inventory/types';

// ---------- Shared query params shape ----------
export interface ReportRange {
  from?: string; // ISO
  to?: string;   // ISO
  groupBy?: 'day' | 'week' | 'month';
  limit?: number;
  days?: number;
  categoryId?: string;
}

const REPORTS_KEY = ['reports'] as const;

// ---------- 1) SALES ----------
export function useSalesReport(params: ReportRange) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'sales', params],
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: SalesReportResponse;
      }>('/reports/sales', { params });
      return res.data.data;
    },
    staleTime: 30_000,
  });
}

// ---------- 2) PROFIT ----------
export function useProfitReport(params: ReportRange) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'profit', params],
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: ProfitReportResponse;
      }>('/reports/profit', { params });
      return res.data.data;
    },
    staleTime: 30_000,
  });
}

// ---------- 3) STOCK MOVEMENT ----------
export interface StockMovementParams extends ReportRange {
  productId: string;
}
export function useStockMovementReport(params: StockMovementParams | null) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'stock-movement', params],
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: StockMovementReportResponse;
      }>('/reports/stock-movement', { params: params ?? {} });
      return res.data.data;
    },
    enabled: !!params?.productId,
    staleTime: 30_000,
  });
}

// ---------- 4) LOW STOCK ----------
export function useLowStockReport() {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'low-stock'],
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: { rows: LowStockReportRow[] };
      }>('/reports/low-stock');
      return res.data.data.rows;
    },
    staleTime: 30_000,
  });
}

// ---------- 5) OUT OF STOCK ----------
export function useOutOfStockReport() {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'out-of-stock'],
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: { rows: LowStockReportRow[] };
      }>('/reports/out-of-stock');
      return res.data.data.rows;
    },
    staleTime: 30_000,
  });
}

// ---------- 6) TOP SELLING ----------
export function useTopSellingReport(params: ReportRange) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'top-selling', params],
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: { rows: TopSellingRow[] };
      }>('/reports/top-selling', { params });
      return res.data.data.rows;
    },
    staleTime: 30_000,
  });
}

// ---------- 7) DEAD STOCK ----------
export function useDeadStockReport(params: ReportRange) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'dead-stock', params],
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: { rows: DeadStockRow[] };
      }>('/reports/dead-stock', { params });
      return res.data.data.rows;
    },
    staleTime: 30_000,
  });
}

// ---------- 8) CATEGORY STOCK ----------
export function useCategoryStockReport() {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'category-stock'],
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: { rows: CategoryStockRow[] };
      }>('/reports/category-stock');
      return res.data.data.rows;
    },
    staleTime: 60_000,
  });
}

// ---------- 9) DAILY SUMMARY ----------
export function useDailySummaryReport(params: ReportRange) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'daily-summary', params],
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: { rows: DailySummaryRow[] };
      }>('/reports/daily-summary', { params });
      return res.data.data.rows;
    },
    staleTime: 30_000,
  });
}
