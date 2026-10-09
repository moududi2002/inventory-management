// apps/web/src/app/(dashboard)/products/page.tsx

'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { ProductFilters, type StatusTab } from '@/components/products/product-filters';
import { ProductList } from '@/components/products/product-list';
import { useProducts } from '@/hooks/use-products';
import { useDebounce } from '@/hooks/use-debounce';

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ---------- URL-backed state ----------
  const urlQ = searchParams.get('q') ?? '';
  const urlCat = searchParams.get('categoryId') ?? '';
  const urlStatus = (searchParams.get('status') as StatusTab | null) ?? 'ALL';
  const urlPage = Number(searchParams.get('page') ?? 1) || 1;

  // ---------- Local state (search input is local, then debounced to URL) ----------
  const [qInput, setQInput] = useState(urlQ);
  const debouncedQ = useDebounce(qInput, 300);

  // Keep local input in sync if URL changes externally.
  useEffect(() => {
    setQInput(urlQ);
  }, [urlQ]);

  // Push debounced query into URL when it changes.
  useEffect(() => {
    if (debouncedQ === urlQ) return;
    updateUrl({ q: debouncedQ, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  // ---------- Helper to sync URL ----------
  const updateUrl = (patch: {
    q?: string;
    categoryId?: string;
    status?: StatusTab;
    page?: number;
  }) => {
    const next = new URLSearchParams(searchParams.toString());

    if (patch.q !== undefined) {
      if (patch.q) next.set('q', patch.q);
      else next.delete('q');
    }
    if (patch.categoryId !== undefined) {
      if (patch.categoryId) next.set('categoryId', patch.categoryId);
      else next.delete('categoryId');
    }
    if (patch.status !== undefined) {
      if (patch.status && patch.status !== 'ALL') next.set('status', patch.status);
      else next.delete('status');
    }
    if (patch.page !== undefined) {
      if (patch.page > 1) next.set('page', String(patch.page));
      else next.delete('page');
    }

    router.replace(`/products${next.toString() ? `?${next.toString()}` : ''}`);
  };

  // ---------- Fetch ----------
  const params = useMemo(
    () => ({
      q: urlQ || undefined,
      categoryId: urlCat || undefined,
      status: urlStatus === 'ALL' ? undefined : urlStatus,
      page: urlPage,
      limit: 20,
    }),
    [urlQ, urlCat, urlStatus, urlPage],
  );

  const { data, isLoading, isFetching } = useProducts(params);

  const hasFilters = !!(urlQ || urlCat || urlStatus !== 'ALL');

  const clearFilters = () => {
    setQInput('');
    router.replace('/products');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Products"
        description="Manage your catalog"
        actions={
          <Button asChild>
            <Link href="/products/new">
              <Plus className="mr-2 size-4" />
              New Product
            </Link>
          </Button>
        }
      />

      <ProductFilters
        q={qInput}
        onQChange={setQInput}
        categoryId={urlCat}
        onCategoryChange={(id) => updateUrl({ categoryId: id, page: 1 })}
        status={urlStatus}
        onStatusChange={(s) => updateUrl({ status: s, page: 1 })}
      />

      <ProductList
        data={data}
        isLoading={isLoading}
        isFetching={isFetching}
        onPageChange={(p) => updateUrl({ page: p })}
        onClearFilters={clearFilters}
        hasFilters={hasFilters}
      />
    </div>
  );
}
