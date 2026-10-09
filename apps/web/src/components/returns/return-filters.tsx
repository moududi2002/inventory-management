// apps/web/src/components/returns/return-filters.tsx

'use client';

// Search (by returnId or saleId) + date range for the returns list.

import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ReturnRange = '7d' | '30d' | '90d' | 'ALL';

interface ReturnFiltersProps {
  q: string;
  onQChange: (q: string) => void;
  range: ReturnRange;
  onRangeChange: (r: ReturnRange) => void;
}

const RANGE_TABS: { value: ReturnRange; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'ALL', label: 'All' },
];

export function ReturnFilters({
  q,
  onQChange,
  range,
  onRangeChange,
}: ReturnFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Search by return ID or sale ID…"
          className="w-full h-11 pl-10 pr-10 rounded-xl border bg-card text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {q && (
          <button
            type="button"
            onClick={() => onQChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Range */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground shrink-0">Range:</span>
        <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
          {RANGE_TABS.map((tab) => (
            <Button
              key={tab.value}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRangeChange(tab.value)}
              className={cn(
                'h-7 px-2.5 rounded-md text-xs font-medium shadow-none',
                range === tab.value
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
