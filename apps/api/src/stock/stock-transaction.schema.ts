// apps/api/src/stock/stock-transaction.schema.ts

// Immutable log of every stock movement.
// Types:
//   STOCK_IN   → +stock (purchase / manual add)
//   SALE       → -stock (sale)
//   ADJUSTMENT → set absolute (damage, lost, correction)
//   RETURN     → +stock (customer return)
//
// Direction is stored explicitly so reporting doesn't need to infer it.

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TransactionType = 'STOCK_IN' | 'SALE' | 'ADJUSTMENT' | 'RETURN';
export type TransactionDirection = 'IN' | 'OUT';

export type AdjustmentReason =
  | 'DAMAGED'
  | 'LOST'
  | 'THEFT'
  | 'EXPIRED'
  | 'COUNT_MISMATCH'
  | 'OTHER';

export type StockTransactionDocument = HydratedDocument<StockTransaction>;

@Schema({ timestamps: true, collection: 'stock_transactions' })
export class StockTransaction {
  @Prop({ required: true, unique: true, index: true })
  transactionId: string; // TXN-<timestamp>-<rand>

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
  productId: Types.ObjectId;

  @Prop({ required: true, index: true })
  sku: string;

  @Prop({ required: true, index: true })
  productName: string;

  @Prop({
    required: true,
    enum: ['STOCK_IN', 'SALE', 'ADJUSTMENT', 'RETURN'],
    index: true,
  })
  type: TransactionType;

  @Prop({ required: true, enum: ['IN', 'OUT'], index: true })
  direction: TransactionDirection;

  // Magnitude of change (always positive). Direction tells the sign.
  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  previousStock: number;

  @Prop({ required: true, min: 0 })
  newStock: number;

  // Human-readable reason (e.g. "New Purchase", "Damaged goods")
  @Prop({ required: true, trim: true, maxlength: 300 })
  reason: string;

  // Only for ADJUSTMENT type
  @Prop({
    type: String,
    enum: ['DAMAGED', 'LOST', 'THEFT', 'EXPIRED', 'COUNT_MISMATCH', 'OTHER'],
    default: null,
  })
  adjustmentReason: AdjustmentReason | null;

  // Reference to a Sale (saleId) or Return (returnId) — when applicable.
  @Prop({ type: String, default: null, index: true })
  refId: string | null;

  // Who performed it — user _id
  @Prop({ required: true })
  createdBy: string;
}

export const StockTransactionSchema =
  SchemaFactory.createForClass(StockTransaction);

// Compound index for fast history queries per product, ordered by time.
StockTransactionSchema.index({ productId: 1, createdAt: -1 });

// Compound index for date-range reports.
StockTransactionSchema.index({ type: 1, createdAt: -1 });
