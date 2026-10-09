// apps/web/src/components/layout/sidebar.tsx

'use client';

// Desktop sidebar (fixed, 64 = 16rem wide).
// Hidden on mobile (md:flex).

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { NAV_ITEMS } from './nav-items';
import { UserMenu } from './user-menu';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Inventory';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:z-40 border-r bg-card">
      {/* ---------- Brand ---------- */}
      <div className="h-16 flex items-center gap-2 px-5 border-b">
        <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-base font-bold">
          📦
        </div>
        <span className="text-base font-semibold truncate">{APP_NAME}</span>
      </div>

      {/* ---------- Nav ---------- */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ---------- User footer ---------- */}
      <div className="border-t p-3">
        <UserMenu />
      </div>
    </aside>
  );
}
