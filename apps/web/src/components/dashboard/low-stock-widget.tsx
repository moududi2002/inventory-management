// apps/web/src/components/dashboard/low-stock-widget.tsx

'use client';

// Products at or below minimum stock, sorted by urgency (server-side).
// Each row shows a small progress bar for currentStock / minimumStock.

import Link from 'next/link';
import { AlertTriangle, ArrowRight, PackageX } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLowStock } from '@/hooks/use-dashboard';
import type { LowStockProduct } from '@inventory/types';
import { cn } from '@/lib/utils';

function StockRow({ item }: { item: LowStockProduct }) {
  const outOfStock = item.currentStock <= 0;
  // Cap at 100% — if minimumStock is 0, treat as 100% so bar is full.
  const ratio =
    item.minimumStock > 0
      ? Math.min(100, Math.round((item.currentStock / item.minimumStock) * 100))
      : 100;

  return (
    <Link
      href={`/products/${item._id}`}
      className="block py-2.5 hover:bg-accent/40 -mx-2 px-2 rounded-md transition-colors"
    >
      <div className="flex items-center gap-3">
        {/* Thumbnail / placeholder */}
        <div
          className={cn(
            'size-10 shrink-0 rounded-lg flex items-center justify-center overflow-hidden',
            outOfStock
              ? 'bg-red-500/10 text-red-600'
              : 'bg-amber-500/10 text-amber-600',
          )}
        >
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : outOfStock ? (
            <PackageX className="size-5" />
          ) : (
            <AlertTriangle className="size-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{item.name}</span>
            {outOfStock ? (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400"
              >
                Out
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              >
                Low
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {item.sku}
          </div>

          {/* Progress bar */}
          <div className="mt-1.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full',
                outOfStock
                  ? 'bg-red-500'
                  : ratio < 50
                    ? 'bg-amber-500'
                    : 'bg-emerald-500',
              )}
              style={{ width: `${outOfStock ? 0 : Math.max(4, ratio)}%` }}
            />
          </div>
        </div>

        <div className="text-right shrink-0">
          <div
            className={cn(
              'text-sm font-semibold tabular-nums',
              outOfStock ? 'text-red-600' : 'text-amber-600',
            )}
          >
            {item.currentStock}
          </div>
          <div className="text-[10px] text-muted-foreground tabular-nums">
            min {item.minimumStock}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function LowStockWidget() {
  const { data, isLoading } = useLowStock(6);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-500" />
          Low Stock
        </CardTitle>
        <a
          href="/reports"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          Reports
          <ArrowRight className="size-3" />
        </a>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-md" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            All stock is healthy 🎉
          </p>
        ) : (
          <div className="divide-y">
            {data.map((item) => (
              <StockRow key={item._id} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
