// apps/web/src/components/sales/sale-row.tsx

'use client';

// One row in the sales list.

import Link from 'next/link';
import { ShoppingCart, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { SaleListItem, SaleStatus } from '@inventory/types';
import { formatMoney, formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';

const STATUS_TONE: Record<SaleStatus, string> = {
  COMPLETED:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  PARTIALLY_RETURNED:
    'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  FULLY_RETURNED:
    'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400',
};

const STATUS_LABEL: Record<SaleStatus, string> = {
  COMPLETED: 'Completed',
  PARTIALLY_RETURNED: 'Partial Return',
  FULLY_RETURNED: 'Returned',
};

export function SaleRow({ sale }: { sale: SaleListItem }) {
  return (
    <Link
      href={`/sales/${sale._id}`}
      className="flex items-center gap-3 p-3 hover:bg-accent/40 active:bg-accent/60 transition-colors"
    >
      <div className="size-10 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        <ShoppingCart className="size-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium font-mono">{sale.saleId}</span>
          <Badge
            variant="outline"
            className={cn('text-[10px] px-1.5 py-0', STATUS_TONE[sale.status])}
          >
            {STATUS_LABEL[sale.status]}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground truncate mt-0.5">
          {sale.firstItemName}
          {sale.itemCount > 1 ? ` +${sale.itemCount - 1} more` : ''} ·{' '}
          {sale.totalQuantity} pcs
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5 sm:hidden">
          {formatRelative(sale.soldAt)}
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="text-sm font-semibold tabular-nums">
          {formatMoney(sale.totalAmount)}
        </div>
        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 tabular-nums flex items-center gap-1 justify-end">
          <TrendingUp className="size-3" />
          {formatMoney(sale.totalProfit)}
        </div>
        <div className="hidden sm:block text-[11px] text-muted-foreground mt-0.5">
          {formatRelative(sale.soldAt)}
        </div>
      </div>
    </Link>
  );
}
