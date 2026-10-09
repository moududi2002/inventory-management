// apps/web/src/components/reports/report-card.tsx

'use client';

// A single report tile used in the Reports Hub.
//   [icon] Title                       →
//          Short description

import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ReportCardProps {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  badge?: string;
}

const TONE_CLASSES: Record<
  NonNullable<ReportCardProps['tone']>,
  { bg: string; fg: string }
> = {
  default: { bg: 'bg-primary/10', fg: 'text-primary' },
  success: {
    bg: 'bg-emerald-500/10',
    fg: 'text-emerald-600 dark:text-emerald-500',
  },
  warning: {
    bg: 'bg-amber-500/10',
    fg: 'text-amber-600 dark:text-amber-500',
  },
  danger: { bg: 'bg-red-500/10', fg: 'text-red-600 dark:text-red-500' },
  info: { bg: 'bg-blue-500/10', fg: 'text-blue-600 dark:text-blue-500' },
};

export function ReportCard({
  href,
  title,
  description,
  icon: Icon,
  tone = 'default',
  badge,
}: ReportCardProps) {
  const t = TONE_CLASSES[tone];

  return (
    <Link
      href={href}
      className={cn(
        'group flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors',
        'hover:bg-accent/40 hover:border-primary/30',
      )}
    >
      <div
        className={cn(
          'size-10 shrink-0 rounded-lg flex items-center justify-center',
          t.bg,
        )}
      >
        <Icon className={cn('size-5', t.fg)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold truncate">{title}</h3>
          {badge && (
            <span className="text-[10px] px-1.5 py-0 rounded-full border bg-muted/50 text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {description}
        </p>
      </div>

      <ArrowRight className="size-4 text-muted-foreground shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
