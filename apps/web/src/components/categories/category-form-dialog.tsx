// apps/web/src/components/categories/category-form-dialog.tsx

'use client';

// Dialog that handles BOTH create and edit.
//   - If `category` is provided → edit mode (pre-filled, PATCH)
//   - Otherwise → create mode (empty, POST)

import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCreateCategory, useUpdateCategory } from '@/hooks/use-categories';
import type { Category } from '@inventory/types';

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass a category to edit; omit/null for create mode. */
  category?: Category | null;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: CategoryFormDialogProps) {
  const isEdit = !!category;
  const create = useCreateCategory();
  const update = useUpdateCategory();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset fields whenever dialog opens or target category changes.
  useEffect(() => {
    if (open) {
      setName(category?.name ?? '');
      setDescription(category?.description ?? '');
      setError(null);
    }
  }, [open, category]);

  const loading = create.isPending || update.isPending;
  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && !loading;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!trimmedName) {
      setError('Category name is required');
      return;
    }

    try {
      if (isEdit && category) {
        await update.mutateAsync({
          id: category._id,
          input: {
            name: trimmedName,
            description: description.trim() || undefined,
          },
        });
      } else {
        await create.mutateAsync({
          name: trimmedName,
          description: description.trim() || undefined,
        });
      }
      onOpenChange(false);
    } catch {
      // Hook already toasted the error.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? 'Edit Category' : 'New Category'}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Update the category name or description.'
                : 'Add a new category to organize your products.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label htmlFor="cat-name" className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                id="cat-name"
                autoFocus
                disabled={loading}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Clothing"
                maxLength={80}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cat-desc" className="text-sm font-medium">
                Description{' '}
                <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <textarea
                id="cat-desc"
                disabled={loading}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description…"
                maxLength={300}
                rows={3}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/300
              </p>
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
            <Button type="submit" disabled={!canSubmit}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 size-4" />
                  {isEdit ? 'Save changes' : 'Create'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
