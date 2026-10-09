// apps/api/src/stock/stock.controller.ts

// HTTP endpoints for stock operations.
// All routes are protected by the global JWT guard.

import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { StockService } from './stock.service';
import {
  addStockSchema,
  adjustStockSchema,
  stockQuerySchema,
  type AddStockInput,
  type AdjustStockInput,
  type StockQueryInput,
} from './dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentUser, type JwtUser } from '../common/decorators/current-user.decorator';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  // POST /api/stock/add
  // Manually add stock (purchase, initial, etc).
  @Post('add')
  @HttpCode(201)
  async add(
    @Body(new ZodValidationPipe(addStockSchema)) dto: AddStockInput,
    @CurrentUser() user: JwtUser,
  ) {
    return this.stockService.addStock(dto, user.userId);
  }

  // POST /api/stock/adjust
  // Set stock to an absolute value with a reason.
  @Post('adjust')
  @HttpCode(200)
  async adjust(
    @Body(new ZodValidationPipe(adjustStockSchema)) dto: AdjustStockInput,
    @CurrentUser() user: JwtUser,
  ) {
    return this.stockService.adjustStock(dto, user.userId);
  }

  // GET /api/stock/transactions?productId=&type=&from=&to=&page=
  @Get('transactions')
  async listTransactions(
    @Query(new ZodValidationPipe(stockQuerySchema)) query: StockQueryInput,
  ) {
    return this.stockService.listTransactions(query);
  }

  // GET /api/stock/history/:productId
  @Get('history/:productId')
  async productHistory(
    @Param('productId') productId: string,
    @Query(new ZodValidationPipe(stockQuerySchema)) query: StockQueryInput,
  ) {
    return this.stockService.getProductHistory(productId, query);
  }
}
