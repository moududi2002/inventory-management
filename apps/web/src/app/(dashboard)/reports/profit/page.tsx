// apps/web/src/app/(dashboard)/reports/profit/page.tsx

'use client';

import { useMemo, useState } from 'react';

import { ReportShell } from '@/components/reports/report-shell';
import { ReportSummaryCards } from '@/components/reports/report-summary-cards';
import { ReportTable, type ReportColumn } from '@/components/reports/report-table';
import { useProfitReport } from '@/hooks/use-reports';
import { formatMoney, formatNumber } from '@/lib/format';
import type { ProfitReportRow } from '@inventory/types';
import { cn } from '@/lib/utils';

export default function ProfitReportPage() {
  const [range, setRange] = useState<{ from?: string; to?: string }>(() => {
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    const from = new Date();
    from.setDate(from.getDate() - 29);
    from.setHours(0, 0, 0, 0);
    return { from: from.toISOString(), to: to.toISOString() };
  });

  const params = useMemo(
    () => ({ from: range.from, to: range.to }),
    [range.from, range.to],
  );
  const { data, isLoading } = useProfitReport(params);

  const columns: ReportColumn<ProfitReportRow>[] = [
    {
      key: 'sku',
      label: 'SKU',
      render: (r) => <span className="font-mono text-xs">{r.sku}</span>,
    },
    {
      key: 'productName',
      label: 'Product',
      render: (r) => <span className="font-medium">{r.productName}</span>,
    },
    {
      key: 'quantitySold',
      label: 'Qty',
      align: 'right',
      render: (r) => formatNumber(r.quantitySold, 0),
    },
    {
      key: 'revenue',
      label: 'Revenue',
      align: 'right',
      render: (r) => formatMoney(r.revenue),
    },
    {
      key: 'cost',
      label: 'Cost',
      align: 'right',
      className: 'text-muted-foreground',
      render: (r) => formatMoney(r.cost),
    },
    {
      key: 'profit',
      label: 'Profit',
      align: 'right',
      className: 'text-emerald-600 dark:text-emerald-500 font-semibold',
      render: (r) => formatMoney(r.profit),
    },
    {
      key: 'marginPercent',
      label: 'Margin',
      align: 'right',
      render: (r) => (
        <span
          className={cn(
            'inline-block px-1.5 py-0.5 rounded text-xs tabular-nums',
            r.marginPercent >= 30
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : r.marginPercent >= 15
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                : 'bg-red-500/10 text-red-700 dark:text-red-400',
          )}
        >
          {r.marginPercent.toFixed(1)}%
        </span>
      ),
    },
  ];

  return (
    <ReportShell
      title="Profit Report"
      description="Per-product profit and margin"
      range={range}
      onRangeChange={(r) => setRange(r)}
      exportType="profit"
      exportParams={{ from: range.from, to: range.to }}
    >
      {data && (
        <ReportSummaryCards
          items={[
            {
              label: 'Revenue',
              value: formatMoney(data.summary.totalRevenue),
            },
            {
              label: 'Cost',
              value: formatMoney(data.summary.totalCost),
              tone: 'warning',
            },
            {
              label: 'Profit',
              value: formatMoney(data.summary.totalProfit),
              tone: 'success',
            },
            {
              label: 'Margin',
              value: `${data.summary.marginPercent.toFixed(1)}%`,
              tone:
                data.summary.marginPercent >= 20
                  ? 'success'
                  : data.summary.marginPercent >= 10
                    ? 'warning'
                    : 'danger',
            },
          ]}
        />
      )}

      <ReportTable
        columns={columns}
        rows={data?.rows}
        isLoading={isLoading}
        rowKey={(r) => r.productId}
      />
    </ReportShell>
  );
}
