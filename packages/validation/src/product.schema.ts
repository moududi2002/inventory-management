import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createProductSchema = z.object({
  name: z
    .string({ required_error: 'Product name is required' })
    .min(1, 'Product name cannot be empty')
    .max(200, 'Product name is too long')
    .trim(),
  categoryId: z
    .string({ required_error: 'Category is required' })
    .regex(objectIdRegex, 'Invalid category id'),
  unit: z.string().min(1).max(20).trim().default('pcs'),
  currentStock: z.number().int().min(0).default(0),
  minimumStock: z.number().int().min(0).default(0),
  costPrice: z
    .number({ required_error: 'Cost price is required' })
    .min(0, 'Cost price cannot be negative'),
  unitPrice: z
    .number({ required_error: 'Selling price is required' })
    .min(0, 'Selling price cannot be negative'),
  imageUrl: z.string().trim().nullable().optional(),
});

export const updateProductSchema = z
  .object({
    name: z.string().min(1).max(200).trim().optional(),
    categoryId: z.string().regex(objectIdRegex, 'Invalid category id').optional(),
    unit: z.string().min(1).max(20).trim().optional(),
    minimumStock: z.number().int().min(0).optional(),
    costPrice: z.number().min(0).optional(),
    unitPrice: z.number().min(0).optional(),
    imageUrl: z.string().trim().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const productQuerySchema = z.object({
  q: z.string().trim().optional(),
  categoryId: z.string().regex(objectIdRegex).optional(),
  status: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).optional(),
  isActive: z
    .union([z.boolean(), z.string()])
    .transform((v) => (typeof v === 'string' ? v === 'true' : v))
    .optional(),
  lowStockOnly: z
    .union([z.boolean(), z.string()])
    .transform((v) => (typeof v === 'string' ? v === 'true' : v))
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
