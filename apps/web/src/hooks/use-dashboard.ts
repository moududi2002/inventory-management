// apps/web/src/hooks/use-dashboard.ts

'use client';

// TanStack Query hooks for the dashboard.
// All keys start with ['dashboard'] so useLiveStock() can invalidate the
// whole group with a single call.

import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type {
  DashboardStats,
  RecentActivityItem,
  LowStockProduct,
  SalesChartPoint,
} from '@inventory/types';

// ---------- Stats ----------
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: { stats: DashboardStats } }>(
        '/dashboard/stats',
      );
      return res.data.data.stats;
    },
    // 30s stale — socket invalidations cover live updates.
    staleTime: 30_000,
  });
}

// ---------- Recent activity ----------
export function useRecentActivity(limit = 8) {
  return useQuery({
    queryKey: ['dashboard', 'recent-activity', limit],
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: { items: RecentActivityItem[] };
      }>(`/dashboard/recent-activity?limit=${limit}`);
      return res.data.data.items;
    },
    staleTime: 15_000,
  });
}

// ---------- Low stock ----------
export function useLowStock(limit = 8) {
  return useQuery({
    queryKey: ['dashboard', 'low-stock', limit],
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: { items: LowStockProduct[] };
      }>(`/dashboard/low-stock?limit=${limit}`);
      return res.data.data.items;
    },
    staleTime: 30_000,
  });
}

// ---------- Sales chart ----------
export function useSalesChart(days: number = 7) {
  return useQuery({
    queryKey: ['dashboard', 'sales-chart', days],
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: { points: SalesChartPoint[] };
      }>(`/dashboard/sales-chart?days=${days}`);
      return res.data.data.points;
    },
    staleTime: 60_000,
  });
}
