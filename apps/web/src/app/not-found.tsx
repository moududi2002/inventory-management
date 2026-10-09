// apps/web/src/app/not-found.tsx

import Link from 'next/link';
import { Home, PackageX } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="max-w-md w-full bg-card border rounded-2xl p-6 text-center space-y-4">
        <div className="mx-auto size-12 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
          <PackageX className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">404</h1>
          <p className="text-sm text-muted-foreground mt-1">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard">
            <Home className="mr-2 size-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
