// apps/web/src/components/categories/category-list.tsx

'use client';

// Renders the list of categories with dividers.
// Loading → skeletons. Empty → empty state with a CTA.

import { FolderTree, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/layout/empty-state';
import { CategoryRow } from './category-row';
import type { Category } from '@inventory/types';

interface CategoryListProps {
  categories: Category[] | undefined;
  isLoading: boolean;
  onCreate: () => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoryList({
  categories,
  isLoading,
  onCreate,
  onEdit,
  onDelete,
}: CategoryListProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card overflow-hidden divide-y">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="size-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="size-8 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="rounded-xl border bg-card">
        <EmptyState
          icon={FolderTree}
          title="No categories yet"
          description="Create categories to organize your products."
          action={
            <Button onClick={onCreate}>
              <Plus className="mr-2 size-4" />
              New Category
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden divide-y">
      {categories.map((cat) => (
        <CategoryRow
          key={cat._id}
          category={cat}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
