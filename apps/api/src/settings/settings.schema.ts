// apps/api/src/settings/settings.schema.ts

// Singleton Settings document.
// There is exactly ONE document in this collection.
// We enforce this by always using a fixed _id ("global") via findOneAndUpdate upsert.

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SettingsDocument = HydratedDocument<Settings>;

// Fixed _id so there can only ever be one settings doc.
export const SETTINGS_SINGLETON_ID = 'global';

@Schema({ timestamps: true, collection: 'settings' })
export class Settings {
  // _id is always 'global'
  @Prop({ type: String, default: SETTINGS_SINGLETON_ID })
  _id: string;

  // ---- Shop info (shown on receipts) ----
  @Prop({ trim: true, maxlength: 120, default: 'My Shop' })
  shopName: string;

  @Prop({ trim: true, maxlength: 400, default: '' })
  shopAddress: string;

  @Prop({ trim: true, maxlength: 30, default: '' })
  shopPhone: string;

  @Prop({ trim: true, maxlength: 120, default: '' })
  shopEmail: string;

  // Path relative to /uploads — e.g. "logo/shop-logo.png"
  @Prop({ type: String, default: null })
  logoUrl: string | null;

  // ---- Receipt ----
  @Prop({
    trim: true,
    maxlength: 300,
    default: 'Thank you for your purchase!',
  })
  receiptFooterNote: string;

  // ---- Currency ----
  @Prop({ trim: true, maxlength: 5, default: '৳' })
  currencySymbol: string;

  // ---- Low stock alerts ----
  @Prop({ default: false })
  lowStockAlertEnabled: boolean;

  @Prop({ trim: true, lowercase: true, maxlength: 120, default: '' })
  lowStockEmailTo: string;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
