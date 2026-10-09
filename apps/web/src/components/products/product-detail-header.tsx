// apps/web/src/components/products/product-detail-header.tsx

'use client';

// Hero section on the product details page.
//   [big image]   Name
//                 SKU · Category
//                 StatusBadge
//
//   ৳850 / pcs    | 145 pcs in stock
//   cost ৳600     | value ৳123,250

import { Package } from 'lucide-react';

import { StatusBadge } from './status-badge';
import { formatMoney } from '@/lib/format';
import type { Product } from '@inventory/types';
import { cn } from '@/lib/utils';

interface ProductDetailHeaderProps {
  product: Product;
}

export function ProductDetailHeader({ product }: ProductDetailHeaderProps) {
  const isOut = product.currentStock <= 0;
  const isLow = !isOut && product.currentStock <= product.minimumStock;

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        {/* Image */}
        <div
          className={cn(
            'size-32 shrink-0 rounded-lg overflow-hidden flex items-center justify-center mx-auto sm:mx-0',
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
            />
          ) : (
            <Package className="size-12" />
          )}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold truncate">{product.name}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {product.sku}
                {product.category?.name ? ` · ${product.category.name}` : ''}
                {product.unit ? ` · per ${product.unit}` : ''}
              </p>
            </div>
            <StatusBadge status={
              isOut ? 'OUT_OF_STOCK' : isLow ? 'LOW_STOCK' : 'IN_STOCK'
            } />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="text-xs text-muted-foreground">Selling price</div>
              <div className="text-lg font-bold tabular-nums">
                {formatMoney(product.unitPrice)}
              </div>
              {product.costPrice > 0 && (
                <div className="text-xs text-muted-foreground tabular-nums">
                  cost {formatMoney(product.costPrice)}
                </div>
              )}
            </div>
            <div>
              <div className="text-xs text-muted-foreground">In stock</div>
              <div
                className={cn(
                  'text-lg font-bold tabular-nums',
                  isOut
                    ? 'text-red-600'
                    : isLow
                      ? 'text-amber-600'
                      : 'text-foreground',
                )}
              >
                {product.currentStock} {product.unit}
              </div>
              <div className="text-xs text-muted-foreground tabular-nums">
                value {formatMoney(product.currentStock * product.unitPrice)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
