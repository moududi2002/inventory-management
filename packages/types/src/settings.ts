/**
 * Shop settings — single document, used for receipts and alerts.
 */

export interface Settings {
  _id: string;
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  shopEmail: string;
  logoUrl?: string | null;
  receiptFooterNote: string;
  lowStockEmailTo: string;
  lowStockAlertEnabled: boolean;
  currencySymbol: string;         // default: ৳
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsInput {
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
  shopEmail?: string;
  logoUrl?: string | null;
  receiptFooterNote?: string;
  lowStockEmailTo?: string;
  lowStockAlertEnabled?: boolean;
  currencySymbol?: string;
}
