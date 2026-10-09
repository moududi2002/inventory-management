// apps/web/src/app/(dashboard)/layout.tsx

'use client';

// Shell for all authenticated pages:
//   - Sidebar (desktop)
//   - Topbar (mobile)
//   - Bottom nav (mobile)
//   - Live socket subscriptions
//
// Route protection is handled by AuthProvider in the root layout.

import { useLiveStock } from '@/hooks/use-live-stock';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { BottomNav } from '@/components/layout/bottom-nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Subscribe to live stock/sale/product events for this session.
  useLiveStock();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* ---------- Desktop sidebar ---------- */}
      <Sidebar />

      {/* ---------- Main column ---------- */}
      <div className="md:pl-64">
        {/* Mobile top bar */}
        <Topbar />

        {/* Page content — bottom padding for the mobile nav */}
        <main className="p-4 md:p-6 pb-24 md:pb-6 max-w-6xl mx-auto">
          {children}
        </main>
      </div>

      {/* ---------- Mobile bottom nav ---------- */}
      <BottomNav />
    </div>
  );
}
