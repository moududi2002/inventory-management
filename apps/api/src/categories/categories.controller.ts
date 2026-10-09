// apps/api/src/categories/categories.controller.ts

// HTTP endpoints for category management.
// All routes are protected by the global JWT guard (Step 4).

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CategoriesService } from './categories.service';
import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from './dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // GET /api/categories
  // Returns all categories with product counts.
  @Get()
  async list() {
    const categories = await this.categoriesService.list();
    return { categories };
  }

  // GET /api/categories/:id
  @Get(':id')
  async getOne(@Param('id') id: string) {
    const category = await this.categoriesService.getOrThrow(id);
    return {
      category: {
        _id: category._id.toString(),
        name: category.name,
        description: category.description ?? '',
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
      },
    };
  }

  // POST /api/categories
  @Post()
  async create(
    @Body(new ZodValidationPipe(createCategorySchema))
    dto: CreateCategoryInput,
  ) {
    const category = await this.categoriesService.create(dto);
    return {
      category: {
        _id: category._id.toString(),
        name: category.name,
        description: category.description ?? '',
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
      },
    };
  }

  // PATCH /api/categories/:id
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCategorySchema))
    dto: UpdateCategoryInput,
  ) {
    const category = await this.categoriesService.update(id, dto);
    return {
      category: {
        _id: category._id.toString(),
        name: category.name,
        description: category.description ?? '',
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
      },
    };
  }

  // DELETE /api/categories/:id
  @Delete(':id')
  @HttpCode(200)
  async remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
