// apps/web/src/app/(dashboard)/reports/out-of-stock/page.tsx

'use client';

import Link from 'next/link';
import { useState } from 'react';

import { ReportShell } from '@/components/reports/report-shell';
import { ReportTable, type ReportColumn } from '@/components/reports/report-table';
import { Badge } from '@/components/ui/badge';
import { useOutOfStockReport } from '@/hooks/use-reports';
import type { LowStockReportRow } from '@inventory/types';

export default function OutOfStockReportPage() {
  const [range, setRange] = useState<{ from?: string; to?: string }>({});
  const { data, isLoading } = useOutOfStockReport();

  const columns: ReportColumn<LowStockReportRow>[] = [
    {
      key: 'sku',
      label: 'SKU',
      render: (r) => <span className="font-mono text-xs">{r.sku}</span>,
    },
    {
      key: 'name',
      label: 'Product',
      render: (r) => (
        <Link
          href={`/products/${r.productId}`}
          className="font-medium hover:underline"
        >
          {r.name}
        </Link>
      ),
    },
    {
      key: 'categoryName',
      label: 'Category',
      render: (r) => (
        <span className="text-muted-foreground">{r.categoryName || '—'}</span>
      ),
    },
    {
      key: 'minimumStock',
      label: 'Minimum',
      align: 'right',
      className: 'text-muted-foreground',
      render: (r) => String(r.minimumStock),
    },
    {
      key: 'unit',
      label: 'Unit',
      align: 'center',
      render: (r) => <span className="text-muted-foreground">{r.unit}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: () => (
        <Badge
          variant="outline"
          className="border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 text-[10px] px-1.5 py-0"
        >
          Out
        </Badge>
      ),
    },
  ];

  return (
    <ReportShell
      title="Out of Stock"
      description="Products with zero stock"
      range={range}
      onRangeChange={setRange}
      exportType="out-of-stock"
    >
      <ReportTable
        columns={columns}
        rows={data}
        isLoading={isLoading}
        rowKey={(r) => r.productId}
        emptyMessage="No products are out of stock 🎉"
      />
    </ReportShell>
  );
}
