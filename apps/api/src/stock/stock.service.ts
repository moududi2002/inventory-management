// apps/api/src/stock/stock.service.ts

// Stock operations:
//   - addStock        → STOCK_IN
//   - adjustStock     → ADJUSTMENT (set absolute quantity)
//   - recordSale      → SALE     (called by SalesService in Step 8)
//   - recordReturn    → RETURN   (called by SalesService in Step 9)
//   - listTransactions (with filters + pagination)
//   - getProductHistory
//
// Each mutation:
//   1) atomically changes product.currentStock
//   2) writes an immutable StockTransaction log
//   3) (in Step 15) emits a socket event
//
// All stock writes go through here — no other module touches currentStock.

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import {
  StockTransaction,
  StockTransactionDocument,
  type AdjustmentReason,
  type TransactionDirection,
  type TransactionType,
} from './stock-transaction.schema';
import { ProductsService } from '../products/products.service';
import { IdGenerator } from '../common/utils/id-generator';
import {
  buildPaginatedResponse,
  getPaginationParams,
  getSkip,
} from '../common/utils/pagination';
import type { AddStockInput, AdjustStockInput, StockQueryInput } from './dto';
import type {
  PaginatedResponse,
  StockTransaction as SharedStockTransaction,
} from '@inventory/types';
import { ADJUSTMENT_REASON_LABELS } from '@inventory/types';

import { EventsGateway } from '../websocket/events.gateway';


