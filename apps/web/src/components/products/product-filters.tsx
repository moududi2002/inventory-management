// apps/web/src/components/products/product-filters.tsx

'use client';

// Search input + category select + status tabs.
// The parent page owns the URL/state; this component is controlled.

import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/hooks/use-categories';
import type { ProductStatus } from '@inventory/types';
import { cn } from '@/lib/utils';

type StatusTab = 'ALL' | ProductStatus;

interface ProductFiltersProps {
  q: string;
  onQChange: (q: string) => void;
  categoryId: string;
  onCategoryChange: (id: string) => void;
  status: StatusTab;
  onStatusChange: (s: StatusTab) => void;
}

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'IN_STOCK', label: 'In Stock' },
  { value: 'LOW_STOCK', label: 'Low' },
  { value: 'OUT_OF_STOCK', label: 'Out' },
];

export function ProductFilters({
  q,
  onQChange,
  categoryId,
  onCategoryChange,
  status,
  onStatusChange,
}: ProductFiltersProps) {
  const { data: categories, isLoading: loadingCats } = useCategories();

  return (
    <div className="space-y-3">
      {/* ---------- Search ---------- */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Search by product name or SKU…"
          className="w-full h-11 pl-10 pr-10 rounded-xl border bg-card text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {q && (
          <button
            type="button"
            onClick={() => onQChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* ---------- Category + Status ---------- */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Select
          value={categoryId || 'all'}
          onValueChange={(v) => onCategoryChange(v === 'all' ? '' : v)}
        >
          <SelectTrigger className="h-10 sm:w-56">
            <SelectValue placeholder={loadingCats ? 'Loading…' : 'Category'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c._id} value={c._id}>
                {c.name}
                {typeof c.productCount === 'number' ? ` (${c.productCount})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status tabs (segmented) */}
        <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 w-full sm:w-auto">
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab.value}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange(tab.value)}
              className={cn(
                'flex-1 sm:flex-none h-9 px-3 rounded-md text-xs font-medium shadow-none',
                status === tab.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export type { StatusTab };
