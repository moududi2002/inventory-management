// apps/web/src/components/dashboard/recent-activity-list.tsx

'use client';

// Recent stock movements — small list with:
//   - colored direction badge (IN green / OUT red)
//   - product name + SKU
//   - signed quantity + new stock
//   - relative time

import { ArrowDown, ArrowUp, ArrowRight, Activity } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecentActivity } from '@/hooks/use-dashboard';
import { formatRelative } from '@/lib/format';
import type {
  RecentActivityItem,
  TransactionType,
} from '@inventory/types';
import { cn } from '@/lib/utils';

const typeLabels: Record<TransactionType, string> = {
  STOCK_IN: 'Stock In',
  SALE: 'Sale',
  ADJUSTMENT: 'Adjust',
  RETURN: 'Return',
};

function typeTone(type: TransactionType): string {
  switch (type) {
    case 'STOCK_IN':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
    case 'SALE':
      return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
    case 'ADJUSTMENT':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
    case 'RETURN':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
  }
}

function ActivityRow({ item }: { item: RecentActivityItem }) {
  const isIn = item.direction === 'IN';
  const ArrowIcon = isIn ? ArrowDown : ArrowUp;

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div
        className={cn(
          'size-9 shrink-0 rounded-lg flex items-center justify-center',
          isIn
            ? 'bg-emerald-500/10 text-emerald-600'
            : 'bg-red-500/10 text-red-600',
        )}
      >
        <ArrowIcon className="size-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate">
            {item.productName}
          </span>
          <Badge
            variant="outline"
            className={cn('text-[10px] px-1.5 py-0 shrink-0', typeTone(item.type))}
          >
            {typeLabels[item.type]}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {item.sku} · {item.reason}
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
          {item.quantity}
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">
          {item.newStock} left
        </div>
      </div>

      <div className="hidden sm:block text-xs text-muted-foreground w-16 text-right shrink-0">
        {formatRelative(item.createdAt)}
      </div>
    </div>
  );
}

export function RecentActivityList() {
  const { data, isLoading } = useRecentActivity(8);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="size-4" />
          Recent Activity
        </CardTitle>
        <a
          href="/stock"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          View all
          <ArrowRight className="size-3" />
        </a>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-md" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No activity yet
          </p>
        ) : (
          <div className="divide-y">
            {data.map((item) => (
              <ActivityRow key={item.transactionId} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
