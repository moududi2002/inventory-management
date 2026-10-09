// apps/web/src/components/sales/sale-form.tsx

'use client';

// The cart editor:
//   [ProductPicker] → adds to cart
//   Cart items list
//   Summary (subtotal, discount, total, profit)
//   [Confirm Sale] button
//
// Validates stock before submit; shows live errors.

import { useMemo, useState, useEffect } from 'react';
import { ShoppingCart, Loader2, Receipt } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductPicker } from '@/components/stock/product-picker';
import { SaleCartItem, type CartItem } from './sale-cart-item';
import { SaleSummary } from './sale-summary';
import { useCreateSale } from '@/hooks/use-sales';
import type { ProductListItem, Sale } from '@inventory/types';

interface SaleFormProps {
  initialProduct?: ProductListItem | null;
  onSuccess?: (sale: Sale) => void;
}

export function SaleForm({ initialProduct, onSuccess }: SaleFormProps) {
  const create = useCreateSale();

  const [picker, setPicker] = useState<ProductListItem | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // If the page was opened from a product detail page (?productId=…),
  // seed the cart with that product once.
  useEffect(() => {
    if (initialProduct) {
      setItems((prev) => {
        if (prev.some((i) => i.product._id === initialProduct._id)) return prev;
        return [
          ...prev,
          {
            product: initialProduct,
            quantity: 1,
            unitPrice: initialProduct.unitPrice,
          },
        ];
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProduct?._id]);

  // ---------- Add product from picker ----------
  const addProduct = (product: ProductListItem | null) => {
    if (!product) return;
    setPicker(null);
    setError(null);

    if (items.some((i) => i.product._id === product._id)) {
      setError(`${product.name} is already in the cart`);
      return;
    }
    if (product.currentStock <= 0) {
      setError(`${product.name} is out of stock`);
      return;
    }

    setItems((prev) => [
      ...prev,
      { product, quantity: 1, unitPrice: product.unitPrice },
    ]);
  };

  // ---------- Mutators ----------
  const updateQuantity = (id: string, qty: number) =>
    setItems((prev) =>
      prev.map((i) => (i.product._id === id ? { ...i, quantity: qty } : i)),
    );

  const updatePrice = (id: string, price: number) =>
    setItems((prev) =>
      prev.map((i) => (i.product._id === id ? { ...i, unitPrice: price } : i)),
    );

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.product._id !== id));

  // ---------- Totals ----------
  const { subtotal, totalAmount, totalProfit, hasStockError } = useMemo(() => {
    let subtotal = 0;
    let profit = 0;
    let stockError = false;

    for (const i of items) {
      const line = i.quantity * i.unitPrice;
      subtotal += line;
      profit += (i.unitPrice - i.product.costPrice) * i.quantity;
      if (i.quantity > i.product.currentStock) stockError = true;
    }

    const total = subtotal - discount;
    return {
      subtotal,
      totalAmount: total,
      totalProfit: profit,
      hasStockError: stockError,
    };
  }, [items, discount]);

  const canSubmit =
    items.length > 0 &&
    !hasStockError &&
    discount <= subtotal &&
    !create.isPending;

  // ---------- Submit ----------
  const submit = async () => {
    setError(null);
    if (items.length === 0) {
      setError('Add at least one product');
      return;
    }
    if (hasStockError) {
      setError('One or more items exceed available stock');
      return;
    }
    if (discount > subtotal) {
      setError('Discount cannot exceed subtotal');
      return;
    }

    try {
      const sale = await create.mutateAsync({
        items: items.map((i) => ({
          productId: i.product._id,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        discount,
      });
      setItems([]);
      setDiscount(0);
      onSuccess?.(sale);
    } catch {
      // Hook already toasted.
    }
  };

  return (
    <div className="space-y-4">
      {/* Product picker */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="size-4" />
            Add Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductPicker
            selected={picker}
            onSelect={addProduct}
            disabled={create.isPending}
          />
        </CardContent>
      </Card>

      {/* Cart */}
      {items.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Cart ({items.length} item{items.length === 1 ? '' : 's'})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {items.map((item) => (
                <SaleCartItem
                  key={item.product._id}
                  item={item}
                  onChangeQuantity={(q) => updateQuantity(item.product._id, q)}
                  onChangePrice={(p) => updatePrice(item.product._id, p)}
                  onRemove={() => removeItem(item.product._id)}
                  disabled={create.isPending}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary + submit */}
      {items.length > 0 && (
        <>
          <SaleSummary
            subtotal={subtotal}
            discount={discount}
            onDiscountChange={setDiscount}
            totalAmount={totalAmount}
            totalProfit={totalProfit}
          />

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <Button
            onClick={submit}
            disabled={!canSubmit}
            size="lg"
            className="w-full h-12"
          >
            {create.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Receipt className="mr-2 size-4" />
                Confirm Sale · {totalAmount.toFixed(2)}
              </>
            )}
          </Button>
        </>
      )}

      {/* Empty hint */}
      {items.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Search and select a product to start a sale
        </p>
      )}
    </div>
  );
}
