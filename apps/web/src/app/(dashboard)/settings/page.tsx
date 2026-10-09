// apps/web/src/app/(dashboard)/settings/page.tsx

'use client';

import { PageHeader } from '@/components/layout/page-header';
import { SettingsForm } from '@/components/settings/settings-form';
import { ReceiptSettings } from '@/components/settings/receipt-settings';
import { AlertSettings } from '@/components/settings/alert-settings';
import { AccountSection } from '@/components/settings/account-section';

export default function SettingsPage() {
  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader
        title="Settings"
        description="Shop details, receipt, and alerts"
      />

      {/* 1. Shop Info (with logo) */}
      <SettingsForm />

      {/* 2. Receipt (currency + footer + preview) */}
      <ReceiptSettings />

      {/* 3. Low-stock email alerts */}
      <AlertSettings />

      {/* 4. Account (read-only) */}
      <AccountSection />
    </div>
  );
}
