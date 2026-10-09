// apps/web/src/components/products/product-row.tsx

'use client';

// A compact, tappable product row.
//   [thumb]  Name                ৳850
//            PRD-10001 · 145 pcs [In Stock]
//
// On mobile this is the primary list item.

import Link from 'next/link';
import { Package } from 'lucide-react';

import { StatusBadge } from './status-badge';
import { formatMoney } from '@/lib/format';
import type { ProductListItem } from '@inventory/types';
import { cn } from '@/lib/utils';

export function ProductRow({ product }: { product: ProductListItem }) {
  const isOut = product.status === 'OUT_OF_STOCK';
  const isLow = product.status === 'LOW_STOCK';

  return (
    <Link
      href={`/products/${product._id}`}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-colors',
        'hover:bg-accent/40 active:bg-accent/60',
      )}
    >
      {/* Thumbnail */}
      <div
        className={cn(
          'size-14 shrink-0 rounded-lg overflow-hidden flex items-center justify-center',
          isOut
            ? 'bg-red-500/10 text-red-600'
            : isLow
              ? 'bg-amber-500/10 text-amber-600'
              : 'bg-muted text-muted-foreground',
        )}
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <Package className="size-6" />
        )}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate">{product.name}</span>
          <StatusBadge status={product.status} />
        </div>
        <div className="text-xs text-muted-foreground truncate mt-0.5">
          {product.sku}
          {product.categoryName ? ` · ${product.categoryName}` : ''}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          <span
            className={cn(
              'font-medium tabular-nums',
              isOut
                ? 'text-red-600'
                : isLow
                  ? 'text-amber-600'
                  : 'text-foreground/70',
            )}
          >
            {product.currentStock}
          </span>{' '}
          {product.unit} in stock
        </div>
      </div>

      {/* Price (right) */}
      <div className="text-right shrink-0">
        <div className="text-sm font-semibold tabular-nums">
          {formatMoney(product.unitPrice)}
        </div>
        {product.costPrice > 0 && (
          <div className="text-[10px] text-muted-foreground tabular-nums">
            cost {formatMoney(product.costPrice)}
          </div>
        )}
      </div>
    </Link>
  );
}
