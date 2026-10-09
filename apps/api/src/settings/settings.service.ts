// apps/api/src/settings/settings.service.ts

// Settings is a singleton.
//   get()          → returns the doc (creates with defaults if missing)
//   getOrCreate()  → alias for get() — used by other modules
//   update()       → patches allowed fields, never re-creates
//
// Because _id is fixed to "global", there can never be more than one doc.

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Settings,
  SettingsDocument,
  SETTINGS_SINGLETON_ID,
} from './settings.schema';
import type { UpdateSettingsInput } from './dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectModel(Settings.name)
    private readonly settingsModel: Model<SettingsDocument>,
  ) {}

  // ---------- READ ----------

  // Returns the single settings doc. Auto-creates with defaults on first call.
  async getOrCreate(): Promise<SettingsDocument> {
    const existing = await this.settingsModel
      .findById(SETTINGS_SINGLETON_ID)
      .exec();

    if (existing) return existing;

    // Use findOneAndUpdate with upsert so concurrent first-calls
    // can't create duplicate docs.
    const created = await this.settingsModel
      .findByIdAndUpdate(
        SETTINGS_SINGLETON_ID,
        {
          $setOnInsert: {
            _id: SETTINGS_SINGLETON_ID,
            shopName: 'My Shop',
            shopAddress: '',
            shopPhone: '',
            shopEmail: '',
            logoUrl: null,
            receiptFooterNote: 'Thank you for your purchase!',
            currencySymbol: '৳',
            lowStockAlertEnabled: false,
            lowStockEmailTo: '',
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();

    this.logger.log('Settings document created with defaults');
    return created!;
  }

  // Convenience alias.
  async get(): Promise<SettingsDocument> {
    return this.getOrCreate();
  }

  // ---------- UPDATE ----------

  async update(input: UpdateSettingsInput): Promise<SettingsDocument> {
    // Ensure the doc exists (creates with defaults if first time).
    await this.getOrCreate();

    // Build the patch object from provided fields only.
    const patch: Record<string, unknown> = {};

    if (input.shopName !== undefined) patch.shopName = input.shopName.trim();
    if (input.shopAddress !== undefined) patch.shopAddress = input.shopAddress.trim();
    if (input.shopPhone !== undefined) patch.shopPhone = input.shopPhone.trim();
    if (input.shopEmail !== undefined) {
      patch.shopEmail = (input.shopEmail ?? '').trim().toLowerCase();
    }
    if (input.logoUrl !== undefined) patch.logoUrl = input.logoUrl || null;
    if (input.receiptFooterNote !== undefined) {
      patch.receiptFooterNote = input.receiptFooterNote.trim();
    }
    if (input.currencySymbol !== undefined) {
      patch.currencySymbol = input.currencySymbol.trim();
    }
    if (input.lowStockAlertEnabled !== undefined) {
      patch.lowStockAlertEnabled = input.lowStockAlertEnabled;
    }
    if (input.lowStockEmailTo !== undefined) {
      patch.lowStockEmailTo = (input.lowStockEmailTo ?? '').trim().toLowerCase();
    }

    const updated = await this.settingsModel
      .findByIdAndUpdate(
        SETTINGS_SINGLETON_ID,
        { $set: patch },
        { new: true },
      )
      .exec();

    return updated!;
  }

  // ---------- Utility: shape for HTTP ----------

  toApiShape(doc: SettingsDocument | Settings): {
    _id: string;
    shopName: string;
    shopAddress: string;
    shopPhone: string;
    shopEmail: string;
    logoUrl: string | null;
    receiptFooterNote: string;
    currencySymbol: string;
    lowStockAlertEnabled: boolean;
    lowStockEmailTo: string;
    createdAt: string;
    updatedAt: string;
  } {
    const raw = doc as unknown as {
      _id: string;
      shopName: string;
      shopAddress: string;
      shopPhone: string;
      shopEmail: string;
      logoUrl: string | null;
      receiptFooterNote: string;
      currencySymbol: string;
      lowStockAlertEnabled: boolean;
      lowStockEmailTo: string;
      createdAt: Date;
      updatedAt: Date;
    };

    return {
      _id: raw._id,
      shopName: raw.shopName,
      shopAddress: raw.shopAddress,
      shopPhone: raw.shopPhone,
      shopEmail: raw.shopEmail,
      logoUrl: raw.logoUrl ?? null,
      receiptFooterNote: raw.receiptFooterNote,
      currencySymbol: raw.currencySymbol,
      lowStockAlertEnabled: raw.lowStockAlertEnabled,
      lowStockEmailTo: raw.lowStockEmailTo,
      createdAt: raw.createdAt.toISOString(),
      updatedAt: raw.updatedAt.toISOString(),
    };
  }
}
