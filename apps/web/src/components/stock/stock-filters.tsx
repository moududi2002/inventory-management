// apps/web/src/components/stock/stock-filters.tsx

'use client';

// Filters for the History tab:
//   - Type tabs: All / Stock In / Sale / Adjust / Return
//   - Date range: 7d / 30d / 90d / All

import { Button } from '@/components/ui/button';
import type { TransactionType } from '@inventory/types';
import { cn } from '@/lib/utils';

export type TypeFilter = 'ALL' | TransactionType;
export type RangeFilter = '7d' | '30d' | '90d' | 'ALL';

interface StockFiltersProps {
  type: TypeFilter;
  onTypeChange: (t: TypeFilter) => void;
  range: RangeFilter;
  onRangeChange: (r: RangeFilter) => void;
}

const TYPE_TABS: { value: TypeFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'STOCK_IN', label: 'Stock In' },
  { value: 'SALE', label: 'Sale' },
  { value: 'ADJUSTMENT', label: 'Adjust' },
  { value: 'RETURN', label: 'Return' },
];

const RANGE_TABS: { value: RangeFilter; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'ALL', label: 'All' },
];

export function StockFilters({
  type,
  onTypeChange,
  range,
  onRangeChange,
}: StockFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Type — scrollable tabs on mobile */}
      <div className="-mx-1 overflow-x-auto">
        <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 min-w-full sm:min-w-0">
          {TYPE_TABS.map((tab) => (
            <Button
              key={tab.value}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onTypeChange(tab.value)}
              className={cn(
                'h-8 px-3 rounded-md text-xs font-medium shadow-none whitespace-nowrap',
                type === tab.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Date range — segmented */}
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
