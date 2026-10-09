// apps/web/src/components/stock/stock-add-panel.tsx

'use client';

// The "Add Stock" form.
//   [ProductPicker]
//   Current stock summary
//   Quantity input + live new-total preview
//   Reason input + quick chips
//   [Add Stock] button
//
// On success: clear form so the admin can add another product quickly.

import { useState } from 'react';
import { Plus, Loader2, ArrowRight } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProductPicker } from './product-picker';
import { useAddStock } from '@/hooks/use-stock';
import type { ProductListItem } from '@inventory/types';
import { cn } from '@/lib/utils';

const QUICK_REASONS = [
  'New Purchase',
  'Return to Stock',
  'Opening Balance',
  'Supplier Delivery',
];

export function StockAddPanel() {
  const addStock = useAddStock();

  const [product, setProduct] = useState<ProductListItem | null>(null);
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const numericQty = typeof quantity === 'number' ? quantity : 0;
  const newTotal = (product?.currentStock ?? 0) + numericQty;
  const canSubmit =
    !!product && numericQty > 0 && reason.trim().length > 0 && !addStock.isPending;

  const reset = () => {
    setProduct(null);
    setQuantity('');
    setReason('');
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!product) {
      setError('Please select a product');
      return;
    }
    if (numericQty <= 0) {
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
      // Keep the product so admin can add another quantity if needed,
      // but clear quantity + reason. Actually: full reset for speed.
      reset();
    } catch {
      // Hook already toasted.
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="size-4" />
          Add Stock
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {/* Product */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Product <span className="text-destructive">*</span>
            </label>
            <ProductPicker
              selected={product}
              onSelect={setProduct}
              disabled={addStock.isPending}
            />
          </div>

          {/* Current stock summary (only if product selected) */}
          {product && (
            <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-sm flex items-center justify-between">
              <span className="text-muted-foreground">Current stock</span>
              <span className="font-semibold tabular-nums">
                {product.currentStock} {product.unit}
              </span>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-1.5">
            <label htmlFor="add-qty" className="text-sm font-medium">
              Quantity to add <span className="text-destructive">*</span>
            </label>
            <input
              id="add-qty"
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="0"
              disabled={!product || addStock.isPending}
              value={quantity}
              onChange={(e) =>
                setQuantity(e.target.value === '' ? '' : Number(e.target.value))
              }
              className="w-full h-11 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Preview */}
          {product && numericQty > 0 && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5 text-sm flex items-center justify-between">
              <span className="text-muted-foreground">After adding</span>
              <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                {product.currentStock}
                <ArrowRight className="size-3" />
                {newTotal} {product.unit}
              </span>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <label htmlFor="add-reason" className="text-sm font-medium">
              Reason <span className="text-destructive">*</span>
            </label>
            <input
              id="add-reason"
              type="text"
              placeholder="e.g. Purchase from Supplier X"
              disabled={!product || addStock.isPending}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              className="w-full h-11 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
            />

            {/* Quick chips */}
            {product && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {QUICK_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    disabled={addStock.isPending}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-full border transition-colors',
                      reason === r
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-accent text-muted-foreground border-border',
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full h-11"
            size="lg"
          >
            {addStock.isPending ? (
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
        </form>
      </CardContent>
    </Card>
  );
}
