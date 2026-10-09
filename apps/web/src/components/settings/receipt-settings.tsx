// apps/web/src/components/settings/receipt-settings.tsx

'use client';

// Receipt customization: currency symbol + footer note + live preview.

import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ReceiptMiniPreview } from './receipt-mini-preview';
import { useSettings, useUpdateSettings } from '@/hooks/use-settings';

const CURRENCY_OPTIONS = ['৳', '₹', '$', '€', '£', '¥'];

export function ReceiptSettings() {
  const { data, isLoading } = useSettings();
  const update = useUpdateSettings();

  const [currencySymbol, setCurrencySymbol] = useState('৳');
  const [receiptFooterNote, setReceiptFooterNote] = useState('');

  useEffect(() => {
    if (!data) return;
    setCurrencySymbol(data.currencySymbol ?? '৳');
    setReceiptFooterNote(data.receiptFooterNote ?? '');
  }, [data]);

  const dirty =
    data != null &&
    (currencySymbol !== (data.currencySymbol ?? '৳') ||
      receiptFooterNote !== (data.receiptFooterNote ?? ''));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await update.mutateAsync({
        currencySymbol: currencySymbol.trim() || '৳',
        receiptFooterNote: receiptFooterNote.trim(),
      });
      toast.success('Receipt settings saved');
    } catch {
      // Toasted.
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Receipt Customization</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Form */}
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Currency symbol</label>
              <div className="flex flex-wrap gap-1.5">
                {CURRENCY_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrencySymbol(c)}
                    disabled={update.isPending}
                    className={
                      'size-10 rounded-md border text-base font-semibold transition-colors ' +
                      (currencySymbol === c
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-accent border-border')
                    }
                  >
                    {c}
                  </button>
                ))}
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value.slice(0, 5))}
                  disabled={update.isPending}
                  maxLength={5}
                  className="w-16 h-10 px-3 rounded-md border bg-background text-sm text-center outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                  placeholder="Other"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="footer" className="text-sm font-medium">
                Receipt footer note
              </label>
              <textarea
                id="footer"
                value={receiptFooterNote}
                onChange={(e) => setReceiptFooterNote(e.target.value)}
                disabled={update.isPending}
                maxLength={300}
                rows={3}
                placeholder="e.g. Thank you! Visit us again."
                className="w-full px-3 py-2 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {receiptFooterNote.length}/300
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={!dirty || update.isPending}>
                {update.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 size-4" />
                    Save changes
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Live preview */}
          <ReceiptMiniPreview
            shopName={data?.shopName ?? ''}
            shopAddress={data?.shopAddress ?? ''}
            shopPhone={data?.shopPhone ?? ''}
            shopEmail={data?.shopEmail ?? ''}
            logoUrl={data?.logoUrl ?? null}
            currencySymbol={currencySymbol}
            footerNote={receiptFooterNote}
          />
        </div>
      </CardContent>
    </Card>
  );
}
