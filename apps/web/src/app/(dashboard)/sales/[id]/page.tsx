// apps/web/src/app/(dashboard)/sales/[id]/page.tsx

'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Receipt,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/layout/empty-state';
import { ReceiptPreview } from '@/components/sales/receipt-preview';
import { ReturnDialog } from '@/components/sales/return-dialog';
import { useSale, useSaleReturns } from '@/hooks/use-sales';
import { formatDateTime, formatMoney } from '@/lib/format';
import type { SaleStatus } from '@inventory/types';
import { cn } from '@/lib/utils';

const STATUS_TONE: Record<SaleStatus, string> = {
  COMPLETED:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  PARTIALLY_RETURNED:
    'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  FULLY_RETURNED:
    'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400',
};

const STATUS_LABEL: Record<SaleStatus, string> = {
  COMPLETED: 'Completed',
  PARTIALLY_RETURNED: 'Partial Return',
  FULLY_RETURNED: 'Fully Returned',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SaleDetailsPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: sale, isLoading, isError } = useSale(id);
  const { data: returns } = useSaleReturns(id);
  const [returnOpen, setReturnOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (isError || !sale) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
          <ArrowLeft className="mr-1 size-4" />
          Back
        </Button>
        <EmptyState
          icon={Receipt}
          title="Sale not found"
          description="It may have been removed or the link is incorrect."
        />
      </div>
    );
  }

  const canReturn = sale.status !== 'FULLY_RETURNED';

  return (
    <div className="space-y-4">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
        <ArrowLeft className="mr-1 size-4" />
        Back
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold font-mono">
                  {sale.saleId}
                </h1>
                <Badge
                  variant="outline"
                  className={cn('text-[10px] px-1.5 py-0', STATUS_TONE[sale.status])}
                >
                  {STATUS_LABEL[sale.status]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDateTime(sale.soldAt)} · {sale.items.length} item
                {sale.items.length === 1 ? '' : 's'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {canReturn && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReturnOpen(true)}
                >
                  <RotateCcw className="mr-2 size-4" />
                  Return
                </Button>
              )}
            </div>
          </div>

          {/* Totals strip */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div>
              <div className="text-xs text-muted-foreground">Subtotal</div>
              <div className="text-sm font-semibold tabular-nums">
                {formatMoney(sale.subtotal)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Discount</div>
              <div className="text-sm font-semibold tabular-nums">
                {sale.discount > 0 ? `- ${formatMoney(sale.discount)}` : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-sm font-bold tabular-nums">
                {formatMoney(sale.totalAmount)}
              </div>
            </div>
          </div>

          {sale.totalProfit > 0 && (
            <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
              <TrendingUp className="size-3" />
              Profit {formatMoney(sale.totalProfit)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="size-4" />
            Items
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 divide-y">
          {sale.items.map((item) => {
            const returned = item.returnedQuantity;
            const fullyReturned = returned >= item.quantity;
            return (
              <div key={item.productId} className="py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.productId}`}
                    className="text-sm font-medium truncate hover:underline"
                  >
                    {item.productName}
                  </Link>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {item.sku} · {item.quantity} × {formatMoney(item.unitPriceAtSale)}
                    {returned > 0 ? (
                      <>
                        {' '}
                        · <span className={cn('font-medium', fullyReturned ? 'text-red-600' : 'text-amber-600')}>
                          {returned} returned
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold tabular-nums">
                    {formatMoney(item.subtotal)}
                  </div>
                  {item.profit > 0 && (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +{formatMoney(item.profit)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Returns list (if any) */}
      {returns && returns.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <RotateCcw className="size-4" />
              Returns ({returns.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 divide-y">
            {returns.map((r) => (
              <div key={r._id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium font-mono">{r.returnId}</div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {r.reason}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {formatDateTime(r.returnedAt)} · {r.items.length} line
                    {r.items.length === 1 ? '' : 's'}
                  </div>
                </div>
                <div className="text-right shrink-0 text-sm font-semibold tabular-nums text-blue-700 dark:text-blue-400">
                  {formatMoney(r.totalRefundAmount)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Receipt */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="size-4" />
            Receipt
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ReceiptPreview saleIdOrObjectId={sale._id} saleIdForDisplay={sale.saleId} />
        </CardContent>
      </Card>

      {/* Return dialog */}
      <ReturnDialog sale={sale} open={returnOpen} onOpenChange={setReturnOpen} />
    </div>
  );
}
