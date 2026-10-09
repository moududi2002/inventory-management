// apps/api/src/reports/dto/index.ts

// Re-export shared Zod schemas/types from @inventory/validation.
// Also adds a helper for date-range defaulting (last 30 days if empty).

import {
  reportQuerySchema,
  stockMovementQuerySchema,
  exportQuerySchema,
  type ReportQueryInput as SharedReportQueryInput,
  type StockMovementQueryInput as SharedStockMovementQueryInput,
  type ExportQueryInput as SharedExportQueryInput,
} from '@inventory/validation';

export { reportQuerySchema, stockMovementQuerySchema, exportQuerySchema };
export type ReportQueryInput = SharedReportQueryInput;
export type StockMovementQueryInput = SharedStockMovementQueryInput;
export type ExportQueryInput = SharedExportQueryInput;

// Resolve a from/to pair to concrete Date objects.
//   - if from missing: from = to - (days - 1) at 00:00, or default 30 days back
//   - if to missing:   to   = now
export function resolveDateRange(
  input: { from?: string; to?: string; days?: number },
  defaultDays = 30,
): { from: Date; to: Date } {
  const to = input.to ? new Date(input.to) : new Date();
  to.setHours(23, 59, 59, 999);

  let from: Date;
  if (input.from) {
    from = new Date(input.from);
  } else {
    const days = input.days ?? defaultDays;
    from = new Date(to);
    from.setDate(from.getDate() - (days - 1));
  }
  from.setHours(0, 0, 0, 0);

  return { from, to };
}
