// apps/web/src/hooks/use-categories.ts

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api, getApiErrorMessage } from '@/lib/api';
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@inventory/types';

const CATEGORIES_KEY = ['categories'] as const;

// ---------- List ----------
// The backend returns categories with productCount included.
export function useCategories() {
  return useQuery({
    queryKey: [...CATEGORIES_KEY, 'list'],
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: { categories: Category[] };
      }>('/categories');
      return res.data.data.categories;
    },
    staleTime: 60_000,
  });
}

// ---------- Create ----------
export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      const res = await api.post<{
        success: true;
        data: { category: Category };
      }>('/categories', input);
      return res.data.data.category;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CATEGORIES_KEY });
      toast.success('Category created');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

// ---------- Update ----------
export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateCategoryInput;
    }) => {
      const res = await api.patch<{
        success: true;
        data: { category: Category };
      }>(`/categories/${id}`, input);
      return res.data.data.category;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CATEGORIES_KEY });
      toast.success('Category updated');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

// ---------- Delete ----------
export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CATEGORIES_KEY });
      toast.success('Category deleted');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
