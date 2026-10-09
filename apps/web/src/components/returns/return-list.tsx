// apps/web/src/components/returns/return-list.tsx

'use client';

import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/layout/empty-state';
import { ReturnRow } from './return-row';
import { cn } from '@/lib/utils';
import type { PaginatedResponse, SaleReturn } from '@inventory/types';

interface ReturnListProps {
  data: PaginatedResponse<SaleReturn> | undefined;
  isLoading: boolean;
  isFetching: boolean;
  onPageChange: (page: number) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function ReturnList({
  data,
  isLoading,
  isFetching,
  onPageChange,
  hasFilters,
  onClearFilters,
}: ReturnListProps) {
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
          icon={RotateCcw}
          title={hasFilters ? 'No matching returns' : 'No returns yet'}
          description={
            hasFilters
              ? 'Try a different range or search term.'
              : 'Customer returns will appear here.'
          }
          action={
            hasFilters ? (
              <Button variant="outline" onClick={onClearFilters}>
                Clear filters
              </Button>
            ) : null
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
        {items.map((r) => (
          <ReturnRow key={r._id} ret={r} />
        ))}
      </div>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="text-xs text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {meta.total} returns
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
