// apps/web/src/components/sales/sale-summary.tsx

'use client';

import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

interface SaleSummaryProps {
  subtotal: number;
  discount: number;
  onDiscountChange: (d: number) => void;
  totalAmount: number;
  totalProfit: number;
}

export function SaleSummary({
  subtotal,
  discount,
  onDiscountChange,
  totalAmount,
  totalProfit,
}: SaleSummaryProps) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-medium tabular-nums">{formatMoney(subtotal)}</span>
      </div>

      <div className="flex items-center justify-between text-sm gap-2">
        <span className="text-muted-foreground shrink-0">Discount</span>
        <input
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          value={discount}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isFinite(v)) return;
            onDiscountChange(Math.max(0, v));
          }}
          className="w-28 h-8 px-2 rounded-md border bg-background text-sm text-right tabular-nums outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="border-t pt-3 flex items-center justify-between">
        <span className="text-sm font-medium">Total</span>
        <span
          className={cn(
            'text-xl font-bold tabular-nums',
            totalAmount < 0 && 'text-red-600',
          )}
        >
          {formatMoney(totalAmount)}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Est. profit</span>
        <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
          {formatMoney(totalProfit)}
        </span>
      </div>
    </div>
  );
}
