// apps/web/src/components/sales/sale-list.tsx

'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, ShoppingCart, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/layout/empty-state';
import { SaleRow } from './sale-row';
import { cn } from '@/lib/utils';
import type { PaginatedResponse, SaleListItem } from '@inventory/types';

interface SaleListProps {
  data: PaginatedResponse<SaleListItem> | undefined;
  isLoading: boolean;
  isFetching: boolean;
  onPageChange: (page: number) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function SaleList({
  data,
  isLoading,
  isFetching,
  onPageChange,
  hasFilters,
  onClearFilters,
}: SaleListProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card overflow-hidden divide-y">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-3">
            <Skeleton className="h-14 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="rounded-xl border bg-card">
        <EmptyState
          icon={ShoppingCart}
          title={hasFilters ? 'No matching sales' : 'No sales yet'}
          description={
            hasFilters
              ? 'Try a different status or date range.'
              : 'Create your first sale to get started.'
          }
          action={
            hasFilters ? (
              <Button variant="outline" onClick={onClearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button asChild>
                <Link href="/sales/new">
                  <Plus className="mr-2 size-4" />
                  New Sale
                </Link>
              </Button>
            )
          }
        />
      </div>
    );
  }

  const { data: items, meta } = data;

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'rounded-xl border bg-card overflow-hidden divide-y',
          isFetching && 'opacity-70 transition-opacity',
        )}
      >
        {items.map((sale) => (
          <SaleRow key={sale._id} sale={sale} />
        ))}
      </div>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="text-xs text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {meta.total} sales
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
