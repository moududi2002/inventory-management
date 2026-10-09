// apps/web/src/components/layout/bottom-nav.tsx

'use client';

// Mobile bottom navigation.
// Shows the 5 "showInBottomNav" items. Anything else lives behind the last
// item (More) which opens a simple drawer/dialog.

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MoreHorizontal } from 'lucide-react';

import { cn } from '@/lib/utils';
import { BOTTOM_NAV_ITEMS, MORE_ITEMS } from './nav-items';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  // Some routes (like /login) shouldn't show the bottom nav.
  // The dashboard layout mounts this only for authed routes.

  return (
    <>
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40 md:hidden',
          'border-t bg-card',
          'pb-safe', // iOS safe-area
        )}
        aria-label="Primary"
      >
        <ul className="grid grid-cols-6 h-16">
          {BOTTOM_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href} className="flex">
                <Link
                  href={href}
                  className={cn(
                    'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="size-5" />
                  <span className="truncate">{label}</span>
                </Link>
              </li>
            );
          })}

          {/* ---------- More button ---------- */}
          <li className="flex">
            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                    MORE_ITEMS.some((i) => pathname.startsWith(i.href))
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  aria-label="More"
                >
                  <MoreHorizontal className="size-5" />
                  <span>More</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl">
                <SheetHeader className="text-left">
                  <SheetTitle>More</SheetTitle>
                </SheetHeader>
                <div className="grid gap-2 py-4">
                  {MORE_ITEMS.map(({ href, label, icon: Icon }) => (
                    <Button
                      key={href}
                      asChild
                      variant="ghost"
                      className="justify-start h-12 text-base"
                      onClick={() => setMoreOpen(false)}
                    >
                      <Link href={href}>
                        <Icon className="mr-3 size-5" />
                        {label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </li>
        </ul>
      </nav>
    </>
  );
}
