// apps/web/src/components/settings/alert-settings.tsx

'use client';

// Low stock email alert toggle + recipient.
// Note: emails are sent by a backend cron (Step 14 infrastructure —
// mail + scheduler are ready). Enabling here turns the daily digest on.

import { useEffect, useState } from 'react';
import { Bell, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings, useUpdateSettings } from '@/hooks/use-settings';
import { cn } from '@/lib/utils';

export function AlertSettings() {
  const { data, isLoading } = useSettings();
  const update = useUpdateSettings();

  const [enabled, setEnabled] = useState(false);
  const [emailTo, setEmailTo] = useState('');

  useEffect(() => {
    if (!data) return;
    setEnabled(data.lowStockAlertEnabled ?? false);
    setEmailTo(data.lowStockEmailTo ?? '');
  }, [data]);

  const dirty =
    data != null &&
    (enabled !== (data.lowStockAlertEnabled ?? false) ||
      emailTo !== (data.lowStockEmailTo ?? ''));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();

    if (enabled && !emailTo.trim()) {
      toast.error('Recipient email is required when alerts are enabled');
      return;
    }
    // Simple email format check
    if (enabled && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTo.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      await update.mutateAsync({
        lowStockAlertEnabled: enabled,
        lowStockEmailTo: emailTo.trim(),
      });
      toast.success('Alert settings saved');
    } catch {
      // Toasted.
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="size-4" />
          Low Stock Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4">
          {/* Toggle */}
          <button
            type="button"
            onClick={() => setEnabled((v) => !v)}
            disabled={update.isPending}
            className={cn(
              'w-full flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
              enabled
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'bg-background hover:bg-accent/40',
            )}
          >
            <div>
              <div className="text-sm font-medium">
                Daily email digest
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {enabled
                  ? 'A summary of low stock items will be emailed every morning at 9:00.'
                  : 'Get notified by email when products fall below minimum stock.'}
              </div>
            </div>

            {/* Switch */}
            <span
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors',
                enabled ? 'bg-emerald-500' : 'bg-muted',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform',
                  enabled ? 'translate-x-5' : 'translate-x-0.5',
                )}
              />
            </span>
          </button>

          {/* Recipient email (only when enabled) */}
          {enabled && (
            <div className="space-y-1.5">
              <label htmlFor="alertEmail" className="text-sm font-medium">
                Send alerts to <span className="text-destructive">*</span>
              </label>
              <input
                id="alertEmail"
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                disabled={update.isPending}
                placeholder="owner@yourshop.com"
                maxLength={120}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
              <p className="text-xs text-muted-foreground">
                Email is sent from the shop's configured SMTP account.
              </p>
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
      </CardContent>
    </Card>
  );
}
