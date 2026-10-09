// apps/web/src/app/(dashboard)/reports/page.tsx

'use client';

import {
  TrendingUp,
  DollarSign,
  ArrowDownToLine,
  AlertTriangle,
  XCircle,
  Flame,
  PackageX,
  FolderTree,
  CalendarDays,
} from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { ReportCard } from '@/components/reports/report-card';

export default function ReportsHubPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description="Analyze sales, profit, and stock health"
      />

      {/* Info banner */}
      <Card className="hidden md:block">
        <CardContent className="p-4 text-sm text-muted-foreground">
          All reports support custom date ranges. Use the filter bar on each
          report page to change the period, group data, and export to CSV.
        </CardContent>
      </Card>

      {/* Sales & Profit */}
      <section className="space-y-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground px-1">
          Sales & Profit
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ReportCard
            href="/reports/sales"
            title="Sales Report"
            description="Daily, weekly, or monthly sales totals with quantities."
            icon={TrendingUp}
            tone="success"
          />
          <ReportCard
            href="/reports/profit"
            title="Profit Report"
            description="Per-product profit and margin %, ranked by contribution."
            icon={DollarSign}
            tone="success"
          />
          <ReportCard
            href="/reports/top-selling"
            title="Top Selling Products"
            description="Best performers by quantity, revenue, and profit."
            icon={Flame}
            tone="warning"
          />
          <ReportCard
            href="/reports/daily-summary"
            title="Daily Summary"
            description="One row per day: sales, profit, and returns."
            icon={CalendarDays}
            tone="info"
          />
        </div>
      </section>

      {/* Stock */}
      <section className="space-y-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground px-1">
          Stock
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ReportCard
            href="/reports/stock-movement"
            title="Stock Movement"
            description="Opening, in, out, adjustment, and closing per product."
            icon={ArrowDownToLine}
            tone="info"
          />
          <ReportCard
            href="/reports/category-stock"
            title="Category Stock"
            description="Stock value and quantity grouped by category."
            icon={FolderTree}
            tone="info"
          />
        </div>
      </section>

      {/* Alerts */}
      <section className="space-y-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground px-1">
          Alerts
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ReportCard
            href="/reports/low-stock"
            title="Low Stock"
            description="Products at or below their minimum stock level."
            icon={AlertTriangle}
            tone="warning"
          />
          <ReportCard
            href="/reports/out-of-stock"
            title="Out of Stock"
            description="Products with zero stock — needs restock immediately."
            icon={XCircle}
            tone="danger"
          />
          <ReportCard
            href="/reports/dead-stock"
            title="Dead Stock"
            description="Products with stock that haven't sold recently."
            icon={PackageX}
            tone="danger"
          />
        </div>
      </section>
    </div>
  );
}
