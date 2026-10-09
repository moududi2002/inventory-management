// apps/web/src/providers/auth-provider.tsx

'use client';

// On mount:
//   - Reads token from localStorage
//   - If token exists, fetches /auth/me to hydrate the user
//   - If it fails (401), logs out and redirects to /login
//
// Exposes { user, loading } via context.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { User } from '@inventory/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const { user, token, hydrated, hydrate, setUser, logout } = useAuthStore();
  const [bootstrapping, setBootstrapping] = useState(true);

  // Hydrate token from localStorage once.
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Fetch /auth/me if we have a token but no user yet.
  const { data, isLoading, isError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: { user: User } }>(
        '/auth/me',
      );
      return res.data.data.user;
    },
    enabled: hydrated && !!token && !user,
    retry: false,
  });

  // Sync user when query returns.
  useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  // Handle auth errors → logout.
  useEffect(() => {
    if (isError) {
      logout();
    }
  }, [isError, logout]);

  // Mark bootstrapping done when:
  //   - hydrated AND
  //   - (no token OR user already present OR query settled)
  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      setBootstrapping(false);
      return;
    }
    if (user) {
      setBootstrapping(false);
      return;
    }
    if (!isLoading) {
      setBootstrapping(false);
    }
  }, [hydrated, token, user, isLoading]);

  // Route protection:
  //   - If on a protected route and no token → redirect to /login
  //   - If on /login and token exists → redirect to /dashboard
  useEffect(() => {
    if (bootstrapping) return;

    const isLoginRoute = pathname === '/login';
    const isPublicRoute = isLoginRoute;

    if (!token && !isPublicRoute) {
      router.replace('/login');
      return;
    }
    if (token && isLoginRoute) {
      router.replace('/dashboard');
    }
  }, [bootstrapping, token, pathname, router]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading: bootstrapping }),
    [user, bootstrapping],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
