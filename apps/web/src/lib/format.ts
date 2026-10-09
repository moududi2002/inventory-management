// apps/web/src/lib/format.ts

// Shared formatting helpers — currency, numbers, dates.

// Default currency symbol. Overridden by settings when available.
export const DEFAULT_CURRENCY = '৳';

// Format number with thousands separators: 1,234.56
export function formatNumber(
  value: number | null | undefined,
  decimals = 2,
): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

// Format as currency: ৳1,234.56
export function formatMoney(
  value: number | null | undefined,
  symbol = DEFAULT_CURRENCY,
): string {
  return `${symbol}${formatNumber(value, 2)}`;
}

// Compact currency for dashboards: ৳1.2K, ৳3.5M
export function formatMoneyCompact(
  value: number | null | undefined,
  symbol = DEFAULT_CURRENCY,
): string {
  const n = Number(value ?? 0);
  if (Math.abs(n) >= 1_000_000) {
    return `${symbol}${(n / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(n) >= 1_000) {
    return `${symbol}${(n / 1_000).toFixed(1)}K`;
  }
  return `${symbol}${n.toFixed(0)}`;
}

// Format an ISO date string: 08 Oct 2026
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Format ISO date + time: 08 Oct 2026, 8:15 PM
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
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

// Short relative time: "2h ago", "3d ago"
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.floor((now - then) / 1000);

  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  const yr = Math.floor(mo / 12);
  return `${yr}y ago`;
}

// YYYY-MM-DD for date inputs
export function toDateInputValue(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
