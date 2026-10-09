// apps/web/src/components/products/product-form.tsx

'use client';

// Create/Edit product form.
//   - react-hook-form + zodResolver (shared schema)
//   - image uploader
//   - category select
//   - numeric inputs coerced to numbers
//   - on success, calls onSuccess(product)

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/hooks/use-categories';
import { ImageUploader } from './image-uploader';
import {
  createProductSchema,
  type CreateProductInput,
} from '@inventory/validation';
import type { Product } from '@inventory/types';

interface ProductFormProps {
  initial?: Product;
  onSubmit: (values: CreateProductInput) => Promise<Product>;
  onCancel?: () => void;
  submitLabel?: string;
}

const UNITS = ['pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'pack', 'pair'];

export function ProductForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: ProductFormProps) {
  const { data: categories, isLoading: loadingCats } = useCategories();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: initial?.name ?? '',
      categoryId: initial?.categoryId ?? '',
      unit: initial?.unit ?? 'pcs',
      currentStock: initial?.currentStock ?? 0,
      minimumStock: initial?.minimumStock ?? 0,
      costPrice: initial?.costPrice ?? 0,
      unitPrice: initial?.unitPrice ?? 0,
      imageUrl: initial?.imageUrl ?? null,
    },
  });

  const categoryId = watch('categoryId');
  const unit = watch('unit');
  const imageUrl = watch('imageUrl');

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              Product name <span className="text-destructive">*</span>
            </label>
            <input
              id="name"
              placeholder="e.g. Premium T-Shirt"
              disabled={isSubmitting}
              {...register('name')}
              className="w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Category <span className="text-destructive">*</span>
            </label>
            <Select
              value={categoryId}
              onValueChange={(v) => setValue('categoryId', v, { shouldValidate: true })}
              disabled={isSubmitting || loadingCats}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder={loadingCats ? 'Loading…' : 'Select category'} />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-xs text-destructive">
                {errors.categoryId.message}
              </p>
            )}
          </div>

          {/* Unit */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Unit</label>
            <Select
              value={unit}
              onValueChange={(v) => setValue('unit', v)}
              disabled={isSubmitting}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="costPrice" className="text-sm font-medium">
                Cost price <span className="text-destructive">*</span>
              </label>
              <input
                id="costPrice"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                disabled={isSubmitting}
                {...register('costPrice', { valueAsNumber: true })}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
              {errors.costPrice && (
                <p className="text-xs text-destructive">
                  {errors.costPrice.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="unitPrice" className="text-sm font-medium">
                Selling price <span className="text-destructive">*</span>
              </label>
              <input
                id="unitPrice"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                disabled={isSubmitting}
                {...register('unitPrice', { valueAsNumber: true })}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
              {errors.unitPrice && (
                <p className="text-xs text-destructive">
                  {errors.unitPrice.message}
                </p>
              )}
            </div>
          </div>

          {/* Stock quantities */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="currentStock" className="text-sm font-medium">
                {initial ? 'Current stock' : 'Opening stock'}
              </label>
              <input
                id="currentStock"
                type="number"
                min="0"
                inputMode="numeric"
                disabled={isSubmitting || !!initial} // editing uses Stock module
                {...register('currentStock', { valueAsNumber: true })}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
              {errors.currentStock && (
                <p className="text-xs text-destructive">
                  {errors.currentStock.message}
                </p>
              )}
              {initial && (
                <p className="text-xs text-muted-foreground">
                  Use Stock module to change stock.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="minimumStock" className="text-sm font-medium">
                Minimum stock
              </label>
              <input
                id="minimumStock"
                type="number"
                min="0"
                inputMode="numeric"
                disabled={isSubmitting}
                {...register('minimumStock', { valueAsNumber: true })}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
              {errors.minimumStock && (
                <p className="text-xs text-destructive">
                  {errors.minimumStock.message}
                </p>
              )}
            </div>
          </div>

          {/* Image */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Product image</label>
            <ImageUploader
              value={imageUrl ?? null}
              onChange={(url) => setValue('imageUrl', url)}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="mr-2 size-4" />
              {submitLabel ?? 'Save product'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
