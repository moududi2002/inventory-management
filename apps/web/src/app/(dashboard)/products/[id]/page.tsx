// apps/web/src/app/(dashboard)/products/[id]/page.tsx

'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/layout/empty-state';
import { ProductDetailHeader } from '@/components/products/product-detail-header';
import { ProductInfoGrid } from '@/components/products/product-info-grid';
import { ProductActions } from '@/components/products/product-actions';
import { StockHistoryMini } from '@/components/products/stock-history-mini';
import { useProduct } from '@/hooks/use-products';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailsPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: product, isLoading, isError } = useProduct(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
          <ArrowLeft className="mr-1 size-4" />
          Back
        </Button>
        <EmptyState
          icon={Package}
          title="Product not found"
          description="It may have been deleted or the link is incorrect."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="-ml-2"
      >
        <ArrowLeft className="mr-1 size-4" />
        Back
      </Button>

      {/* Header (image + price + stock) */}
      <ProductDetailHeader product={product} />

      {/* Actions */}
      <ProductActions product={product} />

      {/* Info + history */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProductInfoGrid product={product} />
        <StockHistoryMini productId={product._id} />
      </div>
    </div>
  );
}
