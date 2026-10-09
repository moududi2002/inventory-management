// apps/web/src/components/sales/receipt-preview.tsx

'use client';

// Renders the HTML receipt inside an iframe.
// The iframe fetches the receipt HTML directly from the API (with JWT).

import { useEffect, useState } from 'react';
import { Download, ExternalLink, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api, getApiErrorMessage } from '@/lib/api';
import { toast } from 'sonner';

interface ReceiptPreviewProps {
  saleIdOrObjectId: string;
  /** Where the sale ObjectId starts; also used to compose the PDF URL. */
  saleIdForDisplay: string;
}

export function ReceiptPreview({ saleIdOrObjectId }: ReceiptPreviewProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<string>(`/sales/${saleIdOrObjectId}/receipt`, {
        responseType: 'text',
        headers: { Accept: 'text/html' },
        // Override default JSON parsing
        transformResponse: [(data) => data],
      })
      .then((res) => {
        if (!cancelled) setHtml(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(getApiErrorMessage(err));
          setHtml(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [saleIdOrObjectId]);

  const downloadPdf = async () => {
    try {
      const res = await api.get(`/sales/${saleIdOrObjectId}/receipt.pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${saleIdOrObjectId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const print = () => {
    if (!html) return;
    const w = window.open('', '_blank');
    if (!w) {
      toast.error('Popup blocked — allow popups to print');
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    // Give a moment for the browser to render, then print.
    setTimeout(() => w.print(), 300);
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={print}
          disabled={!html}
        >
          <Printer className="mr-2 size-4" />
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={downloadPdf}>
          <Download className="mr-2 size-4" />
          PDF
        </Button>
        <Button asChild variant="outline" size="sm">
            <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/sales/${saleIdOrObjectId}/receipt`}
                target="_blank"
                rel="noreferrer"
            >
                <ExternalLink className="mr-2 size-4" />
                Open
            </a>
            </Button>
      </div>

      {/* Iframe */}
      <div className="rounded-xl border bg-muted/30 overflow-hidden">
        {loading ? (
          <div className="p-4">
            <Skeleton className="h-[420px] rounded-lg" />
          </div>
        ) : html ? (
          <iframe
            title="Receipt"
            srcDoc={html}
            className="w-full h-[520px] bg-white"
            sandbox="allow-same-origin"
          />
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Receipt unavailable
          </div>
        )}
      </div>
    </div>
  );
}
