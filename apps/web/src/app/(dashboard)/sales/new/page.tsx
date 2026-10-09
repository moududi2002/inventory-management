// apps/web/src/app/(dashboard)/sales/new/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { SaleForm } from '@/components/sales/sale-form';
import { useProduct } from '@/hooks/use-products';
import { useProducts } from '@/hooks/use-products';
import type { ProductListItem } from '@inventory/types';

export default function NewSalePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlProductId = searchParams.get('productId') ?? '';
  const [initialProduct, setInitialProduct] = useState<ProductListItem | null>(null);

  // Fetch a single product (full) when coming from product details.
  const { data: singleProduct } = useProduct(urlProductId || undefined);

  // Fallback: fetch list to obtain the ProductListItem shape (has status + stockValue).
  // The single product endpoint returns the full Product; we convert.
  useEffect(() => {
    if (!singleProduct) return;
    const item: ProductListItem = {
      _id: singleProduct._id,
      sku: singleProduct.sku,
      name: singleProduct.name,
      categoryId: singleProduct.categoryId,
      categoryName: singleProduct.category?.name ?? '',
      unit: singleProduct.unit,
      currentStock: singleProduct.currentStock,
      minimumStock: singleProduct.minimumStock,
      costPrice: singleProduct.costPrice,
      unitPrice: singleProduct.unitPrice,
      imageUrl: singleProduct.imageUrl ?? null,
      status:
        singleProduct.currentStock <= 0
          ? 'OUT_OF_STOCK'
          : singleProduct.currentStock <= singleProduct.minimumStock
            ? 'LOW_STOCK'
            : 'IN_STOCK',
      stockValue: singleProduct.currentStock * singleProduct.unitPrice,
      isActive: singleProduct.isActive,
    };
    setInitialProduct(item);
  }, [singleProduct]);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
        <ArrowLeft className="mr-1 size-4" />
        Back
      </Button>

      <PageHeader title="New Sale" description="Search and add products to the cart" />

      <SaleForm
        initialProduct={initialProduct}
        onSuccess={(sale) => router.replace(`/sales/${sale._id}`)}
      />
    </div>
  );
}
