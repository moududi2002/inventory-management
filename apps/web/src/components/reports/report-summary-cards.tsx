// apps/web/src/components/reports/report-summary-cards.tsx

'use client';

// Small 2-4 column summary strip above report tables.

import { cn } from '@/lib/utils';

export interface SummaryItem {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const TONE_FG: Record<NonNullable<SummaryItem['tone']>, string> = {
  default: 'text-foreground',
  success: 'text-emerald-600 dark:text-emerald-500',
  warning: 'text-amber-600 dark:text-amber-500',
  danger: 'text-red-600 dark:text-red-500',
  info: 'text-blue-600 dark:text-blue-500',
};

interface ReportSummaryCardsProps {
  items: SummaryItem[];
}

export function ReportSummaryCards({ items }: ReportSummaryCardsProps) {
  if (items.length === 0) return null;
  return (
    <div
      className={cn(
        'grid gap-3',
        items.length === 2
          ? 'grid-cols-2'
          : items.length === 3
            ? 'grid-cols-3'
            : 'grid-cols-2 sm:grid-cols-4',
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border bg-card p-3">
          <div className="text-xs text-muted-foreground truncate">
            {item.label}
          </div>
          <div
            className={cn(
              'text-base font-bold tabular-nums mt-0.5 truncate',
              TONE_FG[item.tone ?? 'default'],
            )}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
