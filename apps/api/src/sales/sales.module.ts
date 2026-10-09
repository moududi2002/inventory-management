// apps/api/src/sales/sales.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Sale, SaleSchema } from './sale.schema';
import { SaleReturn, SaleReturnSchema } from './sale-return.schema';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { SaleReturnsService } from './sale-returns.service';
import {
  SaleReturnsController,
  SaleReturnsNestedController,
} from './sale-returns.controller';
import { ProductsModule } from '../products/products.module';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sale.name, schema: SaleSchema },
      { name: SaleReturn.name, schema: SaleReturnSchema },
    ]),
    ProductsModule,
    StockModule,
  ],
  controllers: [
    SalesController,
    SaleReturnsController,
    SaleReturnsNestedController,
  ],
  providers: [SalesService, SaleReturnsService],
  exports: [SalesService, SaleReturnsService, MongooseModule],
})
export class SalesModule {}
