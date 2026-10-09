// apps/web/src/components/layout/nav-items.ts

// Single source of truth for navigation items.

import {
  Home,
  Package,
  ArrowDownToLine,
  ShoppingCart,
  RotateCcw,
  BarChart3,
  Settings,
  FolderTree, // ← নতুন
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  showInBottomNav?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: Home,
    showInBottomNav: true,
  },
  {
    href: '/products',
    label: 'Products',
    icon: Package,
    showInBottomNav: true,
  },
  {
    href: '/categories',
    label: 'Categories',
    icon: FolderTree,
    showInBottomNav: false, // lives in "More" on mobile
  },
  {
    href: '/stock',
    label: 'Stock',
    icon: ArrowDownToLine,
    showInBottomNav: true,
  },
  {
    href: '/sales',
    label: 'Sales',
    icon: ShoppingCart,
    showInBottomNav: true,
  },
  {
    href: '/returns',
    label: 'Returns',
    icon: RotateCcw,
    showInBottomNav: false,
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: BarChart3,
    showInBottomNav: true,
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    showInBottomNav: false,
  },
];

export const MORE_ITEMS: NavItem[] = NAV_ITEMS.filter(
  (i) => !i.showInBottomNav,
);

export const BOTTOM_NAV_ITEMS: NavItem[] = NAV_ITEMS.filter(
  (i) => i.showInBottomNav,
);
