// apps/web/src/components/stock/adjustment-dialog.tsx

'use client';

// Dialog for stock adjustment (damage, lost, mismatch, ...).
// Sets stock to an ABSOLUTE new value with a reason enum.

import { useEffect, useState } from 'react';
import { Loader2, Scale } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdjustStock } from '@/hooks/use-stock';
import type { Product, AdjustmentReason } from '@inventory/types';
import { ADJUSTMENT_REASON_LABELS } from '@inventory/types';
import { cn } from '@/lib/utils';

interface AdjustmentDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const REASONS: AdjustmentReason[] = [
  'DAMAGED',
  'LOST',
  'THEFT',
  'EXPIRED',
  'COUNT_MISMATCH',
  'OTHER',
];

export function AdjustmentDialog({
  product,
  open,
  onOpenChange,
}: AdjustmentDialogProps) {
  const adjust = useAdjustStock();
  const [newQuantity, setNewQuantity] = useState<number | ''>(product.currentStock);
  const [reason, setReason] = useState<AdjustmentReason>('COUNT_MISMATCH');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNewQuantity(product.currentStock);
      setReason('COUNT_MISMATCH');
      setNote('');
      setError(null);
    }
  }, [open, product.currentStock]);

  const numericQty = typeof newQuantity === 'number' ? newQuantity : 0;
  const diff = numericQty - product.currentStock;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numericQty < 0) {
      setError('Quantity cannot be negative');
      return;
    }
    if (diff === 0) {
      setError('Stock is already at that quantity — no change needed');
      return;
    }

    try {
      await adjust.mutateAsync({
        productId: product._id,
        newQuantity: numericQty,
        adjustmentReason: reason,
        note: note.trim() || undefined,
      });
      onOpenChange(false);
    } catch {
      // Hook already toasted.
    }
  };

  const loading = adjust.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              {product.name} · {product.sku}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current */}
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm flex justify-between">
              <span className="text-muted-foreground">Current stock</span>
              <span className="font-semibold tabular-nums">
                {product.currentStock} {product.unit}
              </span>
            </div>

            {/* New quantity */}
            <div className="space-y-1.5">
              <label htmlFor="newqty" className="text-sm font-medium">
                New stock quantity <span className="text-destructive">*</span>
              </label>
              <input
                id="newqty"
                type="number"
                min="0"
                inputMode="numeric"
                autoFocus
                disabled={loading}
                value={newQuantity}
                onChange={(e) =>
                  setNewQuantity(
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
                className="w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
            </div>

            {/* Diff preview */}
            {diff !== 0 && (
              <div
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm flex justify-between',
                  diff > 0
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-red-500/30 bg-red-500/5',
                )}
              >
                <span className="text-muted-foreground">Change</span>
                <span
                  className={cn(
                    'font-semibold tabular-nums',
                    diff > 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-red-700 dark:text-red-400',
                  )}
                >
                  {product.currentStock} → {numericQty} ({diff > 0 ? '+' : ''}
                  {diff})
                </span>
              </div>
            )}

            {/* Reason select */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Reason <span className="text-destructive">*</span>
              </label>
              <Select
                value={reason}
                onValueChange={(v) => setReason(v as AdjustmentReason)}
                disabled={loading}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ADJUSTMENT_REASON_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Optional note */}
            <div className="space-y-1.5">
              <label htmlFor="note" className="text-sm font-medium">
                Note <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <input
                id="note"
                type="text"
                placeholder="Additional details…"
                disabled={loading}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
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
            <Button type="submit" disabled={loading || diff === 0}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Adjusting…
                </>
              ) : (
                <>
                  <Scale className="mr-2 size-4" />
                  Adjust Stock
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
