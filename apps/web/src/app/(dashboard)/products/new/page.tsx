// apps/web/src/app/(dashboard)/products/new/page.tsx

'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { ProductForm } from '@/components/products/product-form';
import { useCreateProduct } from '@/hooks/use-products';
import type { CreateProductInput, Product } from '@inventory/types';

export default function NewProductPage() {
  const router = useRouter();
  const create = useCreateProduct();

  const onSubmit = async (values: CreateProductInput): Promise<Product> => {
    const product = await create.mutateAsync(values);
    router.replace(`/products/${product._id}`);
    return product;
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
        title="New Product"
        description="Add a new item to your catalog"
      />

      <ProductForm
        onSubmit={onSubmit}
        onCancel={() => router.back()}
        submitLabel="Create product"
      />
    </div>
  );
}
