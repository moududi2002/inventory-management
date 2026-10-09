// apps/api/src/dashboard/dashboard.service.ts

// Aggregation-heavy service for the dashboard screen.
// All heavy lifting is done via MongoDB pipelines so payloads stay small
// and the frontend can render instantly.

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Product, ProductDocument } from '../products/product.schema';
import { Sale, SaleDocument } from '../sales/sale.schema';
import {
  StockTransaction,
  StockTransactionDocument,
} from '../stock/stock-transaction.schema';

import type {
  DashboardStats,
  RecentActivityItem,
  LowStockProduct,
  SalesChartPoint,
} from '@inventory/types';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Sale.name)
    private readonly saleModel: Model<SaleDocument>,
    @InjectModel(StockTransaction.name)
    private readonly txnModel: Model<StockTransactionDocument>,
  ) {}

  // ---------- Helpers: date boundaries ----------

  // Start of "today" in local server time.
  private startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // Start of "today + N days ago" (for chart ranges).
  private startOfDaysAgo(days: number): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (days - 1));
    return d;
  }

  // YYYY-MM-DD in local time — used as bucket keys.
  private toDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // ---------- STATS ----------

  async getStats(): Promise<DashboardStats> {
    const today = this.startOfToday();

    // 1) Products aggregate: counts + total quantity + total stock value.
    //    Stock value = sum(currentStock * unitPrice) — uses current selling price.
    const productAgg = await this.productModel
      .aggregate<{
        _id: null;
        totalProducts: number;
        totalStockQuantity: number;
        totalStockValue: number;
        lowStockCount: number;
        outOfStockCount: number;
      }>([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalStockQuantity: { $sum: '$currentStock' },
            totalStockValue: {
              $sum: { $multiply: ['$currentStock', '$unitPrice'] },
            },
            lowStockCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gt: ['$currentStock', 0] },
                      { $lte: ['$currentStock', '$minimumStock'] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            outOfStockCount: {
              $sum: {
                $cond: [{ $lte: ['$currentStock', 0] }, 1, 0],
              },
            },
          },
        },
      ])
      .exec();

    const productStats = productAgg[0] ?? {
      totalProducts: 0,
      totalStockQuantity: 0,
      totalStockValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    };

    // 2) Today's sales aggregate.
    const salesAgg = await this.saleModel
      .aggregate<{
        _id: null;
        todaySales: number;
        todaySoldQuantity: number;
        todayProfit: number;
      }>([
        { $match: { soldAt: { $gte: today } } },
        {
          $unwind: {
            path: '$items',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: null,
            todaySales: { $sum: { $ifNull: ['$items.subtotal', 0] } },
            todaySoldQuantity: { $sum: { $ifNull: ['$items.quantity', 0] } },
            todayProfit: { $sum: { $ifNull: ['$items.profit', 0] } },
          },
        },
      ])
      .exec();

    // Note: salesAgg sums *item.subtotal* (pre-discount). If you want
    // post-discount sales, aggregate Sale-level totals instead — see below.
    // We'll overwrite todaySales with sale-level totalAmount for accuracy:
    const todaySaleTotals = await this.saleModel
      .aggregate<{ _id: null; todaySales: number }>([
        { $match: { soldAt: { $gte: today } } },
        {
          $group: {
            _id: null,
            todaySales: { $sum: '$totalAmount' },
          },
        },
      ])
      .exec();

    const salesStats = {
      todaySales: todaySaleTotals[0]?.todaySales ?? 0,
      todaySoldQuantity: salesAgg[0]?.todaySoldQuantity ?? 0,
      todayProfit: salesAgg[0]?.todayProfit ?? 0,
    };

    return {
      totalProducts: productStats.totalProducts,
      totalStockQuantity: productStats.totalStockQuantity,
      totalStockValue: Math.round(productStats.totalStockValue),
      todaySales: Math.round(salesStats.todaySales),
      todaySoldQuantity: salesStats.todaySoldQuantity,
      todayProfit: Math.round(salesStats.todayProfit),
      lowStockCount: productStats.lowStockCount,
      outOfStockCount: productStats.outOfStockCount,
    };
  }

  // ---------- RECENT ACTIVITY ----------

  async getRecentActivity(limit = 10): Promise<RecentActivityItem[]> {
    const docs = await this.txnModel
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return docs.map((d) => ({
      transactionId: d.transactionId,
      productId: d.productId.toString(),
      sku: d.sku,
      productName: d.productName,
      type: d.type,
      quantity: d.quantity,
      direction: d.direction,
      newStock: d.newStock,
      reason: d.reason,
      createdAt: (d.createdAt as unknown as Date).toISOString(),
    }));
  }

  // ---------- LOW STOCK ----------

  // Returns products where currentStock <= minimumStock (includes out-of-stock).
  // Sorted by "urgency": out-of-stock first, then lowest stock ratio.
  async getLowStock(limit = 10): Promise<LowStockProduct[]> {
    const docs = await this.productModel
      .aggregate<{
        _id: Types.ObjectId;
        sku: string;
        name: string;
        currentStock: number;
        minimumStock: number;
        unit: string;
        imageUrl: string | null;
      }>([
        { $match: { isActive: true } },
        {
          $match: {
            $expr: { $lte: ['$currentStock', '$minimumStock'] },
          },
        },
        {
          $addFields: {
            // Lower = more urgent. Out-of-stock → 0, else currentStock/minimumStock.
            urgency: {
              $cond: [
                { $lte: ['$currentStock', 0] },
                0,
                {
                  $cond: [
                    { $gt: ['$minimumStock', 0] },
                    { $divide: ['$currentStock', '$minimumStock'] },
                    1,
                  ],
                },
              ],
            },
          },
        },
        { $sort: { urgency: 1, currentStock: 1 } },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            sku: 1,
            name: 1,
            currentStock: 1,
            minimumStock: 1,
            unit: 1,
            imageUrl: 1,
          },
        },
      ])
      .exec();

    return docs.map((d) => ({
      _id: d._id.toString(),
      sku: d.sku,
      name: d.name,
      currentStock: d.currentStock,
      minimumStock: d.minimumStock,
      unit: d.unit,
      imageUrl: d.imageUrl ?? null,
      status: d.currentStock <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
    }));
  }

  // ---------- SALES CHART ----------

  // Returns one point per day (local time) for the last `days` days.
  // Missing days are filled with zeros so the chart always has continuous data.
  async getSalesChart(days = 7): Promise<SalesChartPoint[]> {
    const from = this.startOfDaysAgo(days);

    // Aggregate sales per day.
    //   - totalSales = sum of Sale.totalAmount (post-discount)
    //   - totalQuantity = sum of item.quantity
    //   - totalProfit = sum of item.profit
    const rows = await this.saleModel
      .aggregate<{
        _id: string;
        totalSales: number;
        totalQuantity: number;
        totalProfit: number;
      }>([
        { $match: { soldAt: { $gte: from } } },
        {
          $facet: {
            // Sales totals: one row per sale → sum totalAmount
            saleTotals: [
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      date: '$soldAt',
                      // Use server-local time; Mongo uses UTC by default.
                      // For consistency we treat soldAt as-is (server local).
                    },
                  },
                  totalSales: { $sum: '$totalAmount' },
                },
              },
            ],
            // Item totals: unwind → sum quantity + profit
            itemTotals: [
              { $unwind: '$items' },
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      date: '$soldAt',
                    },
                  },
                  totalQuantity: { $sum: '$items.quantity' },
                  totalProfit: { $sum: '$items.profit' },
                },
              },
            ],
          },
        },
      ])
      .exec();

    const saleTotals = rows[0]?.saleTotals ?? [];
    const itemTotals = rows[0]?.itemTotals ?? [];

    const byDate = new Map<
      string,
      { totalSales: number; totalQuantity: number; totalProfit: number }
    >();

    for (const r of saleTotals) {
      byDate.set(r._id, {
        totalSales: r.totalSales,
        totalQuantity: 0,
        totalProfit: 0,
      });
    }
    for (const r of itemTotals) {
      const existing = byDate.get(r._id) ?? {
        totalSales: 0,
        totalQuantity: 0,
        totalProfit: 0,
      };
      existing.totalQuantity = r.totalQuantity;
      existing.totalProfit = r.totalProfit;
      byDate.set(r._id, existing);
    }

    // Fill continuous days.
    const points: SalesChartPoint[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      const key = this.toDateKey(d);
      const val = byDate.get(key) ?? {
        totalSales: 0,
        totalQuantity: 0,
        totalProfit: 0,
      };
      points.push({
        date: key,
        totalSales: Math.round(val.totalSales),
        totalQuantity: val.totalQuantity,
        totalProfit: Math.round(val.totalProfit),
      });
    }

    return points;
  }
}
