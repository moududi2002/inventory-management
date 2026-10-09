// apps/web/src/components/reports/report-table.tsx

'use client';

// Generic report table.
//   - columns: key, label, align, width, render(row) → ReactNode
//   - rows: array
//   - loading: skeleton
//   - empty: custom message
//
// Mobile: horizontal scroll so no data is lost.

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export interface ReportColumn<T> {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  render: (row: T, index: number) => React.ReactNode;
  className?: string;
}

interface ReportTableProps<T> {
  columns: ReportColumn<T>[];
  rows: T[] | undefined;
  isLoading: boolean;
  emptyMessage?: string;
  rowKey: (row: T, index: number) => string;
}

export function ReportTable<T>({
  columns,
  rows,
  isLoading,
  emptyMessage = 'No data for the selected range',
  rowKey,
}: ReportTableProps<T>) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-3 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-md" />
        ))}
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-xl border bg-card py-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-3 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap',
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                        ? 'text-center'
                        : 'text-left',
                    col.className,
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row, i) => (
              <tr key={rowKey(row, i)} className="hover:bg-accent/30">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-3 py-2.5 whitespace-nowrap tabular-nums',
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                          ? 'text-center'
                          : 'text-left',
                      col.className,
                    )}
                  >
                    {col.render(row, i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
