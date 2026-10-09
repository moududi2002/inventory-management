// apps/api/src/receipts/receipts.controller.ts

// Receipt endpoints:
//   GET /api/sales/:id/receipt      → HTML (browser view + print)
//   GET /api/sales/:id/receipt.pdf  → PDF download
//
// `:id` can be either the sale ObjectId (24-hex) or the sale code (SL-xxxxxx).
// All routes are protected by the global JWT guard.

import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';

import { ReceiptsService } from './receipts.service';

@Controller('sales')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  // GET /api/sales/:id/receipt
  @Get(':id/receipt')
  async getHtml(@Param('id') id: string, @Res() res: Response) {
    const html = await this.receiptsService.generateHtml(id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  // GET /api/sales/:id/receipt.pdf
  @Get(':id/receipt.pdf')
  async getPdf(@Param('id') id: string, @Res() res: Response) {
    const { buffer, filename } = await this.receiptsService.generatePdfBuffer(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${filename}"`, // "inline" so browsers preview; use "attachment" to force download
    );
    res.setHeader('Content-Length', String(buffer.length));
    res.end(buffer);
  }
}
