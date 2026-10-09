// apps/web/src/components/stock/add-stock-dialog.tsx

'use client';

// Dialog to add stock to a product.
//   - shows current stock
//   - quantity input
//   - reason (mandatory)
//   - submit → useAddStock → toast + closes

import { useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAddStock } from '@/hooks/use-stock';
import type { Product } from '@inventory/types';
import { cn } from '@/lib/utils';

interface AddStockDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUICK_REASONS = ['New Purchase', 'Return to Stock', 'Opening Balance'];

export function AddStockDialog({
  product,
  open,
  onOpenChange,
}: AddStockDialogProps) {
  const addStock = useAddStock();
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset when dialog opens.
  useEffect(() => {
    if (open) {
      setQuantity('');
      setReason('');
      setError(null);
    }
  }, [open]);

  const numericQty = typeof quantity === 'number' ? quantity : 0;
  const newTotal = product.currentStock + numericQty;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!numericQty || numericQty <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason');
      return;
    }

    try {
      await addStock.mutateAsync({
        productId: product._id,
        quantity: numericQty,
        reason: reason.trim(),
      });
      onOpenChange(false);
    } catch {
      // Error already toasted by the hook.
    }
  };

  const loading = addStock.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add Stock</DialogTitle>
            <DialogDescription>
              {product.name} · {product.sku}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current stock info */}
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm flex justify-between">
              <span className="text-muted-foreground">Current stock</span>
              <span className="font-semibold tabular-nums">
                {product.currentStock} {product.unit}
              </span>
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <label htmlFor="qty" className="text-sm font-medium">
                Quantity to add <span className="text-destructive">*</span>
              </label>
              <input
                id="qty"
                type="number"
                min="1"
                inputMode="numeric"
                autoFocus
                disabled={loading}
                value={quantity}
                onChange={(e) =>
                  setQuantity(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
            </div>

            {/* Live preview */}
            {numericQty > 0 && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm flex justify-between">
                <span className="text-muted-foreground">New total</span>
                <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {product.currentStock} + {numericQty} = {newTotal} {product.unit}
                </span>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-1.5">
              <label htmlFor="reason" className="text-sm font-medium">
                Reason <span className="text-destructive">*</span>
              </label>
              <input
                id="reason"
                type="text"
                placeholder="e.g. Purchase from Supplier X"
                disabled={loading}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
              {/* Quick reason chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    disabled={loading}
                    className={cn(
                      'text-xs px-2 py-1 rounded-full border transition-colors',
                      reason === r
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-accent text-muted-foreground border-border',
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

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
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !numericQty || !reason.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Adding…
                </>
              ) : (
                <>
                  <Plus className="mr-2 size-4" />
                  Add Stock
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
