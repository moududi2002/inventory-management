// apps/web/src/app/(dashboard)/sales/page.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { SaleFilters, type StatusTab } from '@/components/sales/sale-filters';
import { SaleList } from '@/components/sales/sale-list';
import { useSales } from '@/hooks/use-sales';
import { useDebounce } from '@/hooks/use-debounce';

type Range = '7d' | '30d' | '90d' | 'ALL';

function rangeToFrom(range: Range): string | undefined {
  if (range === 'ALL') return undefined;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function SalesPage() {
  const searchParams = useSearchParams();

  const urlQ = searchParams.get('q') ?? '';
  const urlStatus = (searchParams.get('status') as StatusTab) || 'ALL';
  const urlRange = (searchParams.get('range') as Range) || '30d';
  const urlPage = Number(searchParams.get('page') ?? 1) || 1;

  const [qInput, setQInput] = useState(urlQ);
  const debouncedQ = useDebounce(qInput, 300);

  useEffect(() => {
    setQInput(urlQ);
  }, [urlQ]);

  useEffect(() => {
    if (debouncedQ === urlQ) return;
    setPageParam(1);
    setQParam(debouncedQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const setQuery = (patch: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === '' || v === 'ALL' || v === 1) next.delete(k);
      else next.set(k, String(v));
    }
    const qs = next.toString();
    window.history.replaceState(null, '', `/sales${qs ? `?${qs}` : ''}`);
  };

  const setQParam = (q: string) => setQuery({ q });
  const setStatusParam = (s: StatusTab) => setQuery({ status: s, page: 1 });
  const setRangeParam = (r: Range) => setQuery({ range: r === '30d' ? undefined : r, page: 1 });
  const setPageParam = (p: number) => setQuery({ page: p });

  const params = useMemo(
    () => ({
      q: urlQ || undefined,
      status: urlStatus === 'ALL' ? undefined : urlStatus,
      from: rangeToFrom(urlRange),
      page: urlPage,
      limit: 20,
    }),
    [urlQ, urlStatus, urlRange, urlPage],
  );

  const { data, isLoading, isFetching } = useSales(params);
  const hasFilters = !!(urlQ || urlStatus !== 'ALL' || urlRange !== '30d');

  const clearFilters = () => {
    setQInput('');
    window.history.replaceState(null, '', '/sales');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Sales"
        description="Recent transactions and returns"
        actions={
          <Button asChild>
            <Link href="/sales/new">
              <Plus className="mr-2 size-4" />
              New Sale
            </Link>
          </Button>
        }
      />

      <SaleFilters
        q={qInput}
        onQChange={setQInput}
        status={urlStatus}
        onStatusChange={setStatusParam}
        range={urlRange}
        onRangeChange={setRangeParam}
      />

      <SaleList
        data={data}
        isLoading={isLoading}
        isFetching={isFetching}
        onPageChange={setPageParam}
        hasFilters={hasFilters}
        onClearFilters={clearFilters}
      />
    </div>
  );
}
