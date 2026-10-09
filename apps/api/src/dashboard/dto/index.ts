// apps/api/src/dashboard/dto/index.ts

// Small Zod schemas for query params on dashboard endpoints.
// Using zod directly (not via @inventory/validation) because these are
// UI-shaped and only used by the dashboard controller.

import { z } from 'zod';

// ?limit=10 (for recent-activity & low-stock)
export const dashboardLimitQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// ?days=7 (for sales chart)
export const dashboardChartQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
});

export type DashboardLimitQuery = z.infer<typeof dashboardLimitQuerySchema>;
export type DashboardChartQuery = z.infer<typeof dashboardChartQuerySchema>;
