// apps/web/src/app/(dashboard)/dashboard/page.tsx

'use client';

import { StatsGrid } from '@/components/dashboard/stats-grid';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { SearchBar } from '@/components/dashboard/search-bar';
import { RecentActivityList } from '@/components/dashboard/recent-activity-list';
import { LowStockWidget } from '@/components/dashboard/low-stock-widget';
import { SalesChart } from '@/components/dashboard/sales-chart';

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      {/* Search - top priority on mobile */}
      <SearchBar />

      {/* Quick actions - New Sale / Add Stock */}
      <QuickActions />

      {/* KPI grid */}
      <StatsGrid />

      {/* Sales chart */}
      <SalesChart />

      {/* Two-column on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RecentActivityList />
        <LowStockWidget />
      </div>
    </div>
  );
}
