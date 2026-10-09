// apps/web/src/app/(dashboard)/returns/page.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { ReturnFilters, type ReturnRange } from '@/components/returns/return-filters';
import { ReturnList } from '@/components/returns/return-list';
import { useReturns } from '@/hooks/use-sale-returns';
import { useDebounce } from '@/hooks/use-debounce';

function rangeToFrom(range: ReturnRange): string | undefined {
  if (range === 'ALL') return undefined;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function ReturnsPage() {
  const searchParams = useSearchParams();

  const urlQ = searchParams.get('q') ?? '';
  const urlRange = (searchParams.get('range') as ReturnRange) || '30d';
  const urlPage = Number(searchParams.get('page') ?? 1) || 1;

  const [qInput, setQInput] = useState(urlQ);
  const debouncedQ = useDebounce(qInput, 300);

  useEffect(() => {
    setQInput(urlQ);
  }, [urlQ]);

  useEffect(() => {
    if (debouncedQ === urlQ) return;
    setQuery({ q: debouncedQ || undefined, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const setQuery = (patch: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === '' || v === 1) next.delete(k);
      else next.set(k, String(v));
    }
    const qs = next.toString();
    window.history.replaceState(null, '', `/returns${qs ? `?${qs}` : ''}`);
  };

  const params = useMemo(
    () => ({
      q: urlQ || undefined,
      from: rangeToFrom(urlRange),
      page: urlPage,
      limit: 20,
    }),
    [urlQ, urlRange, urlPage],
  );

  const { data, isLoading, isFetching } = useReturns(params);
  const hasFilters = !!(urlQ || urlRange !== '30d');

  const clearFilters = () => {
    setQInput('');
    window.history.replaceState(null, '', '/returns');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Returns"
        description="Customer returns and refunds"
      />

      <ReturnFilters
        q={qInput}
        onQChange={setQInput}
        range={urlRange}
        onRangeChange={(r) =>
          setQuery({ range: r === '30d' ? undefined : r, page: 1 })
        }
      />

      <ReturnList
        data={data}
        isLoading={isLoading}
        isFetching={isFetching}
        onPageChange={(p) => setQuery({ page: p })}
        hasFilters={hasFilters}
        onClearFilters={clearFilters}
      />
    </div>
  );
}
