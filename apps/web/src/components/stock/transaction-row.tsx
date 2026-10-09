// apps/web/src/components/stock/transaction-row.tsx

'use client';

// One row in the stock history list.
// Compact on mobile, more detail on desktop.

import Link from 'next/link';
import { ArrowDown, ArrowUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { StockTransaction, TransactionType } from '@inventory/types';
import { formatDateTime, formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';

const TYPE_LABEL: Record<TransactionType, string> = {
  STOCK_IN: 'Stock In',
  SALE: 'Sale',
  ADJUSTMENT: 'Adjust',
  RETURN: 'Return',
};

const TYPE_TONE: Record<TransactionType, string> = {
  STOCK_IN:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  SALE: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400',
  ADJUSTMENT:
    'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  RETURN:
    'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400',
};

export function TransactionRow({ txn }: { txn: StockTransaction }) {
  const isIn = txn.direction === 'IN';
  const Icon = isIn ? ArrowDown : ArrowUp;

  return (
    <div className="flex items-center gap-3 p-3">
      {/* Direction icon */}
      <div
        className={cn(
          'size-9 shrink-0 rounded-lg flex items-center justify-center',
          isIn
            ? 'bg-emerald-500/10 text-emerald-600'
            : 'bg-red-500/10 text-red-600',
        )}
      >
        <Icon className="size-4" />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/products/${txn.productId}`}
            className="text-sm font-medium truncate hover:underline"
          >
            {txn.productName}
          </Link>
          <Badge
            variant="outline"
            className={cn('text-[10px] px-1.5 py-0', TYPE_TONE[txn.type])}
          >
            {TYPE_LABEL[txn.type]}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground truncate mt-0.5">
          {txn.sku} · {txn.reason}
        </div>
        <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
          {txn.previousStock} → {txn.newStock}
          <span className="sm:hidden">
            {' · '}
            {formatRelative(txn.createdAt)}
          </span>
        </div>
      </div>

      {/* Quantity + time */}
      <div className="text-right shrink-0">
        <div
          className={cn(
            'text-sm font-semibold tabular-nums',
            isIn ? 'text-emerald-600' : 'text-red-600',
          )}
        >
          {isIn ? '+' : '−'}
          {txn.quantity}
        </div>
        <div className="hidden sm:block text-[11px] text-muted-foreground">
          {formatDateTime(txn.createdAt)}
        </div>
      </div>
    </div>
  );
}
