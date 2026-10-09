// apps/web/src/app/(dashboard)/reports/sales/page.tsx

'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ReportShell } from '@/components/reports/report-shell';
import { ReportSummaryCards } from '@/components/reports/report-summary-cards';
import { ReportTable, type ReportColumn } from '@/components/reports/report-table';
import { useSalesReport } from '@/hooks/use-reports';
import { formatMoney, formatMoneyCompact, formatNumber } from '@/lib/format';
import type { SalesReportRow } from '@inventory/types';
import { cn } from '@/lib/utils';

type GroupBy = 'day' | 'week' | 'month';

export default function SalesReportPage() {
  // Default: last 30 days
  const [range, setRange] = useState<{
    from?: string;
    to?: string;
  }>(() => {
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    const from = new Date();
    from.setDate(from.getDate() - 29);
    from.setHours(0, 0, 0, 0);
    return { from: from.toISOString(), to: to.toISOString() };
  });

  const [groupBy, setGroupBy] = useState<GroupBy>('day');

  const params = useMemo(
    () => ({ from: range.from, to: range.to, groupBy }),
    [range.from, range.to, groupBy],
  );

  const { data, isLoading } = useSalesReport(params);

  const columns: ReportColumn<SalesReportRow>[] = [
    {
      key: 'date',
      label: 'Date',
      render: (r) => <span className="font-mono text-xs">{r.date}</span>,
    },
    {
      key: 'saleCount',
      label: 'Sales',
      align: 'right',
      render: (r) => formatNumber(r.saleCount, 0),
    },
    {
      key: 'totalQuantity',
      label: 'Qty Sold',
      align: 'right',
      render: (r) => formatNumber(r.totalQuantity, 0),
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      align: 'right',
      render: (r) => formatMoney(r.totalAmount),
    },
    {
      key: 'totalProfit',
      label: 'Profit',
      align: 'right',
      className: 'text-emerald-600 dark:text-emerald-500',
      render: (r) => formatMoney(r.totalProfit),
    },
  ];

  return (
    <ReportShell
      title="Sales Report"
      description={
        data
          ? `${formatNumber(data.summary.totalSales, 0)} sales · ${formatNumber(data.summary.totalQuantity, 0)} units`
          : 'Totals per day, week, or month'
      }
      range={range}
      onRangeChange={(r) => setRange(r)}
      exportType="sales"
      exportParams={{ from: range.from, to: range.to }}
      filterSlot={
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0">Group by:</span>
          <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
            {(['day', 'week', 'month'] as GroupBy[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroupBy(g)}
                className={cn(
                  'h-7 px-3 rounded-md text-xs font-medium capitalize',
                  groupBy === g
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      }
    >
      {data && (
        <ReportSummaryCards
          items={[
            {
              label: 'Total Sales',
              value: formatNumber(data.summary.totalSales, 0),
            },
            {
              label: 'Total Amount',
              value: formatMoney(data.summary.totalAmount),
              tone: 'info',
            },
            {
              label: 'Total Profit',
              value: formatMoney(data.summary.totalProfit),
              tone: 'success',
            },
            {
              label: 'Refunds',
              value: formatMoney(data.summary.totalRefunds),
              tone: 'danger',
            },
          ]}
        />
      )}

      {/* Chart */}
      {data && data.rows.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesReportFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/60" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: string) => v.slice(-5)}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: number) => formatMoneyCompact(v)}
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--color-card))',
                    border: '1px solid hsl(var(--color-border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value) => [formatMoney(Number(value ?? 0)), 'Sales']}
                />
                <Area
                  type="monotone"
                  dataKey="totalAmount"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#salesReportFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <ReportTable
        columns={columns}
        rows={data?.rows}
        isLoading={isLoading}
        rowKey={(r) => r.date}
      />
    </ReportShell>
  );
}
