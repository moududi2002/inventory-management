// apps/api/src/stock/dto/index.ts

// Re-export shared Zod schemas/types from @inventory/validation.

import {
  addStockSchema,
  adjustStockSchema,
  stockQuerySchema,
  adjustmentReasonEnum,
  type AddStockInput as SharedAddStockInput,
  type AdjustStockInput as SharedAdjustStockInput,
  type StockQueryInput as SharedStockQueryInput,
} from '@inventory/validation';

export {
  addStockSchema,
  adjustStockSchema,
  stockQuerySchema,
  adjustmentReasonEnum,
};
export type AddStockInput = SharedAddStockInput;
export type AdjustStockInput = SharedAdjustStockInput;
export type StockQueryInput = SharedStockQueryInput;
