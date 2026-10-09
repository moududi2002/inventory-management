// apps/api/src/categories/categories.service.ts

// Business logic for categories:
//   - list with product counts (aggregated)
//   - create (name unique, case-insensitive)
//   - update (name unique)
//   - delete (only if no products attached)
//   - getOrThrow helper used by other modules

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Category, CategoryDocument } from './category.schema';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from './dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    // Product model is injected lazily via connection to avoid circular import.
    // We use a raw reference by name registered in ProductsModule in Step 6.
  ) {}

  // ---------- Read ----------

  // List all categories sorted by name, with a productCount per category.
  // productCount uses $lookup against the products collection.
  async list(): Promise<Array<{
    _id: string;
    name: string;
    description?: string;
    productCount: number;
    createdAt: string;
    updatedAt: string;
  }>> {
    const results = await this.categoryModel
      .aggregate([
        {
          $lookup: {
            from: 'products',
            let: { categoryId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$categoryId', '$$categoryId'] },
                  isActive: true,
                },
              },
              { $count: 'count' },
            ],
            as: 'productAgg',
          },
        },
        {
          $addFields: {
            productCount: {
              $ifNull: [{ $arrayElemAt: ['$productAgg.count', 0] }, 0],
            },
          },
        },
        { $project: { productAgg: 0 } },
        { $sort: { name: 1 } },
      ])
      .exec();

    return results.map((c) => ({
      _id: c._id.toString(),
      name: c.name,
      description: c.description ?? '',
      productCount: c.productCount ?? 0,
      createdAt: (c.createdAt as Date).toISOString(),
      updatedAt: (c.updatedAt as Date).toISOString(),
    }));
  }

  async findById(id: string): Promise<CategoryDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.categoryModel.findById(id).exec();
  }

  // Throws if missing or invalid id. Used by other modules (products).
  async getOrThrow(id: string): Promise<CategoryDocument> {
    const category = await this.findById(id);
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  // ---------- Create ----------

  async create(input: CreateCategoryInput): Promise<CategoryDocument> {
    const name = input.name.trim();

    // Case-insensitive duplicate check.
    const existing = await this.categoryModel
      .findOne({ name })
      .collation({ locale: 'en', strength: 2 })
      .exec();
    if (existing) {
      throw new ConflictException(`Category "${name}" already exists`);
    }

    const created = new this.categoryModel({
      name,
      description: input.description?.trim() ?? '',
    });
    return created.save();
  }

  // ---------- Update ----------

  async update(
    id: string,
    input: UpdateCategoryInput,
  ): Promise<CategoryDocument> {
    const category = await this.getOrThrow(id);

    if (input.name !== undefined) {
      const name = input.name.trim();

      // Duplicate check excluding self.
      const duplicate = await this.categoryModel
        .findOne({
          _id: { $ne: category._id },
          name,
        })
        .collation({ locale: 'en', strength: 2 })
        .exec();
      if (duplicate) {
        throw new ConflictException(`Category "${name}" already exists`);
      }

      category.name = name;
    }

    if (input.description !== undefined) {
      category.description = input.description.trim();
    }

    return category.save();
  }

  // ---------- Delete ----------

  async remove(id: string): Promise<{ deleted: true }> {
    const category = await this.getOrThrow(id);

    // Safety: block deletion if any active product references this category.
    const productCount = await this.countActiveProducts(category._id);
    if (productCount > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${productCount} product(s). Move or delete products first.`,
      );
    }

    await this.categoryModel.deleteOne({ _id: category._id }).exec();
    return { deleted: true };
  }

  // ---------- Helpers ----------

  // Count active products in a category (used by delete guard).
  // Uses `products` collection directly — avoids circular module import.
  private async countActiveProducts(categoryId: Types.ObjectId): Promise<number> {
    const db = this.categoryModel.db;
    return db
      .collection('products')
      .countDocuments({ categoryId, isActive: true });
  }
}
