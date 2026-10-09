// apps/api/src/sales/sales.controller.ts

// HTTP endpoints for sales.
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

import { SalesService } from './sales.service';
import {
  createSaleSchema,
  saleQuerySchema,
  type CreateSaleInput,
  type SaleQueryInput,
} from './dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentUser, type JwtUser } from '../common/decorators/current-user.decorator';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // POST /api/sales
  @Post()
  @HttpCode(201)
  async create(
    @Body(new ZodValidationPipe(createSaleSchema)) dto: CreateSaleInput,
    @CurrentUser() user: JwtUser,
  ) {
    const sale = await this.salesService.create(dto, user.userId);
    return { sale };
  }

  // GET /api/sales?q=&status=&from=&to=&page=&limit=
  @Get()
  async list(
    @Query(new ZodValidationPipe(saleQuerySchema)) query: SaleQueryInput,
  ) {
    return this.salesService.list(query);
  }

  // GET /api/sales/by-code/:saleId  (e.g. SL-000001)
  @Get('by-code/:saleId')
  async getByCode(@Param('saleId') saleId: string) {
    const sale = await this.salesService.getBySaleIdOrThrow(saleId);
    return {
      sale: {
        _id: sale._id.toString(),
        saleId: sale.saleId,
        items: sale.items.map((i) => ({
          productId: i.productId.toString(),
          sku: i.sku,
          productName: i.productName,
          quantity: i.quantity,
          unitPriceAtSale: i.unitPriceAtSale,
          costPriceAtSale: i.costPriceAtSale,
          subtotal: i.subtotal,
          profit: i.profit,
          returnedQuantity: i.returnedQuantity,
        })),
        subtotal: sale.subtotal,
        discount: sale.discount,
        totalAmount: sale.totalAmount,
        totalProfit: sale.totalProfit,
        status: sale.status,
        soldAt: sale.soldAt.toISOString(),
        createdBy: sale.createdBy,
        createdAt: (sale as unknown as { createdAt: Date }).createdAt.toISOString(),
        updatedAt: (sale as unknown as { updatedAt: Date }).updatedAt.toISOString(),
      },
    };
  }

  // GET /api/sales/:id
  @Get(':id')
  async getOne(@Param('id') id: string) {
    const sale = await this.salesService.getOrThrow(id);
    return {
      sale: {
        _id: sale._id.toString(),
        saleId: sale.saleId,
        items: sale.items.map((i) => ({
          productId: i.productId.toString(),
          sku: i.sku,
          productName: i.productName,
          quantity: i.quantity,
          unitPriceAtSale: i.unitPriceAtSale,
          costPriceAtSale: i.costPriceAtSale,
          subtotal: i.subtotal,
          profit: i.profit,
          returnedQuantity: i.returnedQuantity,
        })),
        subtotal: sale.subtotal,
        discount: sale.discount,
        totalAmount: sale.totalAmount,
        totalProfit: sale.totalProfit,
        status: sale.status,
        soldAt: sale.soldAt.toISOString(),
        createdBy: sale.createdBy,
        createdAt: (sale as unknown as { createdAt: Date }).createdAt.toISOString(),
        updatedAt: (sale as unknown as { updatedAt: Date }).updatedAt.toISOString(),
      },
    };
  }
}
