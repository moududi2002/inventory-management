// apps/api/src/sales/sale.schema.ts

// Sale collection.
// Supports multi-item receipts. Each item snapshots its selling and cost
// price so that later changes to a product's price don't affect past profits.
//
// Status flow:
//   COMPLETED           → nothing returned yet
//   PARTIALLY_RETURNED  → some items/qty returned
//   FULLY_RETURNED      → everything returned

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SaleStatus =
  | 'COMPLETED'
  | 'PARTIALLY_RETURNED'
  | 'FULLY_RETURNED';

export type SaleDocument = HydratedDocument<Sale>;

// ---------- Subdocument: one line on the receipt ----------

@Schema({ _id: false })
export class SaleItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  sku: string;

  @Prop({ required: true })
  productName: string;

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;

  // Snapshots — never re-read from Product later.
  @Prop({ type: Number, required: true, min: 0 })
  unitPriceAtSale: number;

  @Prop({ type: Number, required: true, min: 0 })
  costPriceAtSale: number;

  @Prop({ type: Number, required: true, min: 0 })
  subtotal: number; // quantity * unitPriceAtSale

  @Prop({ type: Number, required: true })
  profit: number; // (unitPrice - costPrice) * quantity

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  returnedQuantity: number;
}

export const SaleItemSchema = SchemaFactory.createForClass(SaleItem);

// ---------- Main Sale document ----------

@Schema({ timestamps: true, collection: 'sales' })
export class Sale {
  @Prop({ required: true, unique: true, index: true })
  saleId: string; // SL-000001

  @Prop({ type: [SaleItemSchema], required: true })
  items: SaleItem[];

  @Prop({ type: Number, required: true, min: 0 })
  subtotal: number; // sum of item.subtotal

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  discount: number; // flat amount

  @Prop({ type: Number, required: true, min: 0 })
  totalAmount: number; // subtotal - discount

  @Prop({ type: Number, required: true })
  totalProfit: number; // sum of item.profit

  @Prop({
    required: true,
    enum: ['COMPLETED', 'PARTIALLY_RETURNED', 'FULLY_RETURNED'],
    default: 'COMPLETED',
    index: true,
  })
  status: SaleStatus;

  @Prop({ type: Date, required: true, index: true })
  soldAt: Date;

  @Prop({ required: true })
  createdBy: string; // user _id
}

export const SaleSchema = SchemaFactory.createForClass(Sale);

// Fast report queries.
SaleSchema.index({ soldAt: -1 });
SaleSchema.index({ status: 1, soldAt: -1 });
