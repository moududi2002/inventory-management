// apps/api/src/categories/category.schema.ts

// Category collection — admin manages categories.
// Product references category by _id (categoryId).

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true, collection: 'categories' })
export class Category {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    maxlength: 80,
    index: true,
  })
  name: string;

  @Prop({ trim: true, maxlength: 300, default: '' })
  description?: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Case-insensitive unique index on name.
// Prevents "Clothing" and "clothing" from both existing.
CategorySchema.index(
  { name: 1 },
  {
    unique: true,
    collation: { locale: 'en', strength: 2 },
  },
);
