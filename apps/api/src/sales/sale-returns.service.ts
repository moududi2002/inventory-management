// apps/api/src/sales/sale-returns.service.ts

// Sale Return business logic:
//   - createReturn: validates, deducts from sale's returnable qty,
//                   adds stock back, logs a StockTransaction (RETURN),
//                   writes a SaleReturn, updates Sale status.
//   - list: paginated with filters (saleId, date range, free text)
//   - findById / getOrThrow
//
// Constraints:
//   - Return quantity per item cannot exceed (original - already returned).
//   - Return quantity must be > 0.
//   - Sale must exist.
//   - Unknown productId in return items → error.

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import {
  SaleReturn,
  SaleReturnDocument,
} from './sale-return.schema';
import { Sale, SaleDocument, type SaleStatus } from './sale.schema';
import { StockService } from '../stock/stock.service';
import { IdGenerator } from '../common/utils/id-generator';
import {
  buildPaginatedResponse,
  getPaginationParams,
  getSkip,
} from '../common/utils/pagination';
import type { CreateSaleReturnInput, SaleReturnQueryInput } from './dto';
import type {
  PaginatedResponse,
  SaleReturn as SharedSaleReturn,
} from '@inventory/types';


import { EventsGateway } from '../websocket/events.gateway';


@Injectable()
export class SaleReturnsService {
  private readonly logger = new Logger(SaleReturnsService.name);

  constructor(
    @InjectModel(SaleReturn.name)
    private readonly returnModel: Model<SaleReturnDocument>,
    @InjectModel(Sale.name)
    private readonly saleModel: Model<SaleDocument>,
    private readonly stockService: StockService,
    private readonly idGenerator: IdGenerator,
    private readonly events: EventsGateway,
  ) {}

  // ---------- CREATE ----------

