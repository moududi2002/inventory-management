// apps/api/src/sales/dto/index.ts

// Re-export shared Zod schemas/types from @inventory/validation.

import {
  createSaleSchema,
  saleQuerySchema,
  createSaleReturnSchema,
  saleReturnQuerySchema,
  type CreateSaleInput as SharedCreateSaleInput,
  type SaleQueryInput as SharedSaleQueryInput,
  type CreateSaleReturnInput as SharedCreateSaleReturnInput,
  type SaleReturnQueryInput as SharedSaleReturnQueryInput,
} from '@inventory/validation';

export {
  createSaleSchema,
  saleQuerySchema,
  createSaleReturnSchema,
  saleReturnQuerySchema,
};

export type CreateSaleInput = SharedCreateSaleInput;
export type SaleQueryInput = SharedSaleQueryInput;
export type CreateSaleReturnInput = SharedCreateSaleReturnInput;
export type SaleReturnQueryInput = SharedSaleReturnQueryInput;
