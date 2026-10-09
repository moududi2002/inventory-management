// apps/web/src/app/(dashboard)/categories/page.tsx

'use client';

import { useState } from 'react';
import { Plus, FolderTree } from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CategoryList } from '@/components/categories/category-list';
import { CategoryFormDialog } from '@/components/categories/category-form-dialog';
import { DeleteCategoryDialog } from '@/components/categories/delete-category-dialog';
import { useCategories } from '@/hooks/use-categories';
import type { Category } from '@inventory/types';

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);

  // Handlers
  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setFormOpen(true);
  };

  const openDelete = (category: Category) => {
    setDeleting(category);
    setDeleteOpen(true);
  };

  const totalProducts =
    categories?.reduce((sum, c) => sum + (c.productCount ?? 0), 0) ?? 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Categories"
        description={`${categories?.length ?? 0} categories · ${totalProducts} products total`}
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            New Category
          </Button>
        }
      />

      {/* Small info banner on desktop */}
      <Card className="hidden md:block">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FolderTree className="size-5" />
          </div>
          <div className="text-sm">
            <p className="font-medium">Organize your catalog</p>
            <p className="text-muted-foreground">
              Categories help you filter products and see stock grouped by type.
              You can rename or delete them anytime — deletion is blocked while
              products are attached.
            </p>
          </div>
        </CardContent>
      </Card>

      <CategoryList
        categories={categories}
        isLoading={isLoading}
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={openDelete}
      />

      {/* ---------- Dialogs ---------- */}
      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing}
      />

      <DeleteCategoryDialog
        category={deleting}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
