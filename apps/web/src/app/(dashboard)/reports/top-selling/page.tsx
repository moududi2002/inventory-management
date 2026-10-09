// apps/web/src/app/(dashboard)/reports/top-selling/page.tsx

'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';

import { ReportShell } from '@/components/reports/report-shell';
import { ReportTable, type ReportColumn } from '@/components/reports/report-table';
import { useTopSellingReport } from '@/hooks/use-reports';
import { formatMoney, formatNumber } from '@/lib/format';
import type { TopSellingRow } from '@inventory/types';
import { cn } from '@/lib/utils';

export default function TopSellingReportPage() {
  const [range, setRange] = useState<{ from?: string; to?: string }>(() => {
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    const from = new Date();
    from.setDate(from.getDate() - 29);
    from.setHours(0, 0, 0, 0);
    return { from: from.toISOString(), to: to.toISOString() };
  });

  const [limit, setLimit] = useState(10);

  const params = useMemo(
    () => ({ from: range.from, to: range.to, limit }),
    [range.from, range.to, limit],
  );
  const { data, isLoading } = useTopSellingReport(params);

  const columns: ReportColumn<TopSellingRow>[] = [
    {
      key: 'rank',
      label: '#',
      align: 'center',
      className: 'w-10',
      render: (_r, i) => (
        <span
          className={cn(
            'inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold',
            i === 0
              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
              : i === 1
                ? 'bg-muted text-muted-foreground'
                : i === 2
                  ? 'bg-orange-500/10 text-orange-700 dark:text-orange-400'
                  : 'text-muted-foreground',
          )}
        >
          {i + 1}
        </span>
      ),
    },
    {
      key: 'sku',
      label: 'SKU',
      render: (r) => <span className="font-mono text-xs">{r.sku}</span>,
    },
    {
      key: 'productName',
      label: 'Product',
      render: (r) => (
        <Link
          href={`/products/${r.productId}`}
          className="font-medium hover:underline"
        >
          {r.productName}
        </Link>
      ),
    },
    {
      key: 'quantitySold',
      label: 'Qty Sold',
      align: 'right',
      className: 'font-semibold',
      render: (r) => formatNumber(r.quantitySold, 0),
    },
    {
      key: 'revenue',
      label: 'Revenue',
      align: 'right',
      render: (r) => formatMoney(r.revenue),
    },
    {
      key: 'profit',
      label: 'Profit',
      align: 'right',
      className: 'text-emerald-600 dark:text-emerald-500',
      render: (r) => formatMoney(r.profit),
    },
  ];

  return (
    <ReportShell
      title="Top Selling Products"
      description="Ranked by quantity sold"
      range={range}
      onRangeChange={(r) => setRange(r)}
      exportType="top-selling"
      exportParams={{ from: range.from, to: range.to }}
      filterSlot={
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0">Show top:</span>
          <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
            {[5, 10, 20, 50].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setLimit(n)}
                className={cn(
                  'h-7 px-3 rounded-md text-xs font-medium',
                  limit === n
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      }
    >
      {/* Trophy banner for #1 if exists */}
      {data && data[0] && (
        <div className="rounded-xl border bg-gradient-to-br from-amber-500/10 via-transparent to-transparent p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center">
            <Trophy className="size-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Best seller</div>
            <div className="text-sm font-semibold">{data[0].productName}</div>
            <div className="text-xs text-muted-foreground tabular-nums">
              {formatNumber(data[0].quantitySold, 0)} sold ·{' '}
              {formatMoney(data[0].revenue)} revenue
            </div>
          </div>
        </div>
      )}

      <ReportTable
        columns={columns}
        rows={data}
        isLoading={isLoading}
        rowKey={(r) => r.productId}
        emptyMessage="No sales in the selected range"
      />
    </ReportShell>
  );
}
