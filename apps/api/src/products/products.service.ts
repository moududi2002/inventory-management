// apps/api/src/products/products.service.ts

// All product business logic:
//   - create (auto SKU + category validate)
//   - list (search, filters, pagination, computed status)
//   - findById / findBySku
//   - update (patch safe fields)
//   - softDelete
//   - stock adjust (used by StockService in Step 7)
//
// Product status is computed on the fly:
//   currentStock <= 0               → OUT_OF_STOCK
//   currentStock <= minimumStock    → LOW_STOCK
//   else                            → IN_STOCK

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { Product, ProductDocument } from './product.schema';
import { IdGenerator } from '../common/utils/id-generator';
import { CategoriesService } from '../categories/categories.service';
import {
  buildPaginatedResponse,
  getPaginationParams,
  getSkip,
} from '../common/utils/pagination';
import type {
  CreateProductInput,
  ProductQueryInput,
  UpdateProductInput,
} from './dto';
import {
  getProductStatus,
  type ProductListItem,
  type ProductStatus,
  type PaginatedResponse,
} from '@inventory/types';

import { EventsGateway } from '../websocket/events.gateway';


@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly idGenerator: IdGenerator,
    private readonly categoriesService: CategoriesService,
    private readonly events: EventsGateway,
  ) {}

  // ---------- Create ----------

  async create(input: CreateProductInput): Promise<ProductDocument> {
    // 1) Category must exist.
    await this.categoriesService.getOrThrow(input.categoryId);

    // 2) Name duplicate check (case-insensitive) — nice to have.
    const nameExists = await this.productModel
      .findOne({ name: input.name.trim(), isActive: true })
      .collation({ locale: 'en', strength: 2 })
      .exec();
    if (nameExists) {
      throw new ConflictException(`Product "${input.name}" already exists`);
    }

    // 3) Auto-generate SKU.
    const sku = await this.idGenerator.nextProductSku();

    // 4) Save.
    const product = new this.productModel({
      sku,
      name: input.name.trim(),
      categoryId: new Types.ObjectId(input.categoryId),
      unit: input.unit?.trim() || 'pcs',
      currentStock: input.currentStock ?? 0,
      minimumStock: input.minimumStock ?? 0,
      costPrice: input.costPrice,
      unitPrice: input.unitPrice,
      imageUrl: input.imageUrl ?? null,
      isActive: true,
    });

    const saved = await product.save();
    this.events.emitProductCreated({
      productId: saved._id.toString(),
      sku: saved.sku,
      name: saved.name,
    });
    this.events.emitDashboardRefresh({ reason: 'product-created' });
    return saved;
    
  }

  // ---------- Read: list ----------

  async list(query: ProductQueryInput): Promise<
    PaginatedResponse<ProductListItem>
  > {
    const params = getPaginationParams(query);
    const filter: FilterQuery<ProductDocument> = {};

    // Default: only active products unless explicitly asked otherwise.
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    } else {
      filter.isActive = true;
    }

    if (query.categoryId) {
      filter.categoryId = new Types.ObjectId(query.categoryId);
    }

    // Text/partial search on name or SKU (case-insensitive).
    if (query.q && query.q.trim().length > 0) {
      const q = query.q.trim();
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { sku: { $regex: escaped, $options: 'i' } },
      ];
    }

    // Status filter — computed with Mongo operators, so we don't fetch everything.
    if (query.status === 'OUT_OF_STOCK') {
      filter.currentStock = { $lte: 0 };
    } else if (query.status === 'LOW_STOCK') {
      filter.$expr = { $lte: ['$currentStock', '$minimumStock'] };
      filter.currentStock = { $gt: 0 };
    } else if (query.status === 'IN_STOCK') {
      filter.$expr = { $gt: ['$currentStock', '$minimumStock'] };
    }

    // Convenience flag: only low or out of stock.
    if (query.lowStockOnly) {
      filter.$expr = { $lte: ['$currentStock', '$minimumStock'] };
    }

    // Sort (allow safe fields only).
    const allowedSort = new Set([
      'createdAt',
      'updatedAt',
      'name',
      'sku',
      'currentStock',
      'unitPrice',
      'costPrice',
    ]);
    const sortBy = allowedSort.has(params.sortBy) ? params.sortBy : 'createdAt';
    const sortDir = params.sortOrder === 'asc' ? 1 : -1;

    const [docs, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort({ [sortBy]: sortDir })
        .skip(getSkip(params))
        .limit(params.limit)
        .populate({ path: 'categoryId', select: 'name' })
        .lean()
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    const items: ProductListItem[] = docs.map((doc) => {
      const cat = doc.categoryId as unknown as { _id: Types.ObjectId; name: string } | null;
      const status = getProductStatus(doc.currentStock, doc.minimumStock);
      return {
        _id: doc._id.toString(),
        sku: doc.sku,
        name: doc.name,
        categoryId: cat ? cat._id.toString() : '',
        categoryName: cat?.name ?? '',
        unit: doc.unit,
        currentStock: doc.currentStock,
        minimumStock: doc.minimumStock,
        costPrice: doc.costPrice,
        unitPrice: doc.unitPrice,
        imageUrl: doc.imageUrl ?? null,
        status,
        stockValue: doc.currentStock * doc.unitPrice,
        isActive: doc.isActive,
      };
    });

    return buildPaginatedResponse(items, total, params);
  }

  // ---------- Read: single ----------

  async findById(id: string): Promise<ProductDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.productModel
      .findById(id)
      .populate({ path: 'categoryId', select: 'name description' })
      .exec();
  }

  async getOrThrow(id: string): Promise<ProductDocument> {
    const product = await this.findById(id);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findBySku(sku: string): Promise<ProductDocument | null> {
    return this.productModel
      .findOne({ sku: sku.trim().toUpperCase(), isActive: true })
      .populate({ path: 'categoryId', select: 'name' })
      .exec();
  }

  // Batch fetch multiple products by their _ids.
  // Used by SalesService to validate + snapshot all products in one go.
  async findManyByIds(ids: string[]): Promise<ProductDocument[]> {
    const objectIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    if (objectIds.length === 0) return [];

    return this.productModel
      .find({ _id: { $in: objectIds }, isActive: true })
      .exec();
  }

  // ---------- Update ----------

  async update(
    id: string,
    input: UpdateProductInput,
  ): Promise<ProductDocument> {
    const product = await this.getOrThrow(id);

    // Category change: validate target category exists.
    if (input.categoryId && input.categoryId !== product.categoryId.toString()) {
      await this.categoriesService.getOrThrow(input.categoryId);
      product.categoryId = new Types.ObjectId(input.categoryId);
    }

    // Name change: duplicate check.
    if (input.name !== undefined && input.name.trim() !== product.name) {
      const name = input.name.trim();
      const dup = await this.productModel
        .findOne({
          _id: { $ne: product._id },
          name,
          isActive: true,
        })
        .collation({ locale: 'en', strength: 2 })
        .exec();
      if (dup) {
        throw new ConflictException(`Product "${name}" already exists`);
      }
      product.name = name;
    }

    if (input.unit !== undefined) product.unit = input.unit.trim() || 'pcs';
    if (input.minimumStock !== undefined) product.minimumStock = input.minimumStock;
    if (input.costPrice !== undefined) product.costPrice = input.costPrice;
    if (input.unitPrice !== undefined) product.unitPrice = input.unitPrice;
    if (input.imageUrl !== undefined) product.imageUrl = input.imageUrl ?? null;
    if (input.isActive !== undefined) product.isActive = input.isActive;

    const saved = await product.save();
    this.events.emitProductUpdated({
      productId: saved._id.toString(),
      sku: saved.sku,
    });
    this.events.emitDashboardRefresh({ reason: 'product-updated' });
    return saved;

  }

  // ---------- Delete (soft) ----------

  async softDelete(id: string): Promise<{ deleted: true }> {
    const product = await this.getOrThrow(id);
    product.isActive = false;
    await product.save();
    return { deleted: true };
  }

  // ---------- Stock helpers (used by StockService in Step 7) ----------

  // Atomically decrement stock — fails if not enough.
  // Returns the updated doc or throws BadRequestException.
  async decrementStockOrThrow(
    productId: string,
    quantity: number,
  ): Promise<ProductDocument> {
    const updated = await this.productModel
      .findOneAndUpdate(
        { _id: productId, currentStock: { $gte: quantity }, isActive: true },
        { $inc: { currentStock: -quantity } },
        { new: true },
      )
      .exec();

    if (!updated) {
      const exists = await this.productModel.findById(productId).exec();
      if (!exists) throw new NotFoundException('Product not found');
      if (!exists.isActive)
        throw new BadRequestException('Product is disabled');
      throw new BadRequestException(
        `Insufficient stock. Only ${exists.currentStock} ${exists.unit} available.`,
      );
    }

    product.isActive = false;
    await product.save();
    this.events.emitProductDeleted({
      productId: product._id.toString(),
      sku: product.sku,
    });
    this.events.emitDashboardRefresh({ reason: 'product-deleted' });
    return { deleted: true };

  }

  // Atomically increment stock.
  async incrementStockOrThrow(
    productId: string,
    quantity: number,
  ): Promise<ProductDocument> {
    const updated = await this.productModel
      .findOneAndUpdate(
        { _id: productId, isActive: true },
        { $inc: { currentStock: quantity } },
        { new: true },
      )
      .exec();

    if (!updated) {
      const exists = await this.productModel.findById(productId).exec();
      if (!exists) throw new NotFoundException('Product not found');
      if (!exists.isActive)
        throw new BadRequestException('Product is disabled');
    }
    return updated!;
  }

  // Set stock to an absolute value (adjustment flow).
  async setStockOrThrow(
    productId: string,
    newQuantity: number,
  ): Promise<ProductDocument> {
    const updated = await this.productModel
      .findOneAndUpdate(
        { _id: productId, isActive: true },
        { $set: { currentStock: newQuantity } },
        { new: true },
      )
      .exec();

    if (!updated) {
      const exists = await this.productModel.findById(productId).exec();
      if (!exists) throw new NotFoundException('Product not found');
      if (!exists.isActive)
        throw new BadRequestException('Product is disabled');
    }
    return updated!;
  }

  // ---------- Utility: shape a Product for HTTP response ----------

  toApiShape(product: ProductDocument): {
    _id: string;
    sku: string;
    name: string;
    categoryId: string;
    category: { _id: string; name: string; description?: string } | null;
    unit: string;
    currentStock: number;
    minimumStock: number;
    costPrice: number;
    unitPrice: number;
    imageUrl: string | null;
    isActive: boolean;
    status: ProductStatus;
    stockValue: number;
    createdAt: string;
    updatedAt: string;
  } {
    const cat = product.categoryId as unknown as
      | { _id: Types.ObjectId; name: string; description?: string }
      | null;
    return {
      _id: product._id.toString(),
      sku: product.sku,
      name: product.name,
      categoryId: cat ? cat._id.toString() : '',
      category: cat
        ? {
            _id: cat._id.toString(),
            name: cat.name,
            description: cat.description,
          }
        : null,
      unit: product.unit,
      currentStock: product.currentStock,
      minimumStock: product.minimumStock,
      costPrice: product.costPrice,
      unitPrice: product.unitPrice,
      imageUrl: product.imageUrl ?? null,
      isActive: product.isActive,
      status: getProductStatus(product.currentStock, product.minimumStock),
      stockValue: product.currentStock * product.unitPrice,
      createdAt: (product as unknown as { createdAt: Date }).createdAt.toISOString(),
      updatedAt: (product as unknown as { updatedAt: Date }).updatedAt.toISOString(),
    };
  }
}
