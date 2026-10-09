// apps/web/src/components/reports/export-button.tsx

'use client';

// Triggers CSV export from the backend.
// Downloads the file with a friendly name.

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { api, getApiErrorMessage } from '@/lib/api';

export type ExportType =
  | 'sales'
  | 'profit'
  | 'stock-movement'
  | 'low-stock'
  | 'out-of-stock'
  | 'top-selling'
  | 'dead-stock'
  | 'category-stock'
  | 'daily-summary';

interface ExportButtonProps {
  type: ExportType;
  params?: {
    from?: string;
    to?: string;
    productId?: string;
    categoryId?: string;
    days?: number;
  };
  disabled?: boolean;
}

export function ExportButton({ type, params, disabled }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const download = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/export', {
        params: { type, ...params },
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success('CSV downloaded');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={download}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Exporting…
        </>
      ) : (
        <>
          <Download className="mr-2 size-4" />
          CSV
        </>
      )}
    </Button>
  );
}
