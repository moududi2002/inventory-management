// apps/web/src/components/dashboard/quick-actions.tsx

'use client';

// Two prominent CTA buttons: "New Sale" and "Add Stock".
// On mobile they fill equal width; on desktop they stay compact.

import Link from 'next/link';
import { Plus, ShoppingCart } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button asChild size="lg" className="h-12">
        <Link href="/sales/new">
          <ShoppingCart className="mr-2 size-4" />
          New Sale
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline" className="h-12">
        <Link href="/stock">
          <Plus className="mr-2 size-4" />
          Add Stock
        </Link>
      </Button>
    </div>
  );
}
