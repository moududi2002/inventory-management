// apps/web/src/components/stock/product-picker.tsx

'use client';

// Searchable product picker for the "Add Stock" panel.
// Shows live search results with thumbnail, name, SKU, current stock.
// Click a result → sets the selected product (onSelect callback).

import { useEffect, useRef, useState } from 'react';
import { Package, Search, X, Check, Loader2 } from 'lucide-react';

import { useProductSearch } from '@/hooks/use-stock';
import { useDebounce } from '@/hooks/use-debounce';
import type { ProductListItem } from '@inventory/types';
import { cn } from '@/lib/utils';

interface ProductPickerProps {
  selected: ProductListItem | null;
  onSelect: (product: ProductListItem | null) => void;
  disabled?: boolean;
}

export function ProductPicker({
  selected,
  onSelect,
  disabled,
}: ProductPickerProps) {
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 250);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: results, isFetching } = useProductSearch(debouncedQ, open);

  // Close dropdown on outside click.
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // ----- Selected state -----
  if (selected) {
    return (
      <div className="rounded-lg border bg-card p-3 flex items-center gap-3">
        <div className="size-12 shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center">
          {selected.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected.imageUrl}
              alt={selected.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="size-5 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{selected.name}</div>
          <div className="text-xs text-muted-foreground truncate">
            {selected.sku} · {selected.currentStock} {selected.unit} in stock
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onSelect(null);
            setQ('');
          }}
          disabled={disabled}
          className="size-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
          aria-label="Remove"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  // ----- Search state -----
  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search product by name or SKU…"
          disabled={disabled}
          className="w-full h-11 pl-10 pr-10 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Results dropdown */}
      {open && debouncedQ.length >= 1 && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border bg-popover shadow-md overflow-hidden max-h-72 overflow-y-auto">
          {isFetching && !results ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Searching…
            </div>
          ) : !results || results.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No products match "{debouncedQ}"
            </div>
          ) : (
            <ul className="divide-y">
              {results.map((p) => (
                <li key={p._id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(p);
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-2.5 text-left hover:bg-accent transition-colors"
                  >
                    <div className="size-10 shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {p.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {p.sku} · {p.currentStock} {p.unit}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        'size-4 shrink-0',
                        selected?._id === p._id
                          ? 'text-primary'
                          : 'text-transparent',
                      )}
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-1.5">
        Tip: type at least 1 character to search
      </p>
    </div>
  );
}
