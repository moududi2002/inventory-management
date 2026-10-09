// apps/web/src/app/error.tsx

'use client';

// Global error boundary — catches client-side runtime errors
// (server errors show up here if the page throws during render).

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface for debugging in dev; ship to an error tracker in prod later.
    // eslint-disable-next-line no-console
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="max-w-md w-full bg-card border rounded-2xl p-6 text-center space-y-4">
        <div className="mx-auto size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertTriangle className="size-6" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {error.message || 'An unexpected error occurred.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={() => reset()}>
            <RefreshCw className="mr-2 size-4" />
            Try again
          </Button>
          <Button asChild>
            <Link href="/dashboard">
              <Home className="mr-2 size-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
