// apps/api/src/reports/reports.controller.ts

// All report endpoints.
// Every GET returns a report; the /export endpoints return CSV
// (download) for the same underlying data.

import {
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

import { ReportsService } from './reports.service';
import {
  reportQuerySchema,
  stockMovementQuerySchema,
  exportQuerySchema,
  type ReportQueryInput,
  type StockMovementQueryInput,
  type ExportQueryInput,
} from './dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // ---------------- 1. SALES ----------------
  @Get('sales')
  async sales(
    @Query(new ZodValidationPipe(reportQuerySchema)) query: ReportQueryInput,
  ) {
    return this.reportsService.getSalesReport(query);
  }

  // ---------------- 2. PROFIT ----------------
  @Get('profit')
  async profit(
    @Query(new ZodValidationPipe(reportQuerySchema)) query: ReportQueryInput,
  ) {
    return this.reportsService.getProfitReport(query);
  }

  // ---------------- 3. STOCK MOVEMENT ----------------
  @Get('stock-movement')
  async stockMovement(
    @Query(new ZodValidationPipe(stockMovementQuerySchema))
    query: StockMovementQueryInput,
  ) {
    return this.reportsService.getStockMovement(query);
  }

  // ---------------- 4. LOW STOCK ----------------
  @Get('low-stock')
  async lowStock() {
    const rows = await this.reportsService.getLowStockReport();
    return { rows };
  }

  // ---------------- 5. OUT OF STOCK ----------------
  @Get('out-of-stock')
  async outOfStock() {
    const rows = await this.reportsService.getOutOfStockReport();
    return { rows };
  }

  // ---------------- 6. TOP SELLING ----------------
  @Get('top-selling')
  async topSelling(
    @Query(new ZodValidationPipe(reportQuerySchema)) query: ReportQueryInput,
  ) {
    const rows = await this.reportsService.getTopSelling(query);
    return { rows };
  }

  // ---------------- 7. DEAD STOCK ----------------
  @Get('dead-stock')
  async deadStock(
    @Query(new ZodValidationPipe(reportQuerySchema)) query: ReportQueryInput,
  ) {
    const rows = await this.reportsService.getDeadStock(query);
    return { rows };
  }

  // ---------------- 8. CATEGORY STOCK ----------------
  @Get('category-stock')
  async categoryStock() {
    const rows = await this.reportsService.getCategoryStock();
    return { rows };
  }

  // ---------------- 9. DAILY SUMMARY ----------------
  @Get('daily-summary')
  async dailySummary(
    @Query(new ZodValidationPipe(reportQuerySchema)) query: ReportQueryInput,
  ) {
    const rows = await this.reportsService.getDailySummary(query);
    return { rows };
  }

  // ---------------- CSV EXPORT ----------------
  // GET /api/reports/export?type=sales&from=&to=
  // Returns CSV with Content-Disposition so browser downloads it.
  @Get('export')
  async export(
    @Query(new ZodValidationPipe(exportQuerySchema)) query: ExportQueryInput,
    @Res() res: Response,
  ) {
    const { filename, csv } = await this.buildExport(query);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.send(csv);
  }

  // ---------------- INTERNAL ----------------

  private async buildExport(
    query: ExportQueryInput,
  ): Promise<{ filename: string; csv: string }> {
    const stamp = new Date().toISOString().slice(0, 10);

    switch (query.type) {
      case 'sales': {
        const report = await this.reportsService.getSalesReport(query);
        const csv = this.reportsService.buildCsv(report.rows, [
          { key: 'date', label: 'Date' },
          { key: 'saleCount', label: 'Sales Count' },
          { key: 'totalQuantity', label: 'Qty Sold' },
          { key: 'totalAmount', label: 'Total Amount' },
          { key: 'totalProfit', label: 'Total Profit' },
        ]);
        return { filename: `sales-report-${stamp}.csv`, csv };
      }

      case 'profit': {
        const report = await this.reportsService.getProfitReport(query);
        const csv = this.reportsService.buildCsv(report.rows, [
          { key: 'sku', label: 'SKU' },
          { key: 'productName', label: 'Product' },
          { key: 'quantitySold', label: 'Qty Sold' },
          { key: 'revenue', label: 'Revenue' },
          { key: 'cost', label: 'Cost' },
          { key: 'profit', label: 'Profit' },
          { key: 'marginPercent', label: 'Margin %' },
        ]);
        return { filename: `profit-report-${stamp}.csv`, csv };
      }

      case 'stock-movement': {
        if (!query.productId) {
          throw new Error('productId is required for stock-movement export');
        }
        const report = await this.reportsService.getStockMovement({
          ...query,
          productId: query.productId,
        });
        const csv = this.reportsService.buildCsv(report.rows, [
          { key: 'date', label: 'Date' },
          { key: 'opening', label: 'Opening' },
          { key: 'stockIn', label: 'Stock In' },
          { key: 'stockOut', label: 'Stock Out' },
          { key: 'adjustment', label: 'Adjustment' },
          { key: 'returnIn', label: 'Returns In' },
          { key: 'closing', label: 'Closing' },
        ]);
        return {
          filename: `stock-movement-${report.sku}-${stamp}.csv`,
          csv,
        };
      }

      case 'low-stock': {
        const rows = await this.reportsService.getLowStockReport();
        const csv = this.reportsService.buildCsv(rows, [
          { key: 'sku', label: 'SKU' },
          { key: 'name', label: 'Product' },
          { key: 'categoryName', label: 'Category' },
          { key: 'currentStock', label: 'Current Stock' },
          { key: 'minimumStock', label: 'Minimum Stock' },
          { key: 'unit', label: 'Unit' },
        ]);
        return { filename: `low-stock-${stamp}.csv`, csv };
      }

      case 'out-of-stock': {
        const rows = await this.reportsService.getOutOfStockReport();
        const csv = this.reportsService.buildCsv(rows, [
          { key: 'sku', label: 'SKU' },
          { key: 'name', label: 'Product' },
          { key: 'categoryName', label: 'Category' },
          { key: 'minimumStock', label: 'Minimum Stock' },
          { key: 'unit', label: 'Unit' },
        ]);
        return { filename: `out-of-stock-${stamp}.csv`, csv };
      }

      case 'top-selling': {
        const rows = await this.reportsService.getTopSelling(query);
        const csv = this.reportsService.buildCsv(rows, [
          { key: 'sku', label: 'SKU' },
          { key: 'productName', label: 'Product' },
          { key: 'quantitySold', label: 'Qty Sold' },
          { key: 'revenue', label: 'Revenue' },
          { key: 'profit', label: 'Profit' },
        ]);
        return { filename: `top-selling-${stamp}.csv`, csv };
      }

      case 'dead-stock': {
        const rows = await this.reportsService.getDeadStock(query);
        const csv = this.reportsService.buildCsv(rows, [
          { key: 'sku', label: 'SKU' },
          { key: 'productName', label: 'Product' },
          { key: 'currentStock', label: 'Current Stock' },
          { key: 'stockValue', label: 'Stock Value' },
          { key: 'lastSoldAt', label: 'Last Sold At' },
          { key: 'daysSinceLastSale', label: 'Days Since Last Sale' },
        ]);
        return { filename: `dead-stock-${stamp}.csv`, csv };
      }

      case 'category-stock': {
        const rows = await this.reportsService.getCategoryStock();
        const csv = this.reportsService.buildCsv(rows, [
          { key: 'categoryName', label: 'Category' },
          { key: 'productCount', label: 'Products' },
          { key: 'totalQuantity', label: 'Total Quantity' },
          { key: 'totalStockValue', label: 'Stock Value' },
        ]);
        return { filename: `category-stock-${stamp}.csv`, csv };
      }

      case 'daily-summary': {
        const rows = await this.reportsService.getDailySummary(query);
        const csv = this.reportsService.buildCsv(rows, [
          { key: 'date', label: 'Date' },
          { key: 'saleCount', label: 'Sales' },
          { key: 'totalSales', label: 'Total Sales' },
          { key: 'totalProfit', label: 'Total Profit' },
          { key: 'totalReturns', label: 'Total Returns' },
        ]);
        return { filename: `daily-summary-${stamp}.csv`, csv };
      }

      default: {
        // Unreachable — schema restricts type.
        return { filename: `export-${stamp}.csv`, csv: '' };
      }
    }
  }
}
