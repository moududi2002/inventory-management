// apps/web/src/app/(dashboard)/reports/low-stock/page.tsx

'use client';

import Link from 'next/link';
import { useState } from 'react';

import { ReportShell } from '@/components/reports/report-shell';
import { ReportTable, type ReportColumn } from '@/components/reports/report-table';
import { Badge } from '@/components/ui/badge';
import { useLowStockReport } from '@/hooks/use-reports';
import { formatNumber } from '@/lib/format';
import type { LowStockReportRow } from '@inventory/types';

export default function LowStockReportPage() {
  const [range, setRange] = useState<{ from?: string; to?: string }>({});
  const { data, isLoading } = useLowStockReport();

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
      key: 'currentStock',
      label: 'Current',
      align: 'right',
      className: 'text-amber-600 dark:text-amber-500 font-semibold',
      render: (r) => formatNumber(r.currentStock, 0),
    },
    {
      key: 'minimumStock',
      label: 'Minimum',
      align: 'right',
      className: 'text-muted-foreground',
      render: (r) => formatNumber(r.minimumStock, 0),
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
          className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] px-1.5 py-0"
        >
          Low
        </Badge>
      ),
    },
  ];

  return (
    <ReportShell
      title="Low Stock"
      description="Products at or below minimum stock"
      range={range}
      onRangeChange={setRange}
      exportType="low-stock"
    >
      <ReportTable
        columns={columns}
        rows={data}
        isLoading={isLoading}
        rowKey={(r) => r.productId}
        emptyMessage="All products are above their minimum stock level 🎉"
      />
    </ReportShell>
  );
}
