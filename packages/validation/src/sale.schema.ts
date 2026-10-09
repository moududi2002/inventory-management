import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const saleItemSchema = z.object({
  productId: z
    .string({ required_error: 'Product is required' })
    .regex(objectIdRegex, 'Invalid product id'),
  quantity: z
    .number({ required_error: 'Quantity is required' })
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0'),
  unitPrice: z
    .number()
    .min(0, 'Price cannot be negative')
    .optional(),
});

export const createSaleSchema = z.object({
  items: z
    .array(saleItemSchema)
    .min(1, 'At least one item is required')
    .max(50, 'Too many items in a single sale'),
  discount: z.number().min(0).default(0),
  soldAt: z.string().datetime().optional(),
});

export const saleQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(['COMPLETED', 'PARTIALLY_RETURNED', 'FULLY_RETURNED']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().default('soldAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ---------- Sale Return ----------

const returnItemSchema = z.object({
  productId: z
    .string({ required_error: 'Product is required' })
    .regex(objectIdRegex, 'Invalid product id'),
  quantity: z
    .number({ required_error: 'Quantity is required' })
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0'),
});

export const createSaleReturnSchema = z.object({
  items: z
    .array(returnItemSchema)
    .min(1, 'At least one item is required to return'),
  reason: z
    .string({ required_error: 'Reason is required' })
    .min(1, 'Reason is required')
    .max(300, 'Reason is too long')
    .trim(),
});

export const saleReturnQuerySchema = z.object({
  saleId: z.string().trim().optional(),
  q: z.string().trim().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().default('returnedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type SaleQueryInput = z.infer<typeof saleQuerySchema>;
export type CreateSaleReturnInput = z.infer<typeof createSaleReturnSchema>;
export type SaleReturnQueryInput = z.infer<typeof saleReturnQuerySchema>;
