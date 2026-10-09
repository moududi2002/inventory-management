// apps/web/src/components/products/status-badge.tsx

// Reusable stock-status badge.
//   IN_STOCK     → green
//   LOW_STOCK    → amber
//   OUT_OF_STOCK → red

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProductStatus } from '@inventory/types';

const STYLES: Record<ProductStatus, string> = {
  IN_STOCK:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  LOW_STOCK:
    'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  OUT_OF_STOCK:
    'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400',
};

const LABELS: Record<ProductStatus, string> = {
  IN_STOCK: 'In Stock',
  LOW_STOCK: 'Low',
  OUT_OF_STOCK: 'Out',
};

export function StatusBadge({
  status,
  className,
}: {
  status: ProductStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn('text-[10px] px-1.5 py-0 font-medium', STYLES[status], className)}
    >
      {LABELS[status]}
    </Badge>
  );
}
