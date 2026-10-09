// apps/web/src/components/returns/return-row.tsx

'use client';

// One row in the global returns list.
//   [icon]  RT-00001           ৳1,700
//           SL-000123 · reason
//           2 items · 5h ago

import Link from 'next/link';
import { RotateCcw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { SaleReturn } from '@inventory/types';
import { formatMoney, formatRelative } from '@/lib/format';

export function ReturnRow({ ret }: { ret: SaleReturn }) {
  const totalUnits = ret.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <Link
      href={`/sales/${ret.saleObjectId}`}
      className="flex items-center gap-3 p-3 hover:bg-accent/40 active:bg-accent/60 transition-colors"
    >
      <div className="size-10 shrink-0 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
        <RotateCcw className="size-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium font-mono">{ret.returnId}</span>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400"
          >
            Return
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground truncate mt-0.5">
          <span className="font-mono">{ret.saleId}</span> · {ret.reason}
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5 sm:hidden">
          {totalUnits} unit{totalUnits === 1 ? '' : 's'} ·{' '}
          {formatRelative(ret.returnedAt)}
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="text-sm font-semibold tabular-nums text-blue-700 dark:text-blue-400">
          {formatMoney(ret.totalRefundAmount)}
        </div>
        <div className="hidden sm:block text-[11px] text-muted-foreground mt-0.5">
          {totalUnits} unit{totalUnits === 1 ? '' : 's'}
        </div>
        <div className="hidden sm:block text-[11px] text-muted-foreground">
          {formatRelative(ret.returnedAt)}
        </div>
      </div>
    </Link>
  );
}
