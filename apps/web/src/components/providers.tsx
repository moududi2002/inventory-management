// apps/web/src/components/providers.tsx

'use client';

// Composes all client-side providers so layout.tsx stays a Server Component.

import { Toaster } from 'sonner';

import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{ duration: 3500 }}
        />
      </AuthProvider>
    </QueryProvider>
  );
}
