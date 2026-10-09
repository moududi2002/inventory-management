// apps/web/src/app/(dashboard)/stock/page.tsx

'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, History } from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StockAddPanel } from '@/components/stock/stock-add-panel';
import { StockFilters, type TypeFilter, type RangeFilter } from '@/components/stock/stock-filters';
import { StockHistoryTable } from '@/components/stock/stock-history-table';
import { useStockHistory } from '@/hooks/use-stock';

// Convert a range filter into an ISO `from` date string.
function rangeToFrom(range: RangeFilter): string | undefined {
  if (range === 'ALL') return undefined;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function StockPage() {
  const searchParams = useSearchParams();

  // Optional ?productId=... → pre-filter history to a single product
  const urlProductId = searchParams.get('productId') ?? '';

  // ---------- Local state ----------
  const [tab, setTab] = useState<'add' | 'history'>(
  urlProductId ? 'history' : 'add',
    )   ;
  const [type, setType] = useState<TypeFilter>('ALL');
  const [range, setRange] = useState<RangeFilter>('30d');
  const [page, setPage] = useState(1);

  // ---------- Query ----------
  const params = useMemo(
    () => ({
      productId: urlProductId || undefined,
      type: type === 'ALL' ? undefined : type,
      from: rangeToFrom(range),
      page,
      limit: 20,
    }),
    [urlProductId, type, range, page],
  );

  const { data, isLoading, isFetching } = useStockHistory(params);

  const hasFilters = type !== 'ALL' || range !== '30d' || !!urlProductId;

  const clearFilters = () => {
    setType('ALL');
    setRange('30d');
    setPage(1);
  };

  // Reset page when filters change.
  const handleTypeChange = (t: TypeFilter) => {
    setType(t);
    setPage(1);
  };
  const handleRangeChange = (r: RangeFilter) => {
    setRange(r);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Stock"
        description="Add stock and view complete movement history"
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'add' | 'history')}>
        <TabsList className="grid grid-cols-2 w-full sm:w-auto sm:inline-grid">
          <TabsTrigger value="add" className="gap-1.5">
            <Plus className="size-4" />
            Add Stock
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="size-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* ---------- Add Stock tab ---------- */}
        <TabsContent value="add" className="mt-4">
          <div className="max-w-2xl">
            <StockAddPanel />
          </div>
        </TabsContent>

        {/* ---------- History tab ---------- */}
        <TabsContent value="history" className="mt-4 space-y-4">
          <StockFilters
            type={type}
            onTypeChange={handleTypeChange}
            range={range}
            onRangeChange={handleRangeChange}
          />

          {urlProductId && (
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
              Showing history for a specific product (opened from its details page).
            </div>
          )}

          <StockHistoryTable
            data={data}
            isLoading={isLoading}
            isFetching={isFetching}
            onPageChange={setPage}
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
