// apps/web/src/components/settings/settings-form.tsx

'use client';

// Shop info form — name, address, phone, email, logo.
// Submits a PATCH to /settings.

import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LogoUploader } from './logo-uploader';
import { useSettings, useUpdateSettings } from '@/hooks/use-settings';

export function SettingsForm() {
  const { data, isLoading } = useSettings();
  const update = useUpdateSettings();

  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopEmail, setShopEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync state when settings load.
  useEffect(() => {
    if (!data) return;
    setShopName(data.shopName ?? '');
    setShopAddress(data.shopAddress ?? '');
    setShopPhone(data.shopPhone ?? '');
    setShopEmail(data.shopEmail ?? '');
    setLogoUrl(data.logoUrl ?? null);
  }, [data]);

  const dirty =
    data != null &&
    (shopName !== (data.shopName ?? '') ||
      shopAddress !== (data.shopAddress ?? '') ||
      shopPhone !== (data.shopPhone ?? '') ||
      shopEmail !== (data.shopEmail ?? '') ||
      logoUrl !== (data.logoUrl ?? null));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!shopName.trim()) {
      setError('Shop name is required');
      return;
    }

    try {
      await update.mutateAsync({
        shopName: shopName.trim(),
        shopAddress: shopAddress.trim(),
        shopPhone: shopPhone.trim(),
        shopEmail: shopEmail.trim(),
        logoUrl: logoUrl,
      });
      toast.success('Shop info saved');
    } catch {
      // Already toasted.
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Shop Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4">
          {/* Logo */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Logo</label>
            <LogoUploader
              value={logoUrl}
              onChange={setLogoUrl}
              disabled={update.isPending}
            />
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="shopName" className="text-sm font-medium">
              Shop name <span className="text-destructive">*</span>
            </label>
            <input
              id="shopName"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              disabled={update.isPending}
              maxLength={120}
              placeholder="e.g. Rahman Store"
              className="w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            />
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label htmlFor="shopAddress" className="text-sm font-medium">
              Address
            </label>
            <textarea
              id="shopAddress"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              disabled={update.isPending}
              maxLength={400}
              rows={2}
              placeholder="Street, city, postal code"
              className="w-full px-3 py-2 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 resize-none"
            />
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="shopPhone" className="text-sm font-medium">
                Phone
              </label>
              <input
                id="shopPhone"
                type="tel"
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                disabled={update.isPending}
                maxLength={30}
                placeholder="+880 1XXX-XXXXXX"
                className="w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="shopEmail" className="text-sm font-medium">
                Email
              </label>
              <input
                id="shopEmail"
                type="email"
                value={shopEmail}
                onChange={(e) => setShopEmail(e.target.value)}
                disabled={update.isPending}
                maxLength={120}
                placeholder="info@yourshop.com"
                className="w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

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
            {/* Subtle link to sample receipt preview */}
            <div className="mt-4 pt-4 border-t text-right">
            <a
                href="/settings/receipt"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
                Preview receipt with these settings →
            </a>
            </div>
        </CardContent>
        </Card>
    );
}
