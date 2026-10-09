// apps/web/src/app/(dashboard)/reports/daily-summary/page.tsx

'use client';

import { useMemo, useState } from 'react';

import { ReportShell } from '@/components/reports/report-shell';
import { ReportTable, type ReportColumn } from '@/components/reports/report-table';
import { ReportSummaryCards } from '@/components/reports/report-summary-cards';
import { useDailySummaryReport } from '@/hooks/use-reports';
import { formatMoney, formatNumber } from '@/lib/format';
import type { DailySummaryRow } from '@inventory/types';

export default function DailySummaryReportPage() {
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
  const { data, isLoading } = useDailySummaryReport(params);

  const totals = (data ?? []).reduce(
    (acc, r) => ({
      saleCount: acc.saleCount + r.saleCount,
      sales: acc.sales + r.totalSales,
      profit: acc.profit + r.totalProfit,
      returns: acc.returns + r.totalReturns,
    }),
    { saleCount: 0, sales: 0, profit: 0, returns: 0 },
  );

  const columns: ReportColumn<DailySummaryRow>[] = [
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
      key: 'totalSales',
      label: 'Total Sales',
      align: 'right',
      className: 'font-semibold',
      render: (r) => formatMoney(r.totalSales),
    },
    {
      key: 'totalProfit',
      label: 'Profit',
      align: 'right',
      className: 'text-emerald-600 dark:text-emerald-500',
      render: (r) => formatMoney(r.totalProfit),
    },
    {
      key: 'totalReturns',
      label: 'Returns',
      align: 'right',
      className: 'text-red-600 dark:text-red-500',
      render: (r) => (r.totalReturns > 0 ? `- ${formatMoney(r.totalReturns)}` : '—'),
    },
  ];

  return (
    <ReportShell
      title="Daily Summary"
      description="Sales, profit, and returns per day"
      range={range}
      onRangeChange={(r) => setRange(r)}
      exportType="daily-summary"
      exportParams={{ from: range.from, to: range.to }}
    >
      <ReportSummaryCards
        items={[
          {
            label: 'Total Sales',
            value: formatNumber(totals.saleCount, 0),
          },
          {
            label: 'Revenue',
            value: formatMoney(totals.sales),
            tone: 'info',
          },
          {
            label: 'Profit',
            value: formatMoney(totals.profit),
            tone: 'success',
          },
          {
            label: 'Returns',
            value: formatMoney(totals.returns),
            tone: totals.returns > 0 ? 'danger' : 'default',
          },
        ]}
      />

      <ReportTable
        columns={columns}
        rows={data}
        isLoading={isLoading}
        rowKey={(r) => r.date}
        emptyMessage="No sales in the selected range"
      />
    </ReportShell>
  );
}
