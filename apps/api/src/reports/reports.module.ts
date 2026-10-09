// apps/api/src/reports/reports.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Product, ProductSchema } from '../products/product.schema';
import { Sale, SaleSchema } from '../sales/sale.schema';
import { SaleReturn, SaleReturnSchema } from '../sales/sale-return.schema';
import {
  StockTransaction,
  StockTransactionSchema,
} from '../stock/stock-transaction.schema';
import { Category, CategorySchema } from '../categories/category.schema';

import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Sale.name, schema: SaleSchema },
      { name: SaleReturn.name, schema: SaleReturnSchema },
      { name: StockTransaction.name, schema: StockTransactionSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
