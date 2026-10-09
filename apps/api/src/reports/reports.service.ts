// apps/api/src/reports/reports.service.ts

// All report queries in one place. Every report:
//   - takes a date range (from/to)
//   - returns a { summary, rows, range } shaped response (except a few flat ones)
//   - uses MongoDB aggregation pipelines
//
// CSV export is generic: pass rows + columns → get CSV string.

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Product, ProductDocument } from '../products/product.schema';
import { Sale, SaleDocument } from '../sales/sale.schema';
import { SaleReturn, SaleReturnDocument } from '../sales/sale-return.schema';
import {
  StockTransaction,
  StockTransactionDocument,
} from '../stock/stock-transaction.schema';
import { Category, CategoryDocument } from '../categories/category.schema';

import { resolveDateRange } from './dto';
import type {
  ReportQueryInput,
  StockMovementQueryInput,
} from './dto';

import type {
  SalesReportResponse,
  ProfitReportResponse,
  StockMovementReportResponse,
  LowStockReportRow,
  TopSellingRow,
  DeadStockRow,
  CategoryStockRow,
  DailySummaryRow,
} from '@inventory/types';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Sale.name)
    private readonly saleModel: Model<SaleDocument>,
    @InjectModel(SaleReturn.name)
    private readonly returnModel: Model<SaleReturnDocument>,
    @InjectModel(StockTransaction.name)
    private readonly txnModel: Model<StockTransactionDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  // =================================================================
  // 1) SALES REPORT
  // =================================================================

  async getSalesReport(input: ReportQueryInput): Promise<SalesReportResponse> {
    const { from, to } = resolveDateRange(input);
    const groupBy = input.groupBy ?? 'day';
    const dateFormat = this.dateFormatFor(groupBy);

    // Sales totals per bucket (from sales collection)
    const salesBuckets = await this.saleModel
      .aggregate<{
        _id: string;
        saleCount: number;
        totalAmount: number;
      }>([
        { $match: { soldAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: {
              $dateToString: { format: dateFormat, date: '$soldAt' },
            },
            saleCount: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
          },
        },
      ])
      .exec();

    // Item totals per bucket (quantity + profit from items)
    const itemBuckets = await this.saleModel
      .aggregate<{
        _id: string;
        totalQuantity: number;
        totalProfit: number;
      }>([
        { $match: { soldAt: { $gte: from, $lte: to } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: {
              $dateToString: { format: dateFormat, date: '$soldAt' },
            },
            totalQuantity: { $sum: '$items.quantity' },
            totalProfit: { $sum: '$items.profit' },
          },
        },
      ])
      .exec();

    // Refunds per bucket
    const refundBuckets = await this.returnModel
      .aggregate<{ _id: string; totalRefunds: number }>([
        { $match: { returnedAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: {
              $dateToString: { format: dateFormat, date: '$returnedAt' },
            },
            totalRefunds: { $sum: '$totalRefundAmount' },
          },
        },
      ])
      .exec();

    // Merge
    const map = new Map<
      string,
      {
        date: string;
        saleCount: number;
        totalQuantity: number;
        totalAmount: number;
        totalProfit: number;
        totalRefunds: number;
      }
    >();

    for (const b of salesBuckets) {
      map.set(b._id, {
        date: b._id,
        saleCount: b.saleCount,
        totalQuantity: 0,
        totalAmount: b.totalAmount,
        totalProfit: 0,
        totalRefunds: 0,
      });
    }
    for (const b of itemBuckets) {
      const existing = map.get(b._id) ?? {
        date: b._id,
        saleCount: 0,
        totalQuantity: 0,
        totalAmount: 0,
        totalProfit: 0,
        totalRefunds: 0,
      };
      existing.totalQuantity = b.totalQuantity;
      existing.totalProfit = b.totalProfit;
      map.set(b._id, existing);
    }
    for (const b of refundBuckets) {
      const existing = map.get(b._id) ?? {
        date: b._id,
        saleCount: 0,
        totalQuantity: 0,
        totalAmount: 0,
        totalProfit: 0,
        totalRefunds: 0,
      };
      existing.totalRefunds = b.totalRefunds;
      map.set(b._id, existing);
    }

    const rows = Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => ({
        date: r.date,
        saleCount: r.saleCount,
        totalQuantity: r.totalQuantity,
        totalAmount: Math.round(r.totalAmount),
        totalProfit: Math.round(r.totalProfit),
      }));

    const summary = rows.reduce(
      (acc, r) => ({
        totalSales: acc.totalSales + r.saleCount,
        totalQuantity: acc.totalQuantity + r.totalQuantity,
        totalAmount: acc.totalAmount + r.totalAmount,
        totalProfit: acc.totalProfit + r.totalProfit,
        totalRefunds: acc.totalRefunds,
      }),
      {
        totalSales: 0,
        totalQuantity: 0,
        totalAmount: 0,
        totalProfit: 0,
        totalRefunds: Array.from(map.values()).reduce(
          (s, r) => s + r.totalRefunds,
          0,
        ),
      },
    );

    return {
      summary: {
        totalSales: summary.totalSales,
        totalQuantity: summary.totalQuantity,
        totalAmount: Math.round(summary.totalAmount),
        totalProfit: Math.round(summary.totalProfit),
        totalRefunds: Math.round(summary.totalRefunds),
      },
      rows,
      range: { from: from.toISOString(), to: to.toISOString() },
    };
  }

  // =================================================================
  // 2) PROFIT REPORT (product-wise)
  // =================================================================

  async getProfitReport(input: ReportQueryInput): Promise<ProfitReportResponse> {
    const { from, to } = resolveDateRange(input);

    const rows = await this.saleModel
      .aggregate<{
        productId: Types.ObjectId;
        sku: string;
        productName: string;
        quantitySold: number;
        revenue: number;
        cost: number;
        profit: number;
      }>([
        { $match: { soldAt: { $gte: from, $lte: to } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            sku: { $first: '$items.sku' },
            productName: { $first: '$items.productName' },
            quantitySold: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.subtotal' },
            cost: {
              $sum: {
                $multiply: ['$items.costPriceAtSale', '$items.quantity'],
              },
            },
            profit: { $sum: '$items.profit' },
          },
        },
        { $sort: { profit: -1 } },
      ])
      .exec();

    const mapped = rows.map((r) => {
      const marginPercent =
        r.revenue > 0 ? Number(((r.profit / r.revenue) * 100).toFixed(2)) : 0;
      return {
        productId: r._id.toString(),
        sku: r.sku,
        productName: r.productName,
        quantitySold: r.quantitySold,
        revenue: Math.round(r.revenue),
        cost: Math.round(r.cost),
        profit: Math.round(r.profit),
        marginPercent,
      };
    });

    const totals = mapped.reduce(
      (acc, r) => ({
        totalRevenue: acc.totalRevenue + r.revenue,
        totalCost: acc.totalCost + r.cost,
        totalProfit: acc.totalProfit + r.profit,
      }),
      { totalRevenue: 0, totalCost: 0, totalProfit: 0 },
    );

    const marginPercent =
      totals.totalRevenue > 0
        ? Number(((totals.totalProfit / totals.totalRevenue) * 100).toFixed(2))
        : 0;

    return {
      summary: { ...totals, marginPercent },
      rows: mapped,
      range: { from: from.toISOString(), to: to.toISOString() },
    };
  }

  // =================================================================
  // 3) STOCK MOVEMENT (per product)
  // =================================================================

  async getStockMovement(
    input: StockMovementQueryInput,
  ): Promise<StockMovementReportResponse> {
    const { from, to } = resolveDateRange(input);

    // Validate product exists.
    const product = await this.productModel
      .findById(input.productId)
      .lean()
      .exec();
    if (!product) throw new NotFoundException('Product not found');

    const productId = new Types.ObjectId(input.productId);

    // 1) Find opening stock: last newStock BEFORE `from`.
    const openingTxn = await this.txnModel
      .findOne({ productId, createdAt: { $lt: from } })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    const opening = openingTxn?.newStock ?? 0;

    // 2) All transactions in range, grouped by day.
    const txnBuckets = await this.txnModel
      .aggregate<{
        _id: string;
        stockIn: number;
        stockOut: number;
        adjustmentIn: number;
        adjustmentOut: number;
        returnIn: number;
      }>([
        {
          $match: {
            productId,
            createdAt: { $gte: from, $lte: to },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            // STOCK_IN quantity
            stockIn: {
              $sum: {
                $cond: [{ $eq: ['$type', 'STOCK_IN'] }, '$quantity', 0],
              },
            },
            // SALE quantity (out)
            stockOut: {
              $sum: {
                $cond: [{ $eq: ['$type', 'SALE'] }, '$quantity', 0],
              },
            },
            // ADJUSTMENT split by direction
            adjustmentIn: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$type', 'ADJUSTMENT'] },
                      { $eq: ['$direction', 'IN'] },
                    ],
                  },
                  '$quantity',
                  0,
                ],
              },
            },
            adjustmentOut: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$type', 'ADJUSTMENT'] },
                      { $eq: ['$direction', 'OUT'] },
                    ],
                  },
                  '$quantity',
                  0,
                ],
              },
            },
            // RETURN (in)
            returnIn: {
              $sum: {
                $cond: [{ $eq: ['$type', 'RETURN'] }, '$quantity', 0],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec();

    // 3) Build continuous daily rows with running balance.
    const rows: StockMovementReportResponse['rows'] = [];
    let balance = opening;

    const dayMap = new Map<
      string,
      {
        stockIn: number;
        stockOut: number;
        adjustmentIn: number;
        adjustmentOut: number;
        returnIn: number;
      }
    >();
    for (const b of txnBuckets) {
      dayMap.set(b._id, {
        stockIn: b.stockIn,
        stockOut: b.stockOut,
        adjustmentIn: b.adjustmentIn,
        adjustmentOut: b.adjustmentOut,
        returnIn: b.returnIn,
      });
    }

    const cursor = new Date(from);
    const end = new Date(to);
    while (cursor <= end) {
      const key = this.toDateKey(cursor);
      const day = dayMap.get(key) ?? {
        stockIn: 0,
        stockOut: 0,
        adjustmentIn: 0,
        adjustmentOut: 0,
        returnIn: 0,
      };

      // Net adjustment = +in - out
      const netAdjustment = day.adjustmentIn - day.adjustmentOut;

      const closing =
        balance + day.stockIn - day.stockOut + netAdjustment + day.returnIn;

      rows.push({
        date: key,
        opening: balance,
        stockIn: day.stockIn,
        stockOut: day.stockOut,
        adjustment: netAdjustment,
        returnIn: day.returnIn,
        closing,
      });

      balance = closing;
      cursor.setDate(cursor.getDate() + 1);
    }

    return {
      productId: productId.toString(),
      sku: product.sku,
      productName: product.name,
      rows,
      range: { from: from.toISOString(), to: to.toISOString() },
    };
  }

  // =================================================================
  // 4) LOW STOCK REPORT
  // =================================================================

  async getLowStockReport(): Promise<LowStockReportRow[]> {
    const docs = await this.productModel
      .aggregate<{
        _id: Types.ObjectId;
        sku: string;
        name: string;
        currentStock: number;
        minimumStock: number;
        unit: string;
        categoryId: Types.ObjectId;
      }>([
        { $match: { isActive: true } },
        {
          $match: {
            $expr: {
              $and: [
                { $gt: ['$currentStock', 0] },
                { $lte: ['$currentStock', '$minimumStock'] },
              ],
            },
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category',
          },
        },
        {
          $addFields: {
            categoryName: {
              $ifNull: [{ $arrayElemAt: ['$category.name', 0] }, ''],
            },
          },
        },
        { $sort: { currentStock: 1 } },
        {
          $project: {
            sku: 1,
            name: 1,
            currentStock: 1,
            minimumStock: 1,
            unit: 1,
            categoryName: 1,
          },
        },
      ])
      .exec();

    return docs.map((d) => ({
      productId: d._id.toString(),
      sku: d.sku,
      name: d.name,
      categoryName: d.categoryName,
      currentStock: d.currentStock,
      minimumStock: d.minimumStock,
      unit: d.unit,
      status: 'LOW_STOCK',
    }));
  }

  // =================================================================
  // 5) OUT OF STOCK REPORT
  // =================================================================

  async getOutOfStockReport(): Promise<LowStockReportRow[]> {
    const docs = await this.productModel
      .aggregate<{
        _id: Types.ObjectId;
        sku: string;
        name: string;
        currentStock: number;
        minimumStock: number;
        unit: string;
        categoryName: string;
      }>([
        { $match: { isActive: true, currentStock: { $lte: 0 } } },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category',
          },
        },
        {
          $addFields: {
            categoryName: {
              $ifNull: [{ $arrayElemAt: ['$category.name', 0] }, ''],
            },
          },
        },
        { $sort: { name: 1 } },
        {
          $project: {
            sku: 1,
            name: 1,
            currentStock: 1,
            minimumStock: 1,
            unit: 1,
            categoryName: 1,
          },
        },
      ])
      .exec();

    return docs.map((d) => ({
      productId: d._id.toString(),
      sku: d.sku,
      name: d.name,
      categoryName: d.categoryName,
      currentStock: d.currentStock,
      minimumStock: d.minimumStock,
      unit: d.unit,
      status: 'OUT_OF_STOCK',
    }));
  }

  // =================================================================
  // 6) TOP SELLING PRODUCTS
  // =================================================================

  async getTopSelling(input: ReportQueryInput): Promise<TopSellingRow[]> {
    const { from, to } = resolveDateRange(input);
    const limit = input.limit ?? 10;

    const rows = await this.saleModel
      .aggregate<{
        _id: Types.ObjectId;
        sku: string;
        productName: string;
        quantitySold: number;
        revenue: number;
        profit: number;
      }>([
        { $match: { soldAt: { $gte: from, $lte: to } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            sku: { $first: '$items.sku' },
            productName: { $first: '$items.productName' },
            quantitySold: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.subtotal' },
            profit: { $sum: '$items.profit' },
          },
        },
        { $sort: { quantitySold: -1 } },
        { $limit: limit },
      ])
      .exec();

    return rows.map((r) => ({
      productId: r._id.toString(),
      sku: r.sku,
      productName: r.productName,
      quantitySold: r.quantitySold,
      revenue: Math.round(r.revenue),
      profit: Math.round(r.profit),
    }));
  }

  // =================================================================
  // 7) DEAD STOCK
  // =================================================================

  async getDeadStock(input: ReportQueryInput): Promise<DeadStockRow[]> {
    const days = input.days ?? 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    // Find last sale date for every product (only completed sales)
    const lastSales = await this.saleModel
      .aggregate<{ _id: Types.ObjectId; lastSoldAt: Date }>([
        { $match: { status: { $in: ['COMPLETED', 'PARTIALLY_RETURNED'] } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            lastSoldAt: { $max: '$soldAt' },
          },
        },
      ])
      .exec();

    const lastSaleMap = new Map<string, Date>();
    for (const row of lastSales) {
      lastSaleMap.set(row._id.toString(), row.lastSoldAt);
    }

    // Products with currentStock > 0 that haven't sold in `days`
    const products = await this.productModel
      .find({ isActive: true, currentStock: { $gt: 0 } })
      .lean()
      .exec();

    const now = new Date();
    const rows: DeadStockRow[] = [];

    for (const p of products) {
      const lastSoldAt = lastSaleMap.get(p._id.toString()) ?? null;
      if (lastSoldAt && lastSoldAt >= cutoff) continue; // sold recently

      const daysSinceLastSale = lastSoldAt
        ? Math.floor((now.getTime() - lastSoldAt.getTime()) / 86400000)
        : null;

      rows.push({
        productId: p._id.toString(),
        sku: p.sku,
        productName: p.name,
        currentStock: p.currentStock,
        stockValue: Math.round(p.currentStock * p.unitPrice),
        lastSoldAt: lastSoldAt ? lastSoldAt.toISOString() : null,
        daysSinceLastSale,
      });
    }

    // Sort: never-sold first (null), then largest stale period, then largest value
    rows.sort((a, b) => {
      if (a.daysSinceLastSale === null && b.daysSinceLastSale !== null) return -1;
      if (b.daysSinceLastSale === null && a.daysSinceLastSale !== null) return 1;
      const ds = (b.daysSinceLastSale ?? 0) - (a.daysSinceLastSale ?? 0);
      if (ds !== 0) return ds;
      return b.stockValue - a.stockValue;
    });

    return rows;
  }

  // =================================================================
  // 8) CATEGORY-WISE STOCK
  // =================================================================

  async getCategoryStock(): Promise<CategoryStockRow[]> {
    const rows = await this.productModel
      .aggregate<{
        _id: Types.ObjectId;
        categoryName: string;
        productCount: number;
        totalQuantity: number;
        totalStockValue: number;
      }>([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$categoryId',
            productCount: { $sum: 1 },
            totalQuantity: { $sum: '$currentStock' },
            totalStockValue: {
              $sum: { $multiply: ['$currentStock', '$unitPrice'] },
            },
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category',
          },
        },
        {
          $addFields: {
            categoryName: {
              $ifNull: [{ $arrayElemAt: ['$category.name', 0] }, 'Uncategorized'],
            },
          },
        },
        { $sort: { totalStockValue: -1 } },
      ])
      .exec();

    return rows.map((r) => ({
      categoryId: r._id.toString(),
      categoryName: r.categoryName,
      productCount: r.productCount,
      totalQuantity: r.totalQuantity,
      totalStockValue: Math.round(r.totalStockValue),
    }));
  }

  // =================================================================
  // 9) DAILY SUMMARY
  // =================================================================

  async getDailySummary(input: ReportQueryInput): Promise<DailySummaryRow[]> {
    const { from, to } = resolveDateRange(input);

    // Sales per day
    const saleBuckets = await this.saleModel
      .aggregate<{
        _id: string;
        saleCount: number;
        totalSales: number;
      }>([
        { $match: { soldAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$soldAt' } },
            saleCount: { $sum: 1 },
            totalSales: { $sum: '$totalAmount' },
          },
        },
      ])
      .exec();

    // Profit per day
    const profitBuckets = await this.saleModel
      .aggregate<{ _id: string; totalProfit: number }>([
        { $match: { soldAt: { $gte: from, $lte: to } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$soldAt' } },
            totalProfit: { $sum: '$items.profit' },
          },
        },
      ])
      .exec();

    // Returns per day
    const returnBuckets = await this.returnModel
      .aggregate<{ _id: string; totalReturns: number }>([
        { $match: { returnedAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$returnedAt' } },
            totalReturns: { $sum: '$totalRefundAmount' },
          },
        },
      ])
      .exec();

    const map = new Map<string, DailySummaryRow>();

    for (const b of saleBuckets) {
      map.set(b._id, {
        date: b._id,
        saleCount: b.saleCount,
        totalSales: Math.round(b.totalSales),
        totalProfit: 0,
        totalReturns: 0,
      });
    }
    for (const b of profitBuckets) {
      const existing = map.get(b._id) ?? {
        date: b._id,
        saleCount: 0,
        totalSales: 0,
        totalProfit: 0,
        totalReturns: 0,
      };
      existing.totalProfit = Math.round(b.totalProfit);
      map.set(b._id, existing);
    }
    for (const b of returnBuckets) {
      const existing = map.get(b._id) ?? {
        date: b._id,
        saleCount: 0,
        totalSales: 0,
        totalProfit: 0,
        totalReturns: 0,
      };
      existing.totalReturns = Math.round(b.totalReturns);
      map.set(b._id, existing);
    }

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  // =================================================================
  // CSV EXPORT
  // =================================================================

  // Generic CSV builder. Pass rows (already shaped) + column definitions.
  buildCsv<T extends Record<string, unknown>>(
    rows: T[],
    columns: Array<{ key: keyof T; label: string }>,
  ): string {
    const escape = (val: unknown): string => {
      if (val === null || val === undefined) return '';
      const s = String(val);
      if (/[",\n\r]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const header = columns.map((c) => escape(c.label)).join(',');
    const body = rows
      .map((row) => columns.map((c) => escape(row[c.key])).join(','))
      .join('\n');

    return `${header}\n${body}`;
  }

  // =================================================================
  // HELPERS
  // =================================================================

  private dateFormatFor(groupBy: 'day' | 'week' | 'month'): string {
    if (groupBy === 'month') return '%Y-%m';
    if (groupBy === 'week') return '%G-W%V'; // ISO week
    return '%Y-%m-%d';
  }

  private toDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
