import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const addStockSchema = z.object({
  productId: z
    .string({ required_error: 'Product is required' })
    .regex(objectIdRegex, 'Invalid product id'),
  quantity: z
    .number({ required_error: 'Quantity is required' })
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0')
    .max(100000, 'Quantity is too large'),
  reason: z
    .string({ required_error: 'Reason is required' })
    .min(1, 'Reason is required')
    .max(200, 'Reason is too long')
    .trim(),
});

export const adjustmentReasonEnum = z.enum([
  'DAMAGED',
  'LOST',
  'THEFT',
  'EXPIRED',
  'COUNT_MISMATCH',
  'OTHER',
]);

export const adjustStockSchema = z.object({
  productId: z
    .string({ required_error: 'Product is required' })
    .regex(objectIdRegex, 'Invalid product id'),
  newQuantity: z
    .number({ required_error: 'New quantity is required' })
    .int('Quantity must be a whole number')
    .min(0, 'Quantity cannot be negative')
    .max(1000000, 'Quantity is too large'),
  adjustmentReason: adjustmentReasonEnum,
  note: z.string().max(300).trim().optional(),
});

export const stockQuerySchema = z.object({
  productId: z.string().regex(objectIdRegex).optional(),
  type: z.enum(['STOCK_IN', 'SALE', 'ADJUSTMENT', 'RETURN']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type AddStockInput = z.infer<typeof addStockSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type StockQueryInput = z.infer<typeof stockQuerySchema>;
