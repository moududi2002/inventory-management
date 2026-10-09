// apps/web/src/components/categories/category-row.tsx

'use client';

// One row in the categories list.
//   [icon]  Name                 12 products
//           Description           ⋮ (More)
//
// Right side shows productCount badge + a More menu with Edit/Delete.

import { FolderTree, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Category } from '@inventory/types';

interface CategoryRowProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoryRow({ category, onEdit, onDelete }: CategoryRowProps) {
  const count = category.productCount ?? 0;

  return (
    <div className="flex items-center gap-3 p-3">
      {/* Icon */}
      <div className="size-10 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        <FolderTree className="size-5" />
      </div>

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{category.name}</span>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 shrink-0"
          >
            {count} {count === 1 ? 'product' : 'products'}
          </Badge>
        </div>
        {category.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {category.description}
          </p>
        )}
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="Category actions"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onSelect={() => onEdit(category)}>
            <Pencil className="mr-2 size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => onDelete(category)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
