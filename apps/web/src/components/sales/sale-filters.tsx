// apps/web/src/components/sales/sale-filters.tsx

'use client';

import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { SaleStatus } from '@inventory/types';
import { cn } from '@/lib/utils';

type StatusTab = 'ALL' | SaleStatus;

interface SaleFiltersProps {
  q: string;
  onQChange: (q: string) => void;
  status: StatusTab;
  onStatusChange: (s: StatusTab) => void;
  range: '7d' | '30d' | '90d' | 'ALL';
  onRangeChange: (r: '7d' | '30d' | '90d' | 'ALL') => void;
}

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'PARTIALLY_RETURNED', label: 'Partial' },
  { value: 'FULLY_RETURNED', label: 'Returned' },
];

const RANGE_TABS: { value: '7d' | '30d' | '90d' | 'ALL'; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'ALL', label: 'All' },
];

export function SaleFilters({
  q,
  onQChange,
  status,
  onStatusChange,
  range,
  onRangeChange,
}: SaleFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Search by sale ID (e.g. SL-000123)…"
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

      {/* Status tabs */}
      <div className="-mx-1 overflow-x-auto">
        <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 min-w-full sm:min-w-0">
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab.value}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange(tab.value)}
              className={cn(
                'h-8 px-3 rounded-md text-xs font-medium shadow-none whitespace-nowrap flex-1 sm:flex-none',
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

export type { StatusTab };