@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(
    @InjectModel(StockTransaction.name)
    private readonly txnModel: Model<StockTransactionDocument>,
    private readonly productsService: ProductsService,
    private readonly idGenerator: IdGenerator,
     private readonly events: EventsGateway,
  ) {}

  // ---------- STOCK IN (manual purchase / add) ----------

  async addStock(
    input: AddStockInput,
    userId: string,
  ): Promise<{
    productId: string;
    sku: string;
    previousStock: number;
    newStock: number;
    transactionId: string;
  }> {
    // 1) Ensure product exists + is active.
    const before = await this.productsService.getOrThrow(input.productId);
    const previousStock = before.currentStock;

    // 2) Atomic increment.
    const updated = await this.productsService.incrementStockOrThrow(
      input.productId,
      input.quantity,
    );
    const newStock = updated.currentStock;

    // 3) Write immutable log.
    const txn = await this.writeTransaction({
      productId: updated._id.toString(),
      sku: updated.sku,
      productName: updated.name,
      type: 'STOCK_IN',
      direction: 'IN',
      quantity: input.quantity,
      previousStock,
      newStock,
      reason: input.reason,
      adjustmentReason: null,
      refId: null,
      createdBy: userId,
    });

    // 4) TODO (Step 15): emit 'stock:updated' socket event.
    this.events.emitStockUpdated({
      productId: updated._id.toString(),
      sku: updated.sku,
      newStock,
      type: 'STOCK_IN',
    });
    this.events.emitDashboardRefresh({ reason: 'stock-in' });

    return {
      productId: updated._id.toString(),
      sku: updated.sku,
      previousStock,
      newStock,
      transactionId: txn.transactionId,
    };
  }

  // ---------- ADJUSTMENT (set absolute) ----------

  async adjustStock(
    input: AdjustStockInput,
    userId: string,
  ): Promise<{
    productId: string;
    sku: string;
    previousStock: number;
    newStock: number;
    transactionId: string;
  }> {
    const before = await this.productsService.getOrThrow(input.productId);
    const previousStock = before.currentStock;

    if (previousStock === input.newQuantity) {
      throw new BadRequestException(
        `Stock is already ${input.newQuantity} ${before.unit}. No adjustment needed.`,
      );
    }

    const updated = await this.productsService.setStockOrThrow(
      input.productId,
      input.newQuantity,
    );
    const newStock = updated.currentStock;

    // Determine direction and quantity of the change.
    const diff = newStock - previousStock;
    const direction: TransactionDirection = diff > 0 ? 'IN' : 'OUT';
    const quantity = Math.abs(diff);

    // Build a human-readable reason: "Damaged — note"
    const reasonLabel = ADJUSTMENT_REASON_LABELS[input.adjustmentReason];
    const reason = input.note?.trim()
      ? `${reasonLabel} — ${input.note.trim()}`
      : reasonLabel;

    const txn = await this.writeTransaction({
      productId: updated._id.toString(),
      sku: updated.sku,
      productName: updated.name,
      type: 'ADJUSTMENT',
      direction,
      quantity,
      previousStock,
      newStock,
      reason,
      adjustmentReason: input.adjustmentReason as AdjustmentReason,
      refId: null,
      createdBy: userId,
    });

    this.events.emitStockUpdated({
      productId: updated._id.toString(),
      sku: updated.sku,
      newStock,
      type: 'ADJUSTMENT',
    });
    this.events.emitDashboardRefresh({ reason: 'stock-adjust' });

    return {
      productId: updated._id.toString(),
      sku: updated.sku,
      previousStock,
      newStock,
      transactionId: txn.transactionId,
    };
  }

  // ---------- SALE (called by SalesService in Step 8) ----------

  // Decrement stock atomically and write a SALE log.
  // Throws if insufficient stock.
  async recordSale(params: {
    productId: string;
    quantity: number;
    saleId: string;
    userId: string;
  }): Promise<{
    productId: string;
    sku: string;
    previousStock: number;
    newStock: number;
    transactionId: string;
  }> {
    const before = await this.productsService.getOrThrow(params.productId);
    const previousStock = before.currentStock;

    const updated = await this.productsService.decrementStockOrThrow(
      params.productId,
      params.quantity,
    );
    const newStock = updated.currentStock;

    const txn = await this.writeTransaction({
      productId: updated._id.toString(),
      sku: updated.sku,
      productName: updated.name,
      type: 'SALE',
      direction: 'OUT',
      quantity: params.quantity,
      previousStock,
      newStock,
      reason: `Sale #${params.saleId}`,
      adjustmentReason: null,
      refId: params.saleId,
      createdBy: params.userId,
    });

    this.events.emitStockUpdated({
      productId: updated._id.toString(),
      sku: updated.sku,
      newStock,
      type: 'SALE',
    });

    return {
      productId: updated._id.toString(),
      sku: updated.sku,
      previousStock,
      newStock,
      transactionId: txn.transactionId,
    };
  }

  // ---------- RETURN (called by SalesService in Step 9) ----------

  // Increment stock and write a RETURN log.
  async recordReturn(params: {
    productId: string;
    quantity: number;
    returnId: string;
    userId: string;
  }): Promise<{
    productId: string;
    sku: string;
    previousStock: number;
    newStock: number;
    transactionId: string;
  }> {
    const before = await this.productsService.getOrThrow(params.productId);
    const previousStock = before.currentStock;

    const updated = await this.productsService.incrementStockOrThrow(
      params.productId,
      params.quantity,
    );
    const newStock = updated.currentStock;

    const txn = await this.writeTransaction({
      productId: updated._id.toString(),
      sku: updated.sku,
      productName: updated.name,
      type: 'RETURN',
      direction: 'IN',
      quantity: params.quantity,
      previousStock,
      newStock,
      reason: `Return #${params.returnId}`,
      adjustmentReason: null,
      refId: params.returnId,
      createdBy: params.userId,
    });

    this.events.emitStockUpdated({
      productId: updated._id.toString(),
      sku: updated.sku,
      newStock,
      type: 'RETURN',
    });

    return {
      productId: updated._id.toString(),
      sku: updated.sku,
      previousStock,
      newStock,
      transactionId: txn.transactionId,
    };
  }

  // ---------- READ: list transactions (with filters) ----------

  async listTransactions(
    query: StockQueryInput,
  ): Promise<PaginatedResponse<SharedStockTransaction>> {
    const params = getPaginationParams(query);
    const filter: FilterQuery<StockTransactionDocument> = {};

    if (query.productId) {
      filter.productId = new Types.ObjectId(query.productId);
    }
    if (query.type) {
      filter.type = query.type;
    }
    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) {
        (filter.createdAt as Record<string, Date>).$gte = new Date(query.from);
      }
      if (query.to) {
        (filter.createdAt as Record<string, Date>).$lte = new Date(query.to);
      }
    }

    const allowedSort = new Set(['createdAt', 'quantity', 'newStock']);
    const sortBy = allowedSort.has(params.sortBy) ? params.sortBy : 'createdAt';
    const sortDir = params.sortOrder === 'asc' ? 1 : -1;

    const [docs, total] = await Promise.all([
      this.txnModel
        .find(filter)
        .sort({ [sortBy]: sortDir })
        .skip(getSkip(params))
        .limit(params.limit)
        .lean()
        .exec(),
      this.txnModel.countDocuments(filter).exec(),
    ]);

    const items: SharedStockTransaction[] = docs.map((d) =>
      this.toApiShape(d),
    );
    return buildPaginatedResponse(items, total, params);
  }

  // ---------- READ: history for a single product ----------

  async getProductHistory(
    productId: string,
    query: StockQueryInput,
  ): Promise<PaginatedResponse<SharedStockTransaction>> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new NotFoundException('Invalid product id');
    }

    // Validate product exists (so we return 404 not empty list).
    await this.productsService.getOrThrow(productId);

    return this.listTransactions({ ...query, productId });
  }

  // ---------- INTERNAL: write one transaction row ----------

  private async writeTransaction(input: {
    productId: string;
    sku: string;
    productName: string;
    type: TransactionType;
    direction: TransactionDirection;
    quantity: number;
    previousStock: number;
    newStock: number;
    reason: string;
    adjustmentReason: AdjustmentReason | null;
    refId: string | null;
    createdBy: string;
  }): Promise<StockTransactionDocument> {
    const transactionId = this.idGenerator.nextTransactionId();

    const doc = new this.txnModel({
      transactionId,
      productId: new Types.ObjectId(input.productId),
      sku: input.sku,
      productName: input.productName,
      type: input.type,
      direction: input.direction,
      quantity: input.quantity,
      previousStock: input.previousStock,
      newStock: input.newStock,
      reason: input.reason,
      adjustmentReason: input.adjustmentReason,
      refId: input.refId,
      createdBy: input.createdBy,
    });

    return doc.save();
  }

  // ---------- Utility: shape for HTTP ----------

  private toApiShape(doc: {
    _id: Types.ObjectId;
    transactionId: string;
    productId: Types.ObjectId;
    sku: string;
    productName: string;
    type: TransactionType;
    direction: TransactionDirection;
    quantity: number;
    previousStock: number;
    newStock: number;
    reason: string;
    adjustmentReason?: AdjustmentReason | null;
    refId?: string | null;
    createdBy: string;
    createdAt: Date;
  }): SharedStockTransaction {
    return {
      _id: doc._id.toString(),
      transactionId: doc.transactionId,
      productId: doc.productId.toString(),
      sku: doc.sku,
      productName: doc.productName,
      type: doc.type,
      direction: doc.direction,
      quantity: doc.quantity,
      previousStock: doc.previousStock,
      newStock: doc.newStock,
      reason: doc.reason,
      adjustmentReason: doc.adjustmentReason ?? undefined,
      refId: doc.refId ?? null,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt.toISOString(),
    };
  }
}
