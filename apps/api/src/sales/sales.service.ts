// apps/api/src/sales/sales.service.ts

// Sales business logic:
//   - create: multi-item, snapshots prices, deducts stock via StockService
//   - list: filter by date / status / search saleId
//   - findById / findBySaleId
//   - toApiShape / toListShape
//
// If any item fails (insufficient stock), the whole sale is aborted and
// the stock changes already applied are rolled back in-memory style.
// (We keep track of applied items and reverse them in the catch block.)

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { Sale, SaleDocument, type SaleStatus } from './sale.schema';
import { ProductsService } from '../products/products.service';
import { StockService } from '../stock/stock.service';
import { IdGenerator } from '../common/utils/id-generator';
import {
  buildPaginatedResponse,
  getPaginationParams,
  getSkip,
} from '../common/utils/pagination';
import type { CreateSaleInput, SaleQueryInput } from './dto';
import type {
  PaginatedResponse,
  Sale as SharedSale,
  SaleListItem as SharedSaleListItem,
} from '@inventory/types';

import { EventsGateway } from '../websocket/events.gateway';


@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    @InjectModel(Sale.name)
    private readonly saleModel: Model<SaleDocument>,
    private readonly productsService: ProductsService,
    private readonly stockService: StockService,
    private readonly idGenerator: IdGenerator,
    private readonly events: EventsGateway,
  ) {}

  // ---------- CREATE ----------

  async create(
    input: CreateSaleInput,
    userId: string,
  ): Promise<SharedSale> {
    // 1) Load every product (single batch), validate all exist.
    const productIds = input.items.map((i) => i.productId);
    // Duplicate productIds in the same sale? Merge them for safety.
    const merged = this.mergeDuplicateItems(input.items);

    const products = await this.productsService.findManyByIds(merged.map((i) => i.productId));
    if (products.length !== merged.length) {
      throw new NotFoundException('One or more products not found');
    }
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    // 2) Pre-validate stock for every item BEFORE touching DB.
    //    This prevents half-applied sales.
    for (const item of merged) {
      const product = productMap.get(item.productId)!;
      if (product.currentStock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.name}". Only ${product.currentStock} ${product.unit} available.`,
        );
      }
    }

    // 3) Generate saleId.
    const saleId = await this.idGenerator.nextSaleId();

    // 4) Build item snapshots.
    const itemSnapshots = merged.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPriceAtSale = item.unitPrice ?? product.unitPrice;
      const costPriceAtSale = product.costPrice;
      const subtotal = unitPriceAtSale * item.quantity;
      const profit = (unitPriceAtSale - costPriceAtSale) * item.quantity;

      return {
        productId: product._id,
        sku: product.sku,
        productName: product.name,
        quantity: item.quantity,
        unitPriceAtSale,
        costPriceAtSale,
        subtotal,
        profit,
        returnedQuantity: 0,
      };
    });

    const subtotal = itemSnapshots.reduce((s, i) => s + i.subtotal, 0);
    const discount = input.discount ?? 0;

    if (discount > subtotal) {
      throw new BadRequestException(
        'Discount cannot be greater than the subtotal',
      );
    }

    const totalAmount = subtotal - discount;
    const totalProfit = itemSnapshots.reduce((s, i) => s + i.profit, 0);

    // 5) Apply stock changes one by one — track applied items for rollback.
    const applied: Array<{ productId: string; quantity: number }> = [];

    try {
      for (const item of itemSnapshots) {
        await this.stockService.recordSale({
          productId: item.productId.toString(),
          quantity: item.quantity,
          saleId,
          userId,
        });
        applied.push({
          productId: item.productId.toString(),
          quantity: item.quantity,
        });
      }
    } catch (err) {
      // Roll back everything we already applied.
      this.logger.error(
        `Sale ${saleId} failed mid-way, rolling back ${applied.length} item(s)`,
        err instanceof Error ? err.stack : undefined,
      );
      for (const a of applied) {
        try {
          await this.stockService.recordReturn({
            productId: a.productId,
            quantity: a.quantity,
            returnId: `ROLLBACK-${saleId}`,
            userId,
          });
        } catch (rollbackErr) {
          this.logger.error(
            `Rollback failed for ${a.productId}`,
            rollbackErr instanceof Error ? rollbackErr.stack : undefined,
          );
        }
      }
      throw err;
    }

    // 6) Save the Sale document.
    const sale = new this.saleModel({
      saleId,
      items: itemSnapshots,
      subtotal,
      discount,
      totalAmount,
      totalProfit,
      status: 'COMPLETED' as SaleStatus,
      soldAt: input.soldAt ? new Date(input.soldAt) : new Date(),
      createdBy: userId,
    });

    const saved = await sale.save();

    // 7) TODO (Step 15): emit socket events 'sale:created' + 'stock:updated'.

    this.events.emitSaleCreated({
      saleId: saved.saleId,
      totalAmount: saved.totalAmount,
      totalProfit: saved.totalProfit,
    });
    this.events.emitDashboardRefresh({ reason: 'sale-created' })

    return this.toApiShape(saved);
  }

  // ---------- READ: list ----------

  async list(
    query: SaleQueryInput,
  ): Promise<PaginatedResponse<SharedSaleListItem>> {
    const params = getPaginationParams(query);
    const filter: FilterQuery<SaleDocument> = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.q && query.q.trim()) {
      const q = query.q.trim();
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.saleId = { $regex: escaped, $options: 'i' };
    }

    if (query.from || query.to) {
      filter.soldAt = {};
      if (query.from) (filter.soldAt as Record<string, Date>).$gte = new Date(query.from);
      if (query.to) (filter.soldAt as Record<string, Date>).$lte = new Date(query.to);
    }

    const allowedSort = new Set(['soldAt', 'totalAmount', 'totalProfit', 'createdAt']);
    const sortBy = allowedSort.has(params.sortBy) ? params.sortBy : 'soldAt';
    const sortDir = params.sortOrder === 'asc' ? 1 : -1;

    const [docs, total] = await Promise.all([
      this.saleModel
        .find(filter)
        .sort({ [sortBy]: sortDir })
        .skip(getSkip(params))
        .limit(params.limit)
        .lean()
        .exec(),
      this.saleModel.countDocuments(filter).exec(),
    ]);

    const items: SharedSaleListItem[] = docs.map((d) => this.toListShape(d));
    return buildPaginatedResponse(items, total, params);
  }

  // ---------- READ: single ----------

  async findById(id: string): Promise<SaleDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.saleModel.findById(id).exec();
  }

  async getOrThrow(id: string): Promise<SaleDocument> {
    const sale = await this.findById(id);
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }

  async findBySaleId(saleId: string): Promise<SaleDocument | null> {
    return this.saleModel.findOne({ saleId: saleId.trim().toUpperCase() }).exec();
  }

  async getBySaleIdOrThrow(saleId: string): Promise<SaleDocument> {
    const sale = await this.findBySaleId(saleId);
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }

  // ---------- INTERNAL helpers ----------

  // Merges items with the same productId so a single sale has unique lines.
  private mergeDuplicateItems(
    items: Array<{ productId: string; quantity: number; unitPrice?: number }>,
  ): Array<{ productId: string; quantity: number; unitPrice?: number }> {
    const map = new Map<
      string,
      { productId: string; quantity: number; unitPrice?: number }
    >();
    for (const it of items) {
      const existing = map.get(it.productId);
      if (existing) {
        existing.quantity += it.quantity;
        // If both specify a price and they differ, we keep the last one.
        // (Frontend prevents this anyway.)
        if (it.unitPrice !== undefined) existing.unitPrice = it.unitPrice;
      } else {
        map.set(it.productId, { ...it });
      }
    }
    return Array.from(map.values());
  }

  // ---------- Shapes ----------

  private toApiShape(sale: SaleDocument): SharedSale {
    return {
      _id: sale._id.toString(),
      saleId: sale.saleId,
      items: sale.items.map((i) => ({
        productId: i.productId.toString(),
        sku: i.sku,
        productName: i.productName,
        quantity: i.quantity,
        unitPriceAtSale: i.unitPriceAtSale,
        costPriceAtSale: i.costPriceAtSale,
        subtotal: i.subtotal,
        profit: i.profit,
        returnedQuantity: i.returnedQuantity,
      })),
      subtotal: sale.subtotal,
      discount: sale.discount,
      totalAmount: sale.totalAmount,
      totalProfit: sale.totalProfit,
      status: sale.status,
      soldAt: sale.soldAt.toISOString(),
      createdBy: sale.createdBy,
      createdAt: (sale as unknown as { createdAt: Date }).createdAt.toISOString(),
      updatedAt: (sale as unknown as { updatedAt: Date }).updatedAt.toISOString(),
    };
  }

  private toListShape(sale: {
    _id: Types.ObjectId;
    saleId: string;
    items: Array<{
      productName: string;
      quantity: number;
    }>;
    totalAmount: number;
    totalProfit: number;
    status: SaleStatus;
    soldAt: Date;
  }): SharedSaleListItem {
    const itemCount = sale.items.length;
    const totalQuantity = sale.items.reduce((s, i) => s + i.quantity, 0);
    const firstItemName = sale.items[0]?.productName ?? '';

    return {
      _id: sale._id.toString(),
      saleId: sale.saleId,
      itemCount,
      totalQuantity,
      totalAmount: sale.totalAmount,
      totalProfit: sale.totalProfit,
      status: sale.status,
      soldAt: sale.soldAt.toISOString(),
      firstItemName,
    };
  }
}
