// apps/api/src/receipts/receipts.service.ts

// Receipt generation:
//   - buildReceiptData(saleId) → merged Sale + Settings + computed fields
//   - generateHtml(saleId)     → full HTML string
//   - generatePdfBuffer(saleId)→ Buffer for PDF download
//
// Uses pdfkit for PDF (no Chromium dependency — lightweight on VPS).

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PDFDocument from 'pdfkit';

import { SalesService } from '../sales/sales.service';
import { SettingsService } from '../settings/settings.service';
import type { SaleDocument } from '../sales/sale.schema';
import type { SettingsDocument } from '../settings/settings.schema';
import {
  buildReceiptHtml,
  type ReceiptData,
  type ReceiptLineItem,
} from './templates/receipt-html';

@Injectable()
export class ReceiptsService {
  constructor(
    private readonly salesService: SalesService,
    private readonly settingsService: SettingsService,
    private readonly config: ConfigService,
  ) {}

  // ---------- Public API ----------

  async generateHtml(saleIdOrObjectId: string): Promise<string> {
    const data = await this.buildReceiptData(saleIdOrObjectId);
    return buildReceiptHtml(data);
  }

  async generatePdfBuffer(saleIdOrObjectId: string): Promise<{
    buffer: Buffer;
    filename: string;
  }> {
    const data = await this.buildReceiptData(saleIdOrObjectId);
    const buffer = await this.renderPdf(data);
    return { buffer, filename: `receipt-${data.saleId}.pdf` };
  }

  // ---------- Data assembly ----------

  async buildReceiptData(saleIdOrObjectId: string): Promise<ReceiptData> {
    // 1) Load sale — accepts both _id and SL-xxxxxxxx.
    const sale = await this.loadSale(saleIdOrObjectId);

    // 2) Load settings (auto-creates if missing).
    const settings = await this.settingsService.getOrCreate();

    // 3) Build absolute logo URL if provided.
    const publicUrl = this.config.get<string>('upload.publicUrl') ?? '';
    const logoUrl = settings.logoUrl
      ? settings.logoUrl.startsWith('http')
        ? settings.logoUrl
        : `${publicUrl.replace(/\/$/, '')}${settings.logoUrl}`
      : null;

    // 4) Map items.
    const items: ReceiptLineItem[] = sale.items.map((i) => ({
      sku: i.sku,
      productName: i.productName,
      quantity: i.quantity,
      unitPriceAtSale: i.unitPriceAtSale,
      subtotal: i.subtotal,
    }));

    return this.toReceiptData(sale, settings, items, logoUrl);
  }

  // ---------- Internal ----------

  private async loadSale(idOrCode: string): Promise<SaleDocument> {
    // SalesService already exposes findBySaleId + getOrThrow — reuse via its shape.
    // We call getOrThrow for _id, and findBySaleId for SL-code.
    // To avoid throwing on _id vs code confusion, try both.

    // Try as _id (24-hex) via getOrThrow.
    if (/^[0-9a-fA-F]{24}$/.test(idOrCode)) {
      return this.salesService.getOrThrow(idOrCode);
    }

    // Otherwise, treat as SL-xxxxxxxx.
    const byCode = await this.salesService.getBySaleIdOrThrow(idOrCode);
    return byCode;
  }

  private toReceiptData(
    sale: SaleDocument,
    settings: SettingsDocument,
    items: ReceiptLineItem[],
    logoUrl: string | null,
  ): ReceiptData {
    return {
      shopName: settings.shopName,
      shopAddress: settings.shopAddress,
      shopPhone: settings.shopPhone,
      shopEmail: settings.shopEmail,
      logoUrl,
      receiptFooterNote: settings.receiptFooterNote,
      currencySymbol: settings.currencySymbol,

      saleId: sale.saleId,
      soldAt: sale.soldAt.toISOString(),
      status: sale.status,
      items,
      subtotal: sale.subtotal,
      discount: sale.discount,
      totalAmount: sale.totalAmount,
    };
  }

  // ---------- PDF rendering ----------