  async createReturn(
    saleIdOrObjectId: string,
    input: CreateSaleReturnInput,
    userId: string,
  ): Promise<SharedSaleReturn> {
    // 1) Load the original sale.
    const sale = await this.loadSale(saleIdOrObjectId);

    // 2) Reject if the sale is fully returned already.
    if (sale.status === 'FULLY_RETURNED') {
      throw new BadRequestException('This sale is already fully returned');
    }

    // 3) Merge duplicate productIds in the return request.
    const mergedItems = this.mergeDuplicateItems(input.items);

    // 4) Validate + build return item snapshots.
    const returnItems: Array<{
      productId: Types.ObjectId;
      sku: string;
      productName: string;
      quantity: number;
      unitPriceAtSale: number;
      refundAmount: number;
    }> = [];

    for (const reqItem of mergedItems) {
      // Find the corresponding line in the original sale.
      const saleItem = sale.items.find(
        (i) => i.productId.toString() === reqItem.productId,
      );

      if (!saleItem) {
        throw new BadRequestException(
          `Product ${reqItem.productId} is not part of sale ${sale.saleId}`,
        );
      }

      const remaining = saleItem.quantity - saleItem.returnedQuantity;

      if (remaining <= 0) {
        throw new BadRequestException(
          `"${saleItem.productName}" has already been fully returned`,
        );
      }

      if (reqItem.quantity > remaining) {
        throw new BadRequestException(
          `Cannot return ${reqItem.quantity} of "${saleItem.productName}". Only ${remaining} remaining.`,
        );
      }

      returnItems.push({
        productId: saleItem.productId,
        sku: saleItem.sku,
        productName: saleItem.productName,
        quantity: reqItem.quantity,
        unitPriceAtSale: saleItem.unitPriceAtSale,
        refundAmount: reqItem.quantity * saleItem.unitPriceAtSale,
      });
    }

    // 5) Generate returnId.
    const returnId = await this.idGenerator.nextReturnId();
    const returnedAt = new Date();

    // 6) Add stock back for every returned item (atomic + logs RETURN).
    //    Track applied items so we can roll back if something fails mid-way.
    const applied: Array<{ productId: string; quantity: number }> = [];
    try {
      for (const item of returnItems) {
        await this.stockService.recordReturn({
          productId: item.productId.toString(),
          quantity: item.quantity,
          returnId,
          userId,
        });
        applied.push({
          productId: item.productId.toString(),
          quantity: item.quantity,
        });
      }
    } catch (err) {
      // Rollback: deduct the stock we already added.
      this.logger.error(
        `Return ${returnId} failed mid-way, rolling back ${applied.length} item(s)`,
        err instanceof Error ? err.stack : undefined,
      );
      for (const a of applied) {
        try {
          await this.stockService.recordSale({
            productId: a.productId,
            quantity: a.quantity,
            saleId: `ROLLBACK-${returnId}`,
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

    // 7) Save the SaleReturn document.
    const totalRefundAmount = returnItems.reduce(
      (s, i) => s + i.refundAmount,
      0,
    );

    const returnDoc = new this.returnModel({
      returnId,
      saleId: sale.saleId,
      saleObjectId: sale._id,
      items: returnItems,
      totalRefundAmount,
      reason: input.reason.trim(),
      returnedAt,
      createdBy: userId,
    });

    const saved = await returnDoc.save();

    // 8) Update the original Sale: returnedQuantity per item + status.
    this.updateSaleAfterReturn(sale, returnItems);

    await sale.save();

    // 9) TODO (Step 15): emit socket events 'sale:returned' + 'stock:updated'.

    this.events.emitSaleReturned({
      saleId: sale.saleId,
      returnId: saved.returnId,
      refundAmount: saved.totalRefundAmount,
    });
    this.events.emitDashboardRefresh({ reason: 'sale-returned' });

    return this.toApiShape(saved);
  }

  // ---------- READ: list ----------

  async list(
    query: SaleReturnQueryInput,
  ): Promise<PaginatedResponse<SharedSaleReturn>> {
    const params = getPaginationParams(query);
    const filter: FilterQuery<SaleReturnDocument> = {};

    if (query.saleId) {
      filter.saleId = query.saleId.trim().toUpperCase();
    }

    if (query.q && query.q.trim()) {
      const q = query.q.trim();
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { returnId: { $regex: escaped, $options: 'i' } },
        { saleId: { $regex: escaped, $options: 'i' } },
      ];
    }

    if (query.from || query.to) {
      filter.returnedAt = {};
      if (query.from)
        (filter.returnedAt as Record<string, Date>).$gte = new Date(query.from);
      if (query.to)
        (filter.returnedAt as Record<string, Date>).$lte = new Date(query.to);
    }

    const allowedSort = new Set(['returnedAt', 'totalRefundAmount', 'createdAt']);
    const sortBy = allowedSort.has(params.sortBy) ? params.sortBy : 'returnedAt';
    const sortDir = params.sortOrder === 'asc' ? 1 : -1;

    const [docs, total] = await Promise.all([
      this.returnModel
        .find(filter)
        .sort({ [sortBy]: sortDir })
        .skip(getSkip(params))
        .limit(params.limit)
        .lean()
        .exec(),
      this.returnModel.countDocuments(filter).exec(),
    ]);

    const items: SharedSaleReturn[] = docs.map((d) => this.toApiShape(d));
    return buildPaginatedResponse(items, total, params);
  }

  // ---------- READ: single ----------

  async findById(id: string): Promise<SaleReturnDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.returnModel.findById(id).exec();
  }

  async getOrThrow(id: string): Promise<SaleReturnDocument> {
    const doc = await this.findById(id);
    if (!doc) throw new NotFoundException('Return not found');
    return doc;
  }

  async listBySale(saleIdOrObjectId: string): Promise<SharedSaleReturn[]> {
    const sale = await this.loadSale(saleIdOrObjectId);
    const docs = await this.returnModel
      .find({ saleObjectId: sale._id })
      .sort({ returnedAt: -1 })
      .lean()
      .exec();
    return docs.map((d) => this.toApiShape(d));
  }

  // ---------- INTERNAL helpers ----------

  // Accepts either the sale _id (ObjectId) or the human saleId (SL-000001).
  private async loadSale(idOrCode: string): Promise<SaleDocument> {
    let sale: SaleDocument | null = null;

    if (Types.ObjectId.isValid(idOrCode)) {
      sale = await this.saleModel.findById(idOrCode).exec();
    }

    if (!sale) {
      sale = await this.saleModel
        .findOne({ saleId: idOrCode.trim().toUpperCase() })
        .exec();
    }

    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }

  // Merge duplicate productIds within a single return request.
  private mergeDuplicateItems(
    items: Array<{ productId: string; quantity: number }>,
  ): Array<{ productId: string; quantity: number }> {
    const map = new Map<string, { productId: string; quantity: number }>();
    for (const it of items) {
      const existing = map.get(it.productId);
      if (existing) existing.quantity += it.quantity;
      else map.set(it.productId, { ...it });
    }
    return Array.from(map.values());
  }

  // Update the original sale's items + status after a return.
  private updateSaleAfterReturn(
    sale: SaleDocument,
    returnItems: Array<{ productId: Types.ObjectId; quantity: number }>,
  ): void {
    for (const ret of returnItems) {
      const saleItem = sale.items.find(
        (i) => i.productId.toString() === ret.productId.toString(),
      );
      if (saleItem) {
        saleItem.returnedQuantity += ret.quantity;
      }
    }

    // Recompute status.
    const fullyReturned = sale.items.every(
      (i) => i.returnedQuantity >= i.quantity,
    );
    const anyReturned = sale.items.some((i) => i.returnedQuantity > 0);

    let newStatus: SaleStatus = 'COMPLETED';
    if (fullyReturned) newStatus = 'FULLY_RETURNED';
    else if (anyReturned) newStatus = 'PARTIALLY_RETURNED';

    sale.status = newStatus;
  }

  // ---------- Utility: shape for HTTP ----------

  private toApiShape(doc: {
    _id: Types.ObjectId;
    returnId: string;
    saleId: string;
    saleObjectId: Types.ObjectId;
    items: Array<{
      productId: Types.ObjectId;
      sku: string;
      productName: string;
      quantity: number;
      unitPriceAtSale: number;
      refundAmount: number;
    }>;
    totalRefundAmount: number;
    reason: string;
    returnedAt: Date;
    createdBy: string;
    createdAt?: Date;
  }): SharedSaleReturn {
    return {
      _id: doc._id.toString(),
      returnId: doc.returnId,
      saleId: doc.saleId,
      saleObjectId: doc.saleObjectId.toString(),
      items: doc.items.map((i) => ({
        productId: i.productId.toString(),
        sku: i.sku,
        productName: i.productName,
        quantity: i.quantity,
        unitPriceAtSale: i.unitPriceAtSale,
        refundAmount: i.refundAmount,
      })),
      totalRefundAmount: doc.totalRefundAmount,
      reason: doc.reason,
      returnedAt: doc.returnedAt.toISOString(),
      createdBy: doc.createdBy,
      createdAt: (doc.createdAt ?? doc.returnedAt).toISOString(),
    };
  }
}
