// apps/web/src/components/sales/return-dialog.tsx

'use client';

// Sale return dialog.
//   - For each item shows: name, sold qty, already-returned, remaining
//   - Return qty input (0..remaining)
//   - Reason input
//   - Refund auto-calculated
//
// Submit → create return via API.

import { useMemo, useState, useEffect } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCreateSaleReturn } from '@/hooks/use-sales';
import type { Sale } from '@inventory/types';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

interface ReturnDialogProps {
  sale: Sale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReturnDialog({ sale, open, onOpenChange }: ReturnDialogProps) {
  const createReturn = useCreateSaleReturn(sale._id);

  // Map: productId → return quantity
  const [qtyByProduct, setQtyByProduct] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset on open.
  useEffect(() => {
    if (open) {
      const init: Record<string, number> = {};
      for (const it of sale.items) {
        init[it.productId] = 0;
      }
      setQtyByProduct(init);
      setReason('');
      setError(null);
    }
  }, [open, sale]);

  const rows = useMemo(
    () =>
      sale.items.map((it) => {
        const remaining = it.quantity - it.returnedQuantity;
        return { item: it, remaining };
      }),
    [sale],
  );

  const totals = useMemo(() => {
    let refund = 0;
    let units = 0;
    for (const { item } of rows) {
      const q = qtyByProduct[item.productId] ?? 0;
      refund += q * item.unitPriceAtSale;
      units += q;
    }
    return { refund, units };
  }, [qtyByProduct, rows]);

  const setQty = (productId: string, q: number, max: number) => {
    setQtyByProduct((prev) => ({
      ...prev,
      [productId]: Math.max(0, Math.min(max, Math.floor(q))),
    }));
  };

  const canSubmit = totals.units > 0 && reason.trim().length > 0 && !createReturn.isPending;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (totals.units === 0) {
      setError('Select at least one item to return');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason');
      return;
    }

    const items = Object.entries(qtyByProduct)
      .filter(([, q]) => q > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    try {
      await createReturn.mutateAsync({ items, reason: reason.trim() });
      onOpenChange(false);
    } catch {
      // Hook already toasted.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="size-4" />
              Return items
            </DialogTitle>
            <DialogDescription>
              Sale <span className="font-mono">{sale.saleId}</span> ·{' '}
              {formatMoney(sale.totalAmount)} · {sale.items.length} item
              {sale.items.length === 1 ? '' : 's'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Items table */}
            <div className="rounded-lg border divide-y overflow-hidden">
              {rows.map(({ item, remaining }) => {
                const q = qtyByProduct[item.productId] ?? 0;
                const maxed = remaining === 0;

                return (
                  <div key={item.productId} className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {item.productName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.sku} · {formatMoney(item.unitPriceAtSale)} each
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Sold {item.quantity} ·{' '}
                          {item.returnedQuantity > 0
                            ? `already returned ${item.returnedQuantity} · `
                            : ''}
                          <span
                            className={cn(
                              'font-medium',
                              remaining > 0
                                ? 'text-foreground'
                                : 'text-muted-foreground',
                            )}
                          >
                            {remaining} remaining
                          </span>
                        </div>
                      </div>

                      {/* Qty input */}
                      <div className="shrink-0">
                        <input
                          type="number"
                          min={0}
                          max={remaining}
                          inputMode="numeric"
                          disabled={maxed || createReturn.isPending}
                          value={q}
                          onChange={(e) =>
                            setQty(item.productId, Number(e.target.value), remaining)
                          }
                          className={cn(
                            'w-20 h-9 px-2 rounded-md border bg-background text-sm text-right tabular-nums outline-none focus:ring-2 focus:ring-ring',
                            maxed && 'opacity-50',
                          )}
                        />
                      </div>
                    </div>

                    {q > 0 && (
                      <div className="text-xs text-right text-muted-foreground tabular-nums">
                        Refund for this line:{' '}
                        <span className="font-medium text-foreground">
                          {formatMoney(q * item.unitPriceAtSale)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label htmlFor="return-reason" className="text-sm font-medium">
                Reason <span className="text-destructive">*</span>
              </label>
              <input
                id="return-reason"
                type="text"
                placeholder="e.g. Customer changed mind / Defective"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={300}
                disabled={createReturn.isPending}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
            </div>

            {/* Refund summary */}
            {totals.units > 0 && (
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 px-3 py-2.5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Returning {totals.units} unit{totals.units === 1 ? '' : 's'}
                </span>
                <span className="font-semibold tabular-nums text-blue-700 dark:text-blue-400">
                  Refund {formatMoney(totals.refund)}
                </span>
              </div>
            )}

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createReturn.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {createReturn.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 size-4" />
                  Confirm Return
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
