// apps/web/src/components/reports/date-range-picker.tsx

'use client';

// A compact from/to date range picker with quick presets.
//   [Today] [7d] [30d] [90d] [Custom…]
//
// "Custom…" reveals two native date inputs (mobile-friendly).

import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toDateInputValue } from '@/lib/format';

export type Preset = 'today' | '7d' | '30d' | '90d' | 'custom';

export interface DateRange {
  from?: string; // ISO
  to?: string;   // ISO
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
}

// Build an ISO range for a preset.
function rangeForPreset(preset: Exclude<Preset, 'custom'>): DateRange {
  const to = new Date();
  to.setHours(23, 59, 59, 999);

  const from = new Date();
  from.setHours(0, 0, 0, 0);

  if (preset === '7d') from.setDate(from.getDate() - 6);
  else if (preset === '30d') from.setDate(from.getDate() - 29);
  else if (preset === '90d') from.setDate(from.getDate() - 89);
  // 'today' → from and to same day

  return { from: from.toISOString(), to: to.toISOString() };
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [preset, setPreset] = useState<Preset>('30d');
  const [showCustom, setShowCustom] = useState(false);

  const applyPreset = (p: Exclude<Preset, 'custom'>) => {
    setPreset(p);
    setShowCustom(false);
    onChange(rangeForPreset(p));
  };

  const customFrom = value.from ? toDateInputValue(value.from) : '';
  const customTo = value.to ? toDateInputValue(value.to) : '';

  const setCustomDate = (which: 'from' | 'to', v: string) => {
    if (!v) return;
    const d = new Date(v);
    if (which === 'from') d.setHours(0, 0, 0, 0);
    else d.setHours(23, 59, 59, 999);
    onChange({ ...value, [which]: d.toISOString() });
    setPreset('custom');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {(['today', '7d', '30d', '90d'] as const).map((p) => (
          <Button
            key={p}
            type="button"
            variant={preset === p ? 'default' : 'outline'}
            size="sm"
            onClick={() => applyPreset(p)}
            className="h-8 px-3 text-xs"
          >
            {p === 'today' ? 'Today' : p}
          </Button>
        ))}
        <Button
          type="button"
          variant={showCustom ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowCustom((s) => !s)}
          className="h-8 px-3 text-xs"
        >
          <Calendar className="mr-1.5 size-3.5" />
          Custom
          <ChevronDown
            className={cn(
              'ml-1 size-3 transition-transform',
              showCustom && 'rotate-180',
            )}
          />
        </Button>
      </div>

      {showCustom && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">From</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomDate('from', e.target.value)}
              className="h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">To</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomDate('to', e.target.value)}
              className="h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      )}
    </div>
  );
}
