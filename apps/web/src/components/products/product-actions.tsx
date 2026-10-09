// apps/web/src/components/products/product-actions.tsx

'use client';

// Action buttons on the product details page.
//   Primary:  [Add Stock]  [Sell]
//   Secondary: [Edit]  [Adjust]  [Delete]

import { useState } from 'react';
import Link from 'next/link';
import { Plus, ShoppingCart, Pencil, Scale, Trash2, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddStockDialog } from '@/components/stock/add-stock-dialog';
import { AdjustmentDialog } from '@/components/stock/adjustment-dialog';
import { DeleteProductDialog } from './delete-product-dialog';
import type { Product } from '@inventory/types';

interface ProductActionsProps {
  product: Product;
}

export function ProductActions({ product }: ProductActionsProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canSell = product.currentStock > 0;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Add Stock */}
        <Button onClick={() => setAddOpen(true)} className="flex-1 sm:flex-initial">
          <Plus className="mr-2 size-4" />
          Add Stock
        </Button>

        {/* Sell */}
        <Button
          asChild
          variant="secondary"
          className="flex-1 sm:flex-initial"
          disabled={!canSell}
        >
          <Link
            href={canSell ? `/sales/new?productId=${product._id}` : '#'}
            aria-disabled={!canSell}
            tabIndex={canSell ? 0 : -1}
            onClick={(e) => !canSell && e.preventDefault()}
            className={!canSell ? 'pointer-events-none opacity-50' : ''}
          >
            <ShoppingCart className="mr-2 size-4" />
            Sell
          </Link>
        </Button>

        {/* Edit (icon on mobile via dropdown too) */}
        <Button asChild variant="outline" className="hidden sm:inline-flex">
          <Link href={`/products/${product._id}/edit`}>
            <Pencil className="mr-2 size-4" />
            Edit
          </Link>
        </Button>

        {/* More (mobile + desktop) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="More actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href={`/products/${product._id}/edit`} className="sm:hidden">
                <Pencil className="mr-2 size-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setAdjustOpen(true)}>
              <Scale className="mr-2 size-4" />
              Adjust stock
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => setDeleteOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dialogs */}
      <AddStockDialog product={product} open={addOpen} onOpenChange={setAddOpen} />
      <AdjustmentDialog
        product={product}
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
      />
      <DeleteProductDialog
        product={product}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
