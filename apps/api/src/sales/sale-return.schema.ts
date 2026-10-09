// apps/api/src/sales/sale-return.schema.ts

// SaleReturn collection.
// Records a customer return against an existing Sale.
// Multiple returns can reference the same Sale (partial returns over time).
// The original Sale is never deleted — we only update returnedQuantity + status.

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SaleReturnDocument = HydratedDocument<SaleReturn>;

// ---------- Subdocument: one returned item ----------

@Schema({ _id: false })
export class SaleReturnItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  sku: string;

  @Prop({ required: true })
  productName: string;

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;

  // Snapshot from the original sale — never re-read from Product.
  @Prop({ type: Number, required: true, min: 0 })
  unitPriceAtSale: number;

  @Prop({ type: Number, required: true, min: 0 })
  refundAmount: number; // quantity * unitPriceAtSale
}

export const SaleReturnItemSchema = SchemaFactory.createForClass(SaleReturnItem);

// ---------- Main SaleReturn document ----------

@Schema({ timestamps: true, collection: 'sale_returns' })
export class SaleReturn {
  @Prop({ required: true, unique: true, index: true })
  returnId: string; // RT-00001

  // Human-readable sale code from the original sale (SL-000001).
  @Prop({ required: true, index: true })
  saleId: string;

  // ObjectId of the original sale (for reliable joins).
  @Prop({ type: Types.ObjectId, ref: 'Sale', required: true, index: true })
  saleObjectId: Types.ObjectId;

  @Prop({ type: [SaleReturnItemSchema], required: true })
  items: SaleReturnItem[];

  @Prop({ type: Number, required: true, min: 0 })
  totalRefundAmount: number;

  @Prop({ required: true, trim: true, maxlength: 300 })
  reason: string;

  @Prop({ type: Date, required: true, index: true })
  returnedAt: Date;

  @Prop({ required: true })
  createdBy: string; // user _id
}

export const SaleReturnSchema = SchemaFactory.createForClass(SaleReturn);

// Fast report queries.
SaleReturnSchema.index({ returnedAt: -1 });
SaleReturnSchema.index({ saleObjectId: 1, returnedAt: -1 });
