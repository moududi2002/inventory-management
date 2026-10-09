// apps/web/src/components/dashboard/search-bar.tsx

'use client';

// Quick search box on the dashboard.
// On submit, navigates to /products?q=... so the product list filters.

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) {
      router.push('/products');
      return;
    }
    router.push(`/products?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form onSubmit={onSubmit} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search product by name or SKU…"
        className="w-full h-11 pl-10 pr-4 rounded-xl border bg-card text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </form>
  );
}
