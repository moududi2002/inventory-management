// apps/web/src/components/stock/stock-history-table.tsx

'use client';

// Full history list with pagination.

import { ChevronLeft, ChevronRight, ArrowDownToLine } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/layout/empty-state';
import { TransactionRow } from './transaction-row';
import type { PaginatedResponse, StockTransaction } from '@inventory/types';

import { cn } from '@/lib/utils';

interface StockHistoryTableProps {
  data: PaginatedResponse<StockTransaction> | undefined;
  isLoading: boolean;
  isFetching: boolean;
  onPageChange: (page: number) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function StockHistoryTable({
  data,
  isLoading,
  isFetching,
  onPageChange,
  hasFilters,
  onClearFilters,
}: StockHistoryTableProps) {
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
          icon={ArrowDownToLine}
          title={hasFilters ? 'No matching transactions' : 'No stock activity yet'}
          description={
            hasFilters
              ? 'Try a different type or date range.'
              : 'Stock movements will appear here as you add stock and make sales.'
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
        {items.map((txn) => (
          <TransactionRow key={txn._id} txn={txn} />
        ))}
      </div>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="text-xs text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {meta.total} entries
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

// Small helper to avoid importing cn from a deep path.

