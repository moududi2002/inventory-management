// apps/web/src/components/products/product-info-grid.tsx

'use client';

// Compact key/value info grid for the details page.

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/format';
import type { Product } from '@inventory/types';

interface ProductInfoGridProps {
  product: Product;
}

export function ProductInfoGrid({ product }: ProductInfoGridProps) {
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: 'SKU', value: <span className="font-mono text-xs">{product.sku}</span> },
    { label: 'Category', value: product.category?.name ?? '—' },
    { label: 'Unit', value: product.unit },
    { label: 'Minimum stock', value: `${product.minimumStock} ${product.unit}` },
    {
      label: 'Status',
      value: product.isActive ? 'Active' : 'Deleted',
    },
    { label: 'Created', value: formatDateTime(product.createdAt) },
    { label: 'Last updated', value: formatDateTime(product.updatedAt) },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Details</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <dl className="divide-y">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 py-2.5 text-sm"
            >
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium text-right truncate">{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
