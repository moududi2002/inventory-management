// apps/web/src/components/categories/delete-category-dialog.tsx

'use client';

// Confirmation dialog for deleting a category.
// If the category has products, backend blocks the deletion with a 400;
// we show that error directly here so the admin understands why.

import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useDeleteCategory } from '@/hooks/use-categories';
import type { Category } from '@inventory/types';

interface DeleteCategoryDialogProps {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteCategoryDialog({
  category,
  open,
  onOpenChange,
}: DeleteCategoryDialogProps) {
  const del = useDeleteCategory();
  const count = category?.productCount ?? 0;
  const blocked = count > 0;

  const handleDelete = async () => {
    if (!category) return;
    try {
      await del.mutateAsync(category._id);
      onOpenChange(false);
    } catch {
      // Hook already toasted the error; keep the dialog open so the
      // admin sees the context (blocked because of products).
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto sm:mx-0 flex size-10 items-center justify-center rounded-full bg-destructive/10 mb-2">
            <AlertTriangle className="size-5 text-destructive" />
          </div>
          <AlertDialogTitle>Delete this category?</AlertDialogTitle>
          <AlertDialogDescription>
            {category ? (
              <>
                <span className="font-medium text-foreground">
                  {category.name}
                </span>{' '}
                will be permanently removed.
                {blocked ? (
                  <>
                    {' '}
                    This category has{' '}
                    <span className="font-medium text-foreground">
                      {count} product{count === 1 ? '' : 's'}
                    </span>{' '}
                    attached — move or delete them first.
                  </>
                ) : null}
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={del.isPending}>Cancel</AlertDialogCancel>
          {!blocked && (
            <Button
              onClick={handleDelete}
              disabled={del.isPending}
              variant="destructive"
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
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
