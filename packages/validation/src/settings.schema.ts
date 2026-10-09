import { z } from 'zod';

export const updateSettingsSchema = z
  .object({
    shopName: z.string().min(1).max(120).trim().optional(),
    shopAddress: z.string().max(400).trim().optional(),
    shopPhone: z.string().max(30).trim().optional(),
    shopEmail: z.string().email('Invalid email').trim().optional().or(z.literal('')),
    logoUrl: z.string().trim().nullable().optional(),
    receiptFooterNote: z.string().max(300).trim().optional(),
    lowStockEmailTo: z.string().email('Invalid email').trim().optional().or(z.literal('')),
    lowStockAlertEnabled: z.boolean().optional(),
    currencySymbol: z.string().min(1).max(5).trim().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
