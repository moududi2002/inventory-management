// apps/api/src/uploads/uploads.controller.ts

// HTTP endpoints for uploading images.
// Uses Multer with memory storage — we write to disk ourselves
// so we can sanitize filenames and enforce size limits uniformly.

import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';

import { UploadsService } from './uploads.service';

// Configure Multer on the fly so MAX_FILE_SIZE comes from Config.
function buildFileInterceptor(config: ConfigService, fieldName: string) {
  const maxSize =
    config.get<number>('upload.maxFileSize') ?? 5 * 1024 * 1024;
  return FileInterceptor(fieldName, {
    // Memory storage: buffer is passed to our service for controlled write.
    // (limits prevent huge files from ever hitting our code.)
    limits: { fileSize: maxSize, files: 1 },
  });
}

@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly config: ConfigService,
  ) {}

  // POST /api/uploads/product-image
  // Field name: "file"
  @Post('product-image')
  @HttpCode(201)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  async uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    const result = await this.uploadsService.saveImage(file, 'products');
    return { upload: result };
  }

  // POST /api/uploads/shop-logo
  @Post('shop-logo')
  @HttpCode(201)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  async uploadShopLogo(@UploadedFile() file: Express.Multer.File) {
    const result = await this.uploadsService.saveImage(file, 'logo');
    return { upload: result };
  }
}
