// apps/api/src/products/product.schema.ts

// Product collection.
//   - sku: auto-generated (PRD-10001), immutable after creation
//   - currentStock / minimumStock: drives stock status
//   - costPrice / unitPrice: profit calculation on sale
//   - imageUrl: single primary image (uploaded via /uploads module)
//   - isActive: soft delete flag

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true, collection: 'products' })
export class Product {
  @Prop({
    required: true,
    unique: true,
    index: true,
    trim: true,
    immutable: true, // SKU can't be changed after creation
  })
  sku: string;

  @Prop({ required: true, trim: true, maxlength: 200, index: 'text' })
  name: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true,
  })
  categoryId: Types.ObjectId;

  @Prop({ trim: true, default: 'pcs', maxlength: 20 })
  unit: string;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  currentStock: number;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  minimumStock: number;

  // Buying price — used only for profit calculation. Not shown to customers.
  @Prop({ type: Number, required: true, min: 0 })
  costPrice: number;

  // Default selling price.
  @Prop({ type: Number, required: true, min: 0 })
  unitPrice: number;

  @Prop({ type: String, default: null })
  imageUrl: string | null;

  @Prop({ type: Boolean, default: true, index: true })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Text index for fast name search.
ProductSchema.index({ name: 'text', sku: 'text' });

// Compound index to speed up "category + active" queries.
ProductSchema.index({ categoryId: 1, isActive: 1 });

// Index for low-stock queries (currentStock <= minimumStock).
ProductSchema.index({ currentStock: 1, minimumStock: 1 });
