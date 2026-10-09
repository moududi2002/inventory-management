// apps/web/src/app/(dashboard)/stock/adjust/page.tsx

'use client';

// Standalone stock adjustment page.
// Deep-linkable: /stock/adjust?productId=xxx pre-selects a product.
//
// Flow:
//   1. Pick a product (or comes pre-selected via ?productId=)
//   2. Enter new absolute quantity
//   3. Choose reason + optional note
//   4. Submit → stock set to new value with a transaction log

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Scale, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductPicker } from '@/components/stock/product-picker';
import { useAdjustStock } from '@/hooks/use-stock';
import { useProduct } from '@/hooks/use-products';
import type {
  AdjustmentReason,
  ProductListItem,
} from '@inventory/types';
import { ADJUSTMENT_REASON_LABELS } from '@inventory/types';
import { cn } from '@/lib/utils';

const REASONS: AdjustmentReason[] = [
  'DAMAGED',
  'LOST',
  'THEFT',
  'EXPIRED',
  'COUNT_MISMATCH',
  'OTHER',
];

// Convert a full Product into the list-shape ProductPicker expects.
function toListItem(p: {
  _id: string;
  sku: string;
  name: string;
  categoryId: string;
  category?: { name?: string } | null;
  unit: string;
  currentStock: number;
  minimumStock: number;
  costPrice: number;
  unitPrice: number;
  imageUrl?: string | null;
  isActive: boolean;
}): ProductListItem {
  const status =
    p.currentStock <= 0
      ? 'OUT_OF_STOCK'
      : p.currentStock <= p.minimumStock
        ? 'LOW_STOCK'
        : 'IN_STOCK';
  return {
    _id: p._id,
    sku: p.sku,
    name: p.name,
    categoryId: p.categoryId,
    categoryName: p.category?.name ?? '',
    unit: p.unit,
    currentStock: p.currentStock,
    minimumStock: p.minimumStock,
    costPrice: p.costPrice,
    unitPrice: p.unitPrice,
    imageUrl: p.imageUrl ?? null,
    status,
    stockValue: p.currentStock * p.unitPrice,
    isActive: p.isActive,
  };
}

export default function StockAdjustPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlProductId = searchParams.get('productId') ?? '';

  const adjust = useAdjustStock();

  const [product, setProduct] = useState<ProductListItem | null>(null);
  const [newQuantity, setNewQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState<AdjustmentReason>('COUNT_MISMATCH');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch full product when ?productId= is in URL.
  const { data: singleProduct } = useProduct(urlProductId || undefined);

  useEffect(() => {
    if (!singleProduct) return;
    setProduct(toListItem(singleProduct));
    setNewQuantity(singleProduct.currentStock);
  }, [singleProduct]);

  // When product changes (via picker), reset new quantity to its current.
  useEffect(() => {
    if (product && newQuantity === '') {
      setNewQuantity(product.currentStock);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?._id]);

  const numericQty = typeof newQuantity === 'number' ? newQuantity : 0;
  const diff = product ? numericQty - product.currentStock : 0;
  const canSubmit =
    !!product && diff !== 0 && numericQty >= 0 && !adjust.isPending;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!product) {
      setError('Please select a product');
      return;
    }
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
      // Redirect to product details so admin sees the updated stock + history.
      router.replace(`/products/${product._id}`);
    } catch {
      // Hook already toasted.
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="-ml-2"
      >
        <ArrowLeft className="mr-1 size-4" />
        Back
      </Button>

      <PageHeader
        title="Adjust Stock"
        description="Set stock to an absolute value with a reason"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Scale className="size-4" />
            Adjustment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {/* Product picker */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Product <span className="text-destructive">*</span>
              </label>
              <ProductPicker
                selected={product}
                onSelect={(p) => {
                  setProduct(p);
                  setNewQuantity(p ? p.currentStock : '');
                  setError(null);
                }}
                disabled={adjust.isPending}
              />
            </div>

            {/* Current stock summary */}
            {product && (
              <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-sm flex items-center justify-between">
                <span className="text-muted-foreground">Current stock</span>
                <span className="font-semibold tabular-nums">
                  {product.currentStock} {product.unit}
                </span>
              </div>
            )}

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
                disabled={!product || adjust.isPending}
                value={newQuantity}
                onChange={(e) =>
                  setNewQuantity(
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
                className="w-full h-11 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Diff preview */}
            {product && diff !== 0 && (
              <div
                className={cn(
                  'rounded-lg border px-3 py-2.5 text-sm flex items-center justify-between',
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

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Reason <span className="text-destructive">*</span>
              </label>
              <Select
                value={reason}
                onValueChange={(v) => setReason(v as AdjustmentReason)}
                disabled={!product || adjust.isPending}
              >
                <SelectTrigger className="h-11">
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
                Note{' '}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </label>
              <input
                id="note"
                type="text"
                placeholder="Additional details…"
                disabled={!product || adjust.isPending}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={300}
                className="w-full h-11 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full h-11"
              size="lg"
            >
              {adjust.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Adjusting…
                </>
              ) : (
                <>
                  <Scale className="mr-2 size-4" />
                  Confirm Adjustment
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
