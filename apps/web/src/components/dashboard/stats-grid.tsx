// apps/web/src/components/dashboard/stats-grid.tsx

'use client';

// 2-column grid on mobile, 4-column on desktop.
// Skeleton placeholders while loading.

import {
  Package,
  Boxes,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  XCircle,
  Wallet,
} from 'lucide-react';

import { StatCard } from './stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '@/hooks/use-dashboard';
import { formatMoneyCompact, formatNumber } from '@/lib/format';

export function StatsGrid() {
  const { data, isLoading } = useDashboardStats();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Row 1 */}
      <StatCard
        icon={Package}
        label="Products"
        value={formatNumber(data.totalProducts, 0)}
        hint="active items"
        href="/products"
      />

      <StatCard
        icon={Boxes}
        label="Total Stock"
        value={formatNumber(data.totalStockQuantity, 0)}
        hint={formatMoneyCompact(data.totalStockValue) + ' value'}
        href="/stock"
      />

      <StatCard
        icon={ShoppingCart}
        label="Today Sales"
        value={formatMoneyCompact(data.todaySales)}
        hint={`${formatNumber(data.todaySoldQuantity, 0)} pcs sold`}
        tone="success"
        href="/sales"
      />

      <StatCard
        icon={TrendingUp}
        label="Today Profit"
        value={formatMoneyCompact(data.todayProfit)}
        hint="gross profit"
        tone="success"
      />

      {/* Row 2 */}
      <StatCard
        icon={AlertTriangle}
        label="Low Stock"
        value={formatNumber(data.lowStockCount, 0)}
        hint="below minimum"
        tone={data.lowStockCount > 0 ? 'warning' : 'default'}
        href="/reports"
      />

      <StatCard
        icon={XCircle}
        label="Out of Stock"
        value={formatNumber(data.outOfStockCount, 0)}
        hint="needs restock"
        tone={data.outOfStockCount > 0 ? 'danger' : 'default'}
        href="/reports"
      />

      {/* Row 3 - fill remaining 2 slots with wider stat summary */}
      <StatCard
        icon={Wallet}
        label="Stock Value"
        value={formatMoneyCompact(data.totalStockValue)}
        hint="at selling price"
        className="col-span-2"
      />
    </div>
  );
}
