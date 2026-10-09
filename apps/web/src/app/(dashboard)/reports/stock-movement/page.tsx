// apps/web/src/app/(dashboard)/reports/stock-movement/page.tsx

'use client';

import { useMemo, useState } from 'react';

import { ReportShell } from '@/components/reports/report-shell';
import { ReportTable, type ReportColumn } from '@/components/reports/report-table';
import { ProductPicker } from '@/components/stock/product-picker';
import { useStockMovementReport } from '@/hooks/use-reports';
import { formatNumber } from '@/lib/format';
import type { ProductListItem, StockMovementRow } from '@inventory/types';
import { cn } from '@/lib/utils';

export default function StockMovementReportPage() {
  const [range, setRange] = useState<{ from?: string; to?: string }>(() => {
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    const from = new Date();
    from.setDate(from.getDate() - 29);
    from.setHours(0, 0, 0, 0);
    return { from: from.toISOString(), to: to.toISOString() };
  });

  const [product, setProduct] = useState<ProductListItem | null>(null);

  const params = useMemo(
    () =>
      product
        ? { productId: product._id, from: range.from, to: range.to }
        : null,
    [product, range.from, range.to],
  );

  const { data, isLoading } = useStockMovementReport(params);

  const columns: ReportColumn<StockMovementRow>[] = [
    {
      key: 'date',
      label: 'Date',
      render: (r) => <span className="font-mono text-xs">{r.date}</span>,
    },
    {
      key: 'opening',
      label: 'Opening',
      align: 'right',
      className: 'text-muted-foreground',
      render: (r) => formatNumber(r.opening, 0),
    },
    {
      key: 'stockIn',
      label: 'In',
      align: 'right',
      className: 'text-emerald-600 dark:text-emerald-500',
      render: (r) => (r.stockIn > 0 ? `+${r.stockIn}` : '—'),
    },
    {
      key: 'stockOut',
      label: 'Out',
      align: 'right',
      className: 'text-red-600 dark:text-red-500',
      render: (r) => (r.stockOut > 0 ? `−${r.stockOut}` : '—'),
    },
    {
      key: 'adjustment',
      label: 'Adjust',
      align: 'right',
      render: (r) =>
        r.adjustment === 0 ? (
          '—'
        ) : (
          <span
            className={cn(
              'tabular-nums',
              r.adjustment > 0
                ? 'text-emerald-600 dark:text-emerald-500'
                : 'text-amber-600 dark:text-amber-500',
            )}
          >
            {r.adjustment > 0 ? '+' : ''}
            {r.adjustment}
          </span>
        ),
    },
    {
      key: 'returnIn',
      label: 'Return',
      align: 'right',
      className: 'text-blue-600 dark:text-blue-500',
      render: (r) => (r.returnIn > 0 ? `+${r.returnIn}` : '—'),
    },
    {
      key: 'closing',
      label: 'Closing',
      align: 'right',
      className: 'font-semibold',
      render: (r) => formatNumber(r.closing, 0),
    },
  ];

  return (
    <ReportShell
      title="Stock Movement"
      description={
        product
          ? `${product.name} · ${product.sku}`
          : 'Select a product to view movement'
      }
      range={range}
      onRangeChange={(r) => setRange(r)}
      exportType="stock-movement"
      exportParams={{ from: range.from, to: range.to, productId: product?._id }}
      exportDisabled={!product}
      filterSlot={
        <div className="rounded-xl border bg-card p-3">
          <label className="text-xs font-medium text-muted-foreground">
            Product
          </label>
          <div className="mt-1.5 max-w-xl">
            <ProductPicker selected={product} onSelect={setProduct} />
          </div>
        </div>
      }
    >
      {!product && (
        <div className="rounded-xl border bg-card py-12 text-center text-sm text-muted-foreground">
          Select a product above to see its daily stock movement.
        </div>
      )}

      {product && (
        <ReportTable
          columns={columns}
          rows={data?.rows}
          isLoading={isLoading}
          rowKey={(r) => r.date}
        />
      )}
    </ReportShell>
  );
}
