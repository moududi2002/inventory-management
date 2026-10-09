import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const reportQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  days: z.coerce.number().int().min(1).max(365).default(30),
  categoryId: z.string().regex(objectIdRegex).optional(),
});

export const stockMovementQuerySchema = reportQuerySchema.extend({
  productId: z
    .string({ required_error: 'Product is required' })
    .regex(objectIdRegex, 'Invalid product id'),
});

export const exportQuerySchema = z.object({
  type: z.enum([
    'sales',
    'profit',
    'stock-movement',
    'low-stock',
    'out-of-stock',
    'top-selling',
    'dead-stock',
    'category-stock',
    'daily-summary',
  ]),
  format: z.enum(['csv', 'pdf']).default('csv'),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  productId: z.string().regex(objectIdRegex).optional(),
  categoryId: z.string().regex(objectIdRegex).optional(),
  days: z.coerce.number().int().min(1).max(365).optional(),
});

export type ReportQueryInput = z.infer<typeof reportQuerySchema>;
export type StockMovementQueryInput = z.infer<typeof stockMovementQuerySchema>;
export type ExportQueryInput = z.infer<typeof exportQuerySchema>;
