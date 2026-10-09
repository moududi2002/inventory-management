// apps/api/src/products/products.controller.ts

// HTTP endpoints for product management.
// All routes are protected by the global JWT guard.

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { ProductsService } from './products.service';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  type CreateProductInput,
  type ProductQueryInput,
  type UpdateProductInput,
} from './dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentUser, type JwtUser } from '../common/decorators/current-user.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // GET /api/products?q=&categoryId=&status=&page=&limit=...
  @Get()
  async list(
    @Query(new ZodValidationPipe(productQuerySchema)) query: ProductQueryInput,
  ) {
    return this.productsService.list(query);
  }

  // GET /api/products/lookup/:sku
  // Quick scan-friendly lookup (used by barcode in future).
  @Get('lookup/:sku')
  async lookupBySku(@Param('sku') sku: string) {
    const product = await this.productsService.findBySku(sku);
    if (!product) {
      return { product: null };
    }
    return { product: this.productsService.toApiShape(product) };
  }

  // GET /api/products/:id
  @Get(':id')
  async getOne(@Param('id') id: string) {
    const product = await this.productsService.getOrThrow(id);
    return { product: this.productsService.toApiShape(product) };
  }

  // POST /api/products
  @Post()
  async create(
    @Body(new ZodValidationPipe(createProductSchema))
    dto: CreateProductInput,
    @CurrentUser() _user: JwtUser,
  ) {
    const product = await this.productsService.create(dto);
    // Re-fetch to include populated category in response.
    const fresh = await this.productsService.getOrThrow(product._id.toString());
    return { product: this.productsService.toApiShape(fresh) };
  }

  // PATCH /api/products/:id
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProductSchema))
    dto: UpdateProductInput,
  ) {
    const product = await this.productsService.update(id, dto);
    const fresh = await this.productsService.getOrThrow(product._id.toString());
    return { product: this.productsService.toApiShape(fresh) };
  }

  // DELETE /api/products/:id (soft delete)
  @Delete(':id')
  @HttpCode(200)
  async remove(@Param('id') id: string) {
    return this.productsService.softDelete(id);
  }
}
