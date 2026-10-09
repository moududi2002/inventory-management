// apps/api/src/stock/stock.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  StockTransaction,
  StockTransactionSchema,
} from './stock-transaction.schema';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StockTransaction.name, schema: StockTransactionSchema },
    ]),
    ProductsModule, // for atomic stock updates + validation
  ],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService, MongooseModule], // Sales module will use StockService
})
export class StockModule {}
