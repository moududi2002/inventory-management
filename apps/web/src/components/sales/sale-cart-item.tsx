// apps/web/src/components/sales/sale-cart-item.tsx

'use client';

// One line in the sale cart.
//   [thumb] Name          [qty ±]  ×  ৳850 = ৳2,550
//           PRD-10001 · 145 in stock        [X]

import { Package, Minus, Plus, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/format';
import type { ProductListItem } from '@inventory/types';

export interface CartItem {
  product: ProductListItem;
  quantity: number;
  unitPrice: number;
}

interface SaleCartItemProps {
  item: CartItem;
  onChangeQuantity: (qty: number) => void;
  onChangePrice: (price: number) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function SaleCartItem({
  item,
  onChangeQuantity,
  onChangePrice,
  onRemove,
  disabled,
}: SaleCartItemProps) {
  const { product, quantity, unitPrice } = item;
  const overStock = quantity > product.currentStock;
  const subtotal = quantity * unitPrice;

  const dec = () => onChangeQuantity(Math.max(1, quantity - 1));
  const inc = () => onChangeQuantity(quantity + 1);

  return (
    <div className="p-3 flex gap-3 items-start">
      {/* Thumb */}
      <div className="size-12 shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="size-5 text-muted-foreground" />
        )}
      </div>

      {/* Middle */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{product.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              {product.sku} ·{' '}
              <span className={cn(overStock && 'text-red-600 font-medium')}>
                {product.currentStock} {product.unit} in stock
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="shrink-0 size-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent disabled:opacity-50"
            aria-label="Remove"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Qty + price */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Qty stepper */}
          <div className="inline-flex items-center rounded-md border bg-background">
            <button
              type="button"
              onClick={dec}
              disabled={disabled || quantity <= 1}
              className="size-8 flex items-center justify-center text-muted-foreground hover:bg-accent disabled:opacity-40 rounded-l-md"
            >
              <Minus className="size-3.5" />
            </button>
            <input
              type="number"
              min={1}
              value={quantity}
              disabled={disabled}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!Number.isFinite(v)) return;
                onChangeQuantity(Math.max(1, Math.floor(v)));
              }}
              className={cn(
                'w-12 h-8 text-center text-sm tabular-nums bg-transparent outline-none',
                overStock && 'text-red-600 font-medium',
              )}
            />
            <button
              type="button"
              onClick={inc}
              disabled={disabled}
              className="size-8 flex items-center justify-center text-muted-foreground hover:bg-accent disabled:opacity-40 rounded-r-md"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          <span className="text-muted-foreground text-sm">×</span>

          {/* Editable price */}
          <input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={unitPrice}
            disabled={disabled}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isFinite(v)) return;
              onChangePrice(Math.max(0, v));
            }}
            className="w-24 h-8 px-2 rounded-md border bg-background text-sm text-right tabular-nums outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {overStock && (
          <p className="text-xs text-red-600">
            Exceeds available stock by {quantity - product.currentStock}
          </p>
        )}
      </div>

      {/* Subtotal */}
      <div className="text-right shrink-0 pl-1">
        <div className="text-sm font-semibold tabular-nums">
          {formatMoney(subtotal)}
        </div>
      </div>
    </div>
  );
}
