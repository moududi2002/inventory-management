// apps/api/src/uploads/uploads.service.ts

// Handles saving uploaded images to local disk.
//   - Validates mime type (jpeg / png / webp)
//   - Enforces max file size (from Config)
//   - Generates safe, unique filenames
//   - Returns the public URL path served by ServeStaticModule
//
// Public URL shape:
//   /uploads/products/<filename>
//   /uploads/logo/<filename>
//
// Folder layout (relative to process.cwd()):
//   ./uploads/products/
//   ./uploads/logo/

import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

export type UploadKind = 'products' | 'logo';

export interface UploadResult {
  url: string;        // e.g. "/uploads/products/prod-1712000000-a1b2c3.jpg"
  filename: string;   // e.g. "prod-1712000000-a1b2c3.jpg"
  size: number;       // bytes
  mimeType: string;   // image/jpeg etc.
}

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

// Map mime → extension (used for filenames)
const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

@Injectable()
export class UploadsService implements OnModuleInit {
  private readonly logger = new Logger(UploadsService.name);
  private readonly baseDir: string;
  private readonly maxFileSize: number;

  constructor(private readonly config: ConfigService) {
    // Root dir where uploads live (relative to cwd → apps/api)
    this.baseDir = this.config.get<string>('upload.dir') ?? './uploads';
    this.maxFileSize =
      this.config.get<number>('upload.maxFileSize') ?? 5 * 1024 * 1024;
  }

  // ---------- On module init: ensure folders exist ----------

  async onModuleInit(): Promise<void> {
    const folders: UploadKind[] = ['products', 'logo'];
    for (const folder of folders) {
      const dir = path.join(this.baseDir, folder);
      if (!existsSync(dir)) {
        await fs.mkdir(dir, { recursive: true });
        this.logger.log(`Created upload folder: ${dir}`);
      }
    }
  }

  // ---------- Public API ----------

  // Validate + save a single uploaded file.
  // `kind` decides the subfolder: "products" or "logo".
  async saveImage(
    file: Express.Multer.File | undefined,
    kind: UploadKind,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // 1) Mime check
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported image type: ${file.mimetype}. Allowed: JPEG, PNG, WEBP.`,
      );
    }

    // 2) Size check (Multer already enforces, but double-check)
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File too large. Max allowed: ${Math.round(
          this.maxFileSize / 1024 / 1024,
        )} MB.`,
      );
    }

    // 3) Build a safe, unique filename
    const ext = MIME_EXT[file.mimetype] ?? '.jpg';
    const stamp = Date.now();
    const rand = randomBytes(4).toString('hex'); // 8 chars
    const prefix = kind === 'logo' ? 'logo' : 'prod';
    const filename = `${prefix}-${stamp}-${rand}${ext}`;

    // 4) Absolute destination path (no user input in the path)
    const dir = path.join(this.baseDir, kind);
    const dest = path.join(dir, filename);

    // Path traversal safety: ensure dest stays within dir
    if (!this.isPathInside(dir, dest)) {
      throw new BadRequestException('Invalid file path');
    }

    // 5) Write file
    await fs.writeFile(dest, file.buffer);

    this.logger.log(
      `Saved ${kind} image: ${filename} (${(file.size / 1024).toFixed(1)} KB)`,
    );

    return {
      url: `/uploads/${kind}/${filename}`,
      filename,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  // ---------- Helpers ----------

  // Delete a previously uploaded file by its public URL.
  // Safe: silently ignores missing files, never throws.
  async deleteByUrl(publicUrl: string | null | undefined): Promise<void> {
    if (!publicUrl) return;

    // Only handle our own uploads.
    if (!publicUrl.startsWith('/uploads/')) return;

    // Strip leading "/uploads/"
    const rel = publicUrl.replace(/^\/uploads\//, '');
    const abs = path.join(this.baseDir, rel);

    // Path traversal safety: must stay inside baseDir
    if (!this.isPathInside(this.baseDir, abs)) {
      return;
    }

    try {
      await fs.unlink(abs);
      this.logger.log(`Deleted upload: ${rel}`);
    } catch (err) {
      // File already gone or permissions — not fatal.
      this.logger.warn(
        `Failed to delete ${rel}: ${err instanceof Error ? err.message : 'unknown'}`,
      );
    }
  }

  // ---------- Internal path utilities ----------

  // Returns true if `child` is inside `parent` (prevents `../` escapes).
  private isPathInside(parent: string, child: string): boolean {
    const rel = path.relative(parent, child);
    return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel);
  }
}
