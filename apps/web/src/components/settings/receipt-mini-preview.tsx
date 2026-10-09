// apps/web/src/components/settings/receipt-mini-preview.tsx

'use client';

// Live preview of the shop header as it appears on receipts.
// Updates instantly as the admin edits shop name / address / phone / logo.

import { Package } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ReceiptMiniPreviewProps {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  shopEmail: string;
  logoUrl: string | null;
  currencySymbol: string;
  footerNote: string;
}

export function ReceiptMiniPreview({
  shopName,
  shopAddress,
  shopPhone,
  shopEmail,
  logoUrl,
  currencySymbol,
  footerNote,
}: ReceiptMiniPreviewProps) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live preview
      </div>

      <div className="mx-auto max-w-70 bg-white text-black rounded-md shadow-sm border p-4 text-center">
        {/* Logo */}
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt="logo"
            className="mx-auto max-h-12 object-contain mb-2"
          />
        ) : (
          <div className="mx-auto size-10 rounded-md bg-muted flex items-center justify-center mb-2">
            <Package className="size-5 text-muted-foreground" />
          </div>
        )}

        {/* Shop info */}
        <div className="text-sm font-bold truncate">
          {shopName || 'My Shop'}
        </div>
        {shopAddress && (
          <div className="text-[10px] text-gray-600 mt-0.5 leading-tight">
            {shopAddress}
          </div>
        )}
        {shopPhone && (
          <div className="text-[10px] text-gray-600 mt-0.5">
            Phone: {shopPhone}
          </div>
        )}
        {shopEmail && (
          <div className="text-[10px] text-gray-600 mt-0.5 truncate">
            {shopEmail}
          </div>
        )}

        {/* Fake divider */}
        <div className="my-3 border-t border-dashed border-gray-300" />

        {/* Fake sample line */}
        <div className="flex justify-between text-[10px] text-gray-700">
          <span>Sample item × 2</span>
          <span className="tabular-nums">
            {currencySymbol}1,700.00
          </span>
        </div>

        <div className="my-3 border-t border-dashed border-gray-300" />

        <div className="flex justify-between text-xs font-bold">
          <span>Total</span>
          <span className="tabular-nums">
            {currencySymbol}1,700.00
          </span>
        </div>

        {/* Footer */}
        <div
          className={cn(
            'mt-3 text-[10px] text-gray-600 italic',
            !footerNote && 'opacity-40',
          )}
        >
          {footerNote || 'Thank you for your purchase!'}
        </div>
      </div>
    </div>
  );
}
