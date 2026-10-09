// apps/web/src/components/layout/topbar.tsx

'use client';

// Mobile-only top bar with the current page title + user menu.

import { usePathname } from 'next/navigation';

import { NAV_ITEMS } from './nav-items';
import { UserMenu } from './user-menu';

function getTitleFromPath(pathname: string): string {
  // Match the longest href prefix so /products/new resolves to /products.
  const sorted = [...NAV_ITEMS].sort((a, b) => b.href.length - a.href.length);
  const match = sorted.find((i) => pathname.startsWith(i.href));
  return match?.label ?? 'Inventory';
}

export function Topbar() {
  const pathname = usePathname();
  const title = getTitleFromPath(pathname);

  return (
    <header className="md:hidden sticky top-0 z-30 h-14 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
            📦
          </div>
          <h1 className="text-base font-semibold truncate">{title}</h1>
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
