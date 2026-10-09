// apps/api/src/categories/dto/index.ts

// Re-export shared Zod schemas/types so the controller imports from one place.
// Source of truth lives in @inventory/validation.

import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput as SharedCreateCategoryInput,
  type UpdateCategoryInput as SharedUpdateCategoryInput,
} from '@inventory/validation';

export { createCategorySchema, updateCategorySchema };
export type CreateCategoryInput = SharedCreateCategoryInput;
export type UpdateCategoryInput = SharedUpdateCategoryInput;
