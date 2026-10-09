// apps/api/src/receipts/templates/receipt-html.ts

// Builds a print-ready HTML document for a receipt.
// Used by GET /api/sales/:id/receipt (browser view + Ctrl+P to print).
//
// Style goals:
//   - 80mm thermal-printer friendly width (also fine on A4)
//   - Monospace-ish alignment for item lines
//   - Minimal, no external fonts/images required

export interface ReceiptLineItem {
  sku: string;
  productName: string;
  quantity: number;
  unitPriceAtSale: number;
  subtotal: number;
}

export interface ReceiptData {
  // Shop
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  shopEmail: string;
  logoUrl: string | null; // absolute URL for <img src>
  receiptFooterNote: string;
  currencySymbol: string;

  // Sale
  saleId: string;
  soldAt: string; // ISO
  status: string;
  items: ReceiptLineItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  // Profit is intentionally NOT printed on receipts.
}

// Escape user-provided strings for safe HTML embedding.
function esc(v: string): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Format a number as 1,234.56
function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

// Format a date string like "08 Oct 2026, 8:15 PM"
function fmtDate(iso: string): string {
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

export function buildReceiptHtml(data: ReceiptData): string {
  const cur = esc(data.currencySymbol || '৳');

  const itemRows = data.items
    .map((item) => {
      return `
        <tr>
          <td class="item-name">
            ${esc(item.productName)}
            <div class="item-sku">${esc(item.sku)}</div>
          </td>
          <td class="num">${item.quantity}</td>
          <td class="num">${cur}${fmt(item.unitPriceAtSale)}</td>
          <td class="num">${cur}${fmt(item.subtotal)}</td>
        </tr>
      `;
    })
    .join('');

  const logoBlock = data.logoUrl
    ? `<img class="logo" src="${esc(data.logoUrl)}" alt="logo" />`
    : '';

  const discountRow =
    data.discount > 0
      ? `
      <tr class="discount-row">
        <td colspan="3" class="label-right">Discount</td>
        <td class="num">- ${cur}${fmt(data.discount)}</td>
      </tr>
    `
      : '';

  const statusNote =
    data.status !== 'COMPLETED'
      ? `<div class="status-note">Status: ${esc(data.status.replace(/_/g, ' '))}</div>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Receipt ${esc(data.saleId)}</title>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f5f5f5;
      color: #111;
      padding: 20px;
      display: flex;
      justify-content: center;
    }
    .receipt {
      background: #fff;
      width: 100%;
      max-width: 380px;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0,0,0,.08);
    }
    .header { text-align: center; margin-bottom: 16px; }
    .logo { max-height: 60px; margin-bottom: 8px; }
    .shop-name { font-size: 20px; font-weight: 700; margin: 0 0 4px; }
    .shop-line { font-size: 12px; color: #555; margin: 1px 0; }
    .divider { border: none; border-top: 1px dashed #bbb; margin: 12px 0; }
    .meta {
      font-size: 12px;
      color: #333;
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .meta .right { text-align: right; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th {
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      color: #666;
      border-bottom: 1px solid #ddd;
      padding: 6px 0;
    }
    th.num, td.num { text-align: right; }
    td { padding: 8px 0; vertical-align: top; }
    .item-name { font-weight: 500; }
    .item-sku { font-size: 11px; color: #888; margin-top: 2px; }
    .totals td { padding: 4px 0; font-size: 13px; }
    .totals .label-right { text-align: right; color: #555; }
    .discount-row td { color: #b91c1c; }
    .grand-total td {
      font-weight: 700;
      font-size: 16px;
      padding-top: 8px;
      border-top: 1px solid #ddd;
    }
    .status-note {
      margin-top: 10px;
      text-align: center;
      font-size: 11px;
      color: #b45309;
      background: #fef3c7;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      color: #666;
      margin-top: 16px;
    }
    .actions {
      text-align: center;
      margin-top: 16px;
    }
    .actions button {
      background: #111;
      color: #fff;
      border: 0;
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .receipt { box-shadow: none; max-width: 80mm; padding: 0; border-radius: 0; }
      .actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      ${logoBlock}
      <h1 class="shop-name">${esc(data.shopName)}</h1>
      ${data.shopAddress ? `<p class="shop-line">${esc(data.shopAddress)}</p>` : ''}
      ${data.shopPhone ? `<p class="shop-line">Phone: ${esc(data.shopPhone)}</p>` : ''}
      ${data.shopEmail ? `<p class="shop-line">${esc(data.shopEmail)}</p>` : ''}
    </div>

    <hr class="divider" />

    <div class="meta">
      <div>
        <div><strong>Receipt #</strong> ${esc(data.saleId)}</div>
      </div>
      <div class="right">
        <div>${esc(fmtDate(data.soldAt))}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="num">Qty</th>
          <th class="num">Price</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <hr class="divider" />

    <table class="totals">
      <tr>
        <td colspan="3" class="label-right">Subtotal</td>
        <td class="num">${cur}${fmt(data.subtotal)}</td>
      </tr>
      ${discountRow}
      <tr class="grand-total">
        <td colspan="3" class="label-right">Total</td>
        <td class="num">${cur}${fmt(data.totalAmount)}</td>
      </tr>
    </table>

    ${statusNote}

    <div class="footer">
      ${esc(data.receiptFooterNote)}
    </div>

    <div class="actions">
      <button onclick="window.print()">Print</button>
    </div>
  </div>
</body>
</html>`;
}
