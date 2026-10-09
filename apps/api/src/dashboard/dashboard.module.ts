// apps/api/src/dashboard/dashboard.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Product, ProductSchema } from '../products/product.schema';
import { Sale, SaleSchema } from '../sales/sale.schema';
import {
  StockTransaction,
  StockTransactionSchema,
} from '../stock/stock-transaction.schema';

import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Sale.name, schema: SaleSchema },
      { name: StockTransaction.name, schema: StockTransactionSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
