// apps/web/src/app/(dashboard)/reports/category-stock/page.tsx

'use client';

import Link from 'next/link';
import { useState } from 'react';

import { ReportShell } from '@/components/reports/report-shell';
import { ReportTable, type ReportColumn } from '@/components/reports/report-table';
import { ReportSummaryCards } from '@/components/reports/report-summary-cards';
import { useCategoryStockReport } from '@/hooks/use-reports';
import { formatMoney, formatNumber } from '@/lib/format';
import type { CategoryStockRow } from '@inventory/types';

export default function CategoryStockReportPage() {
  const [range, setRange] = useState<{ from?: string; to?: string }>({});
  const { data, isLoading } = useCategoryStockReport();

  const totals = (data ?? []).reduce(
    (acc, r) => ({
      products: acc.products + r.productCount,
      quantity: acc.quantity + r.totalQuantity,
      value: acc.value + r.totalStockValue,
    }),
    { products: 0, quantity: 0, value: 0 },
  );

  const columns: ReportColumn<CategoryStockRow>[] = [
    {
      key: 'categoryName',
      label: 'Category',
      render: (r) => <span className="font-medium">{r.categoryName}</span>,
    },
    {
      key: 'productCount',
      label: 'Products',
      align: 'right',
      render: (r) => formatNumber(r.productCount, 0),
    },
    {
      key: 'totalQuantity',
      label: 'Total Qty',
      align: 'right',
      render: (r) => formatNumber(r.totalQuantity, 0),
    },
    {
      key: 'totalStockValue',
      label: 'Stock Value',
      align: 'right',
      className: 'font-semibold',
      render: (r) => formatMoney(r.totalStockValue),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (r) => (
        <Link
          href={`/products?categoryId=${r.categoryId}`}
          className="text-xs text-primary hover:underline"
        >
          View
        </Link>
      ),
    },
  ];

  return (
    <ReportShell
      title="Category Stock"
      description="Stock grouped by category"
      range={range}
      onRangeChange={setRange}
      exportType="category-stock"
    >
      <ReportSummaryCards
        items={[
          {
            label: 'Categories',
            value: formatNumber(data?.length ?? 0, 0),
          },
          {
            label: 'Total Products',
            value: formatNumber(totals.products, 0),
            tone: 'info',
          },
          {
            label: 'Total Qty',
            value: formatNumber(totals.quantity, 0),
          },
          {
            label: 'Stock Value',
            value: formatMoney(totals.value),
            tone: 'success',
          },
        ]}
      />

      <ReportTable
        columns={columns}
        rows={data}
        isLoading={isLoading}
        rowKey={(r) => r.categoryId}
        emptyMessage="No categories with stock yet"
      />
    </ReportShell>
  );
}
