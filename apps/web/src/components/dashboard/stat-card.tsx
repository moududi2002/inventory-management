// apps/web/src/components/dashboard/stat-card.tsx

// A single KPI tile.
//   - icon: small tinted badge
//   - label: e.g. "Products"
//   - value: formatted number/currency
//   - hint: optional sub-line (e.g. "today", "below minimum")
//   - tone: color variant (default / success / warning / danger)
//   - href: optional — wraps in a Link so tapping goes somewhere useful

import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export type StatTone = 'default' | 'success' | 'warning' | 'danger';

const toneClasses: Record<
  StatTone,
  { iconBg: string; iconFg: string; border: string }
> = {
  default: {
    iconBg: 'bg-primary/10',
    iconFg: 'text-primary',
    border: 'border-border',
  },
  success: {
    iconBg: 'bg-emerald-500/10',
    iconFg: 'text-emerald-600 dark:text-emerald-500',
    border: 'border-border',
  },
  warning: {
    iconBg: 'bg-amber-500/10',
    iconFg: 'text-amber-600 dark:text-amber-500',
    border: 'border-border',
  },
  danger: {
    iconBg: 'bg-red-500/10',
    iconFg: 'text-red-600 dark:text-red-500',
    border: 'border-border',
  },
};

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: StatTone;
  href?: string;
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'default',
  href,
  className,
}: StatCardProps) {
  const t = toneClasses[tone];

  const inner = (
    <div
      className={cn(
        'bg-card rounded-xl border p-4 flex flex-col gap-2 transition-colors',
        href && 'hover:bg-accent/40 cursor-pointer',
        t.border,
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <span
          className={cn(
            'size-8 rounded-lg flex items-center justify-center',
            t.iconBg,
          )}
        >
          <Icon className={cn('size-4', t.iconFg)} />
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight truncate">
          {value}
        </span>
      </div>

      {hint && (
        <span className="text-xs text-muted-foreground truncate">{hint}</span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
