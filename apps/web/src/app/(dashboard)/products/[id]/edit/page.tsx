// apps/web/src/app/(dashboard)/products/[id]/edit/page.tsx

'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductForm } from '@/components/products/product-form';
import { useProduct, useUpdateProduct } from '@/hooks/use-products';
import type { CreateProductInput, Product } from '@inventory/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: product, isLoading } = useProduct(id);
  const update = useUpdateProduct(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
          <ArrowLeft className="mr-1 size-4" />
          Back
        </Button>
        <p className="text-sm text-muted-foreground">Product not found.</p>
      </div>
    );
  }

  const onSubmit = async (values: CreateProductInput): Promise<Product> => {
    // update expects UpdateProductInput — CreateProductInput's fields are all valid there
    const updated = await update.mutateAsync({
      name: values.name,
      categoryId: values.categoryId,
      unit: values.unit,
      minimumStock: values.minimumStock,
      costPrice: values.costPrice,
      unitPrice: values.unitPrice,
      imageUrl: values.imageUrl,
    });
    router.replace(`/products/${updated._id}`);
    return updated;
  };

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="-ml-2"
      >
        <ArrowLeft className="mr-1 size-4" />
        Back
      </Button>

      <PageHeader
        title="Edit Product"
        description={`${product.name} · ${product.sku}`}
      />

      <ProductForm
        initial={product}
        onSubmit={onSubmit}
        onCancel={() => router.back()}
        submitLabel="Save changes"
      />
    </div>
  );
}
