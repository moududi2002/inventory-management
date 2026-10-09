// apps/web/src/hooks/use-currency.ts

'use client';

// Provides the currency symbol from Settings, with a safe fallback.
// Use this everywhere you format money so a shop-config change reflects app-wide.

import { useSettings } from './use-settings';

const FALLBACK = '৳';

export function useCurrency(): string {
  const { data } = useSettings();
  return data?.currencySymbol?.trim() || FALLBACK;
}
