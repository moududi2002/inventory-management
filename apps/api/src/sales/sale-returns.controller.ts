// apps/api/src/sales/sale-returns.controller.ts

// HTTP endpoints for sale returns.
//   POST /api/sales/:id/return    → create a return (id may be sale _id or SL-xxxxxx)
//   GET  /api/returns             → list returns with filters
//   GET  /api/returns/:id         → single return
//   GET  /api/sales/:id/returns   → all returns for a given sale
//
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

import { SaleReturnsService } from './sale-returns.service';
import {
  createSaleReturnSchema,
  saleReturnQuerySchema,
  type CreateSaleReturnInput,
  type SaleReturnQueryInput,
} from './dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentUser, type JwtUser } from '../common/decorators/current-user.decorator';

// ---------- /api/returns ----------
@Controller('returns')
export class SaleReturnsController {
  constructor(private readonly returnsService: SaleReturnsService) {}

  // GET /api/returns?saleId=&q=&from=&to=&page=
  @Get()
  async list(
    @Query(new ZodValidationPipe(saleReturnQuerySchema))
    query: SaleReturnQueryInput,
  ) {
    return this.returnsService.list(query);
  }

  // GET /api/returns/:id
  @Get(':id')
  async getOne(@Param('id') id: string) {
    const doc = await this.returnsService.getOrThrow(id);
    return {
      return: {
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
        createdAt: (doc as unknown as { createdAt: Date }).createdAt.toISOString(),
      },
    };
  }
}

// ---------- /api/sales/:id/return and /api/sales/:id/returns ----------
@Controller('sales')
export class SaleReturnsNestedController {
  constructor(private readonly returnsService: SaleReturnsService) {}

  // POST /api/sales/:id/return
  @Post(':id/return')
  @HttpCode(201)
  async createReturn(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createSaleReturnSchema))
    dto: CreateSaleReturnInput,
    @CurrentUser() user: JwtUser,
  ) {
    const saleReturn = await this.returnsService.createReturn(id, dto, user.userId);
    return { return: saleReturn };
  }

  // GET /api/sales/:id/returns
  @Get(':id/returns')
  async listReturnsForSale(@Param('id') id: string) {
    const returns = await this.returnsService.listBySale(id);
    return { returns };
  }
}
