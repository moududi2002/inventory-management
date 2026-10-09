// apps/web/src/app/(dashboard)/settings/receipt/page.tsx

'use client';

// Sample receipt preview page.
// Fetches the most recent sale (or shows a mock) and lets you preview the
// receipt with current settings. Useful when there are no sales yet.

import { useRouter } from 'next/navigation';
import { ArrowLeft, Receipt } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/layout/empty-state';
import { ReceiptMiniPreview } from '@/components/settings/receipt-mini-preview';
import { useSettings } from '@/hooks/use-settings';

export default function SampleReceiptPage() {
  const router = useRouter();
  const { data: settings, isLoading } = useSettings();

  return (
    <div className="space-y-4 max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
        <ArrowLeft className="mr-1 size-4" />
        Back
      </Button>

      <PageHeader
        title="Receipt Preview"
        description="How your receipts will look with current settings"
      />

      {isLoading || !settings ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={Receipt}
              title="Loading settings…"
              description="Fetching shop information"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <ReceiptMiniPreview
                shopName={settings.shopName}
                shopAddress={settings.shopAddress}
                shopPhone={settings.shopPhone}
                shopEmail={settings.shopEmail}
                logoUrl={settings.logoUrl}
                currencySymbol={settings.currencySymbol}
                footerNote={settings.receiptFooterNote}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-sm space-y-3">
              <h3 className="font-semibold">Current configuration</h3>
              <dl className="divide-y">
                <div className="flex justify-between py-2">
                  <dt className="text-muted-foreground">Shop name</dt>
                  <dd className="font-medium">{settings.shopName}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-muted-foreground">Currency</dt>
                  <dd className="font-medium">{settings.currencySymbol}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-muted-foreground">Footer</dt>
                  <dd className="font-medium text-right max-w-[60%] truncate">
                    {settings.receiptFooterNote}
                  </dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-muted-foreground">Logo</dt>
                  <dd className="font-medium">
                    {settings.logoUrl ? 'Set' : 'None'}
                  </dd>
                </div>
              </dl>
              <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
                Edit in Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
