// apps/web/src/app/(dashboard)/reports/dead-stock/page.tsx

'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { ReportShell } from '@/components/reports/report-shell';
import { ReportTable, type ReportColumn } from '@/components/reports/report-table';
import { useDeadStockReport } from '@/hooks/use-reports';
import { formatDate, formatMoney, formatNumber } from '@/lib/format';
import type { DeadStockRow } from '@inventory/types';
import { cn } from '@/lib/utils';

export default function DeadStockReportPage() {
  const [range, setRange] = useState<{ from?: string; to?: string }>({});
  const [days, setDays] = useState(30);

  const params = useMemo(() => ({ days }), [days]);
  const { data, isLoading } = useDeadStockReport(params);

  const columns: ReportColumn<DeadStockRow>[] = [
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
      key: 'currentStock',
      label: 'Stock',
      align: 'right',
      render: (r) => formatNumber(r.currentStock, 0),
    },
    {
      key: 'stockValue',
      label: 'Stock Value',
      align: 'right',
      render: (r) => formatMoney(r.stockValue),
    },
    {
      key: 'lastSoldAt',
      label: 'Last Sold',
      align: 'right',
      render: (r) => (
        <span className="text-muted-foreground text-xs">
          {r.lastSoldAt ? formatDate(r.lastSoldAt) : 'Never'}
        </span>
      ),
    },
    {
      key: 'daysSinceLastSale',
      label: 'Days Idle',
      align: 'right',
      render: (r) => (
        <span
          className={cn(
            'inline-block px-1.5 py-0.5 rounded text-xs tabular-nums',
            r.daysSinceLastSale === null
              ? 'bg-red-500/10 text-red-700 dark:text-red-400'
              : r.daysSinceLastSale >= 90
                ? 'bg-red-500/10 text-red-700 dark:text-red-400'
                : r.daysSinceLastSale >= 60
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                  : 'bg-muted text-muted-foreground',
          )}
        >
          {r.daysSinceLastSale === null ? 'Never' : `${r.daysSinceLastSale}d`}
        </span>
      ),
    },
  ];

  return (
    <ReportShell
      title="Dead Stock"
      description={`Products with stock that haven't sold in ${days} days`}
      range={range}
      onRangeChange={setRange}
      exportType="dead-stock"
      exportParams={{ days }}
      filterSlot={
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0">Not sold in:</span>
          <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
            {[15, 30, 60, 90].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setDays(n)}
                className={cn(
                  'h-7 px-3 rounded-md text-xs font-medium tabular-nums',
                  days === n
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {n}d
              </button>
            ))}
          </div>
        </div>
      }
    >
      <ReportTable
        columns={columns}
        rows={data}
        isLoading={isLoading}
        rowKey={(r) => r.productId}
        emptyMessage="No dead stock detected 🎉"
      />
    </ReportShell>
  );
}
