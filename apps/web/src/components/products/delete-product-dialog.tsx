// apps/web/src/components/products/delete-product-dialog.tsx

'use client';

// Confirmation dialog before soft-deleting a product.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteProduct } from '@/hooks/use-products';
import type { Product } from '@inventory/types';

interface DeleteProductDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteProductDialog({
  product,
  open,
  onOpenChange,
}: DeleteProductDialogProps) {
  const router = useRouter();
  const del = useDeleteProduct();

  const handleDelete = async () => {
    await del.mutateAsync(product._id);
    onOpenChange(false);
    router.replace('/products');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto sm:mx-0 flex size-10 items-center justify-center rounded-full bg-destructive/10 mb-2">
            <AlertTriangle className="size-5 text-destructive" />
          </div>
          <AlertDialogTitle>Delete this product?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{product.name}</span>{' '}
            ({product.sku}) will be removed from your catalog. Stock history
            and past sales remain intact for reporting.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={del.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={del.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {del.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="mr-2 size-4" />
                Delete
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
