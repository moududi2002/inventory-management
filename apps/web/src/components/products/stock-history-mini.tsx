// apps/web/src/components/products/stock-history-mini.tsx

'use client';

// Last N stock transactions for a product.
//   +50  Stock In     New Purchase         2d ago
//   -3   Sale         Sale #SL-000125      5h ago

import Link from 'next/link';
import { ArrowDown, ArrowUp, History, ArrowRight } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useProductStockHistory } from '@/hooks/use-stock';
import { formatRelative } from '@/lib/format';
import type { TransactionType } from '@inventory/types';
import { cn } from '@/lib/utils';

const TYPE_LABEL: Record<TransactionType, string> = {
  STOCK_IN: 'Stock In',
  SALE: 'Sale',
  ADJUSTMENT: 'Adjust',
  RETURN: 'Return',
};

const TYPE_TONE: Record<TransactionType, string> = {
  STOCK_IN: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  SALE: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400',
  ADJUSTMENT: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  RETURN: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400',
};

interface StockHistoryMiniProps {
  productId: string;
}

export function StockHistoryMini({ productId }: StockHistoryMiniProps) {
  const { data, isLoading } = useProductStockHistory(productId, 5);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="size-4" />
          Recent Activity
        </CardTitle>
        <Link
          href={`/stock?productId=${productId}`}
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          View all
          <ArrowRight className="size-3" />
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2 py-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-md" />
            ))}
          </div>
        ) : !data || data.data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No transactions yet
          </p>
        ) : (
          <div className="divide-y">
            {data.data.map((txn) => {
              const isIn = txn.direction === 'IN';
              const Icon = isIn ? ArrowDown : ArrowUp;

              return (
                <div
                  key={txn._id}
                  className="flex items-center gap-3 py-2.5"
                >
                  <div
                    className={cn(
                      'size-8 rounded-lg flex items-center justify-center shrink-0',
                      isIn
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-red-500/10 text-red-600',
                    )}
                  >
                    <Icon className="size-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] px-1.5 py-0', TYPE_TONE[txn.type])}
                      >
                        {TYPE_LABEL[txn.type]}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">
                        {txn.reason}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
                      {txn.previousStock} → {txn.newStock}
                    </div>
                  </div>

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
                    <div className="text-[10px] text-muted-foreground">
                      {formatRelative(txn.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
