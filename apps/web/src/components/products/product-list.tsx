// apps/web/src/components/products/product-list.tsx

'use client';

// Renders the list + pagination. Receives already-fetched data + callbacks.

import { ChevronLeft, ChevronRight, Package } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ProductRow } from './product-row';
import { EmptyState } from '@/components/layout/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import type { PaginatedResponse, ProductListItem } from '@inventory/types';

interface ProductListProps {
  data: PaginatedResponse<ProductListItem> | undefined;
  isLoading: boolean;
  isFetching: boolean;
  onPageChange: (page: number) => void;
  onClearFilters?: () => void;
  hasFilters: boolean;
}

export function ProductList({
  data,
  isLoading,
  isFetching,
  onPageChange,
  onClearFilters,
  hasFilters,
}: ProductListProps) {
  // ---------- Loading (first fetch) ----------
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[76px] rounded-lg" />
        ))}
      </div>
    );
  }

  // ---------- Empty ----------
  if (!data || data.data.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title={hasFilters ? 'No matching products' : 'No products yet'}
        description={
          hasFilters
            ? 'Try adjusting your search or filters.'
            : 'Create your first product to get started.'
        }
        action={
          hasFilters && onClearFilters ? (
            <Button variant="outline" onClick={onClearFilters}>
              Clear filters
            </Button>
          ) : null
        }
      />
    );
  }

  const { data: items, meta } = data;

  return (
    <div className="space-y-3">
      {/* List (dim when fetching next page) */}
      <div
        className={
          'divide-y rounded-xl border bg-card overflow-hidden ' +
          (isFetching ? 'opacity-70 transition-opacity' : '')
        }
      >
        {items.map((product) => (
          <ProductRow key={product._id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="text-xs text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {meta.total} items
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasPrev || isFetching}
              onClick={() => onPageChange(meta.page - 1)}
            >
              <ChevronLeft className="size-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasNext || isFetching}
              onClick={() => onPageChange(meta.page + 1)}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
