// apps/web/src/components/reports/report-shell.tsx

'use client';

// Common layout wrapper for every report page:
//   - back button
//   - title + description
//   - DateRangePicker
//   - ExportButton
//   - children (summary cards, table, chart)

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { DateRangePicker, type DateRange } from './date-range-picker';
import { ExportButton, type ExportType } from './export-buttons';

interface ReportShellProps {
  title: string;
  description?: string;
  range: DateRange;
  onRangeChange: (r: DateRange) => void;
  exportType: ExportType;
  exportParams?: {
    from?: string;
    to?: string;
    productId?: string;
    categoryId?: string;
    days?: number;
  };
  exportDisabled?: boolean;
  /** Optional slot between header and children (e.g., a product picker). */
  filterSlot?: React.ReactNode;
  children: React.ReactNode;
}

export function ReportShell({
  title,
  description,
  range,
  onRangeChange,
  exportType,
  exportParams,
  exportDisabled,
  filterSlot,
  children,
}: ReportShellProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
        <ArrowLeft className="mr-1 size-4" />
        Back
      </Button>

      <PageHeader
        title={title}
        description={description}
        actions={
          <ExportButton
            type={exportType}
            params={{ ...range, ...exportParams }}
            disabled={exportDisabled}
          />
        }
      />

      <DateRangePicker value={range} onChange={onRangeChange} />

      {filterSlot}

      {children}
    </div>
  );
}
