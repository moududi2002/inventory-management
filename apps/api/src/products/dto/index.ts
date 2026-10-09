// apps/api/src/products/dto/index.ts

// Re-export shared Zod schemas/types from @inventory/validation.

import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  type CreateProductInput as SharedCreateProductInput,
  type UpdateProductInput as SharedUpdateProductInput,
  type ProductQueryInput as SharedProductQueryInput,
} from '@inventory/validation';

export { createProductSchema, updateProductSchema, productQuerySchema };
export type CreateProductInput = SharedCreateProductInput;
export type UpdateProductInput = SharedUpdateProductInput;
export type ProductQueryInput = SharedProductQueryInput;