  private renderPdf(data: ReceiptData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        // 80mm-ish width → 226pt (~= 80mm). Height auto.
        const doc = new PDFDocument({
          size: [226, 700], // will auto-page if longer
          margin: 12,
          autoFirstPage: true,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const cur = data.currencySymbol || '৳';
        const W = 226 - 24; // printable width inside margins
        const LEFT = 12;

        // ---------- Header ----------
        doc.font('Helvetica-Bold').fontSize(13).text(data.shopName, LEFT, 12, {
          width: W,
          align: 'center',
        });
        doc.font('Helvetica').fontSize(8);

        if (data.shopAddress) {
          doc.text(data.shopAddress, LEFT, doc.y, { width: W, align: 'center' });
        }
        if (data.shopPhone) {
          doc.text(`Phone: ${data.shopPhone}`, LEFT, doc.y, {
            width: W,
            align: 'center',
          });
        }
        if (data.shopEmail) {
          doc.text(data.shopEmail, LEFT, doc.y, { width: W, align: 'center' });
        }

        doc.moveDown(0.5);
        this.dashedLine(doc, LEFT, W);

        // ---------- Meta ----------
        doc.fontSize(8).font('Helvetica-Bold');
        doc.text(`Receipt #: ${data.saleId}`, LEFT, doc.y, { width: W });
        doc.font('Helvetica').fontSize(7.5);
        doc.text(this.formatDate(data.soldAt), LEFT, doc.y, { width: W });

        if (data.status !== 'COMPLETED') {
          doc.fillColor('#b45309');
          doc.text(`Status: ${data.status.replace(/_/g, ' ')}`, LEFT, doc.y, {
            width: W,
          });
          doc.fillColor('#000');
        }

        doc.moveDown(0.4);
        this.dashedLine(doc, LEFT, W);

        // ---------- Column headers ----------
        const colQty = LEFT + W - 100;
        const colPrice = LEFT + W - 70;
        const colTotal = LEFT + W - 35;

        doc.font('Helvetica-Bold').fontSize(7.5);
        doc.text('Item', LEFT, doc.y, { width: W - 100, continued: false });
        // Overwrite with right-side labels on the same line:
        const headerY = doc.y - doc.currentLineHeight();
        doc.text('Qty', colQty, headerY, { width: 25, align: 'right' });
        doc.text('Price', colPrice, headerY, { width: 32, align: 'right' });
        doc.text('Total', colTotal, headerY, { width: 35, align: 'right' });

        doc.moveDown(0.3);
        this.dashedLine(doc, LEFT, W);

        // ---------- Items ----------
        doc.font('Helvetica').fontSize(8);
        for (const item of data.items) {
          const startY = doc.y;

          // Name (left, wraps if long)
          doc.text(item.productName, LEFT, startY, { width: W - 100 });
          const nameBottom = doc.y;

          // SKU small line
          doc.fontSize(6.5).fillColor('#888');
          doc.text(item.sku, LEFT, nameBottom, { width: W - 100 });
          doc.fillColor('#000');

          // Numbers on the same top line as name
          doc.fontSize(8);
          doc.text(
            String(item.quantity),
            colQty,
            startY,
            { width: 25, align: 'right' },
          );
          doc.text(
            this.money(cur, item.unitPriceAtSale),
            colPrice,
            startY,
            { width: 32, align: 'right' },
          );
          doc.text(this.money(cur, item.subtotal), colTotal, startY, {
            width: 35,
            align: 'right',
          });

          doc.moveDown(0.3);
        }

        doc.moveDown(0.2);
        this.dashedLine(doc, LEFT, W);

        // ---------- Totals ----------
        doc.fontSize(8).font('Helvetica');
        doc.text('Subtotal', LEFT, doc.y, { width: W - 45, align: 'right' });
        const subY = doc.y - doc.currentLineHeight();
        doc.text(this.money(cur, data.subtotal), colTotal, subY, {
          width: 35,
          align: 'right',
        });

        if (data.discount > 0) {
          doc.fillColor('#b91c1c');
          doc.text('Discount', LEFT, doc.y, { width: W - 45, align: 'right' });
          const discY = doc.y - doc.currentLineHeight();
          doc.text(`- ${this.money(cur, data.discount)}`, colTotal, discY, {
            width: 35,
            align: 'right',
          });
          doc.fillColor('#000');
        }

        doc.moveDown(0.2);
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('Total', LEFT, doc.y, { width: W - 45, align: 'right' });
        const totY = doc.y - doc.currentLineHeight();
        doc.text(this.money(cur, data.totalAmount), colTotal, totY, {
          width: 35,
          align: 'right',
        });

        // ---------- Footer ----------
        doc.moveDown(1);
        doc.font('Helvetica').fontSize(7).fillColor('#666');
        doc.text(data.receiptFooterNote, LEFT, doc.y, {
          width: W,
          align: 'center',
        });
        doc.fillColor('#000');

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  // ---------- Formatting helpers ----------

  private money(symbol: string, n: number): string {
    // e.g. ৳1,234.56
    const fixed = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
    return `${symbol}${fixed}`;
  }

  private formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  private dashedLine(
    doc: PDFKit.PDFDocument,
    left: number,
    width: number,
  ): void {
    const y = doc.y;
    doc
      .save()
      .strokeColor('#bbb')
      .lineWidth(0.5)
      .dash(2, { space: 2 })
      .moveTo(left, y)
      .lineTo(left + width, y)
      .stroke()
      .undash()
      .restore();
    doc.y = y + 4;
  }
}
