// apps/web/src/stores/auth-store.ts

'use client';

// Zustand auth store — token + user + hydration.
// The token also lives in localStorage (managed by lib/auth.ts);
// this store keeps an in-memory copy for reactivity.

import { create } from 'zustand';

import type { User } from '@inventory/types';
import { clearToken, getToken, setToken } from '@/lib/auth';

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  hydrated: boolean;

  // Actions
  hydrate: () => void;
  login: (params: { user: User; token: string }) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  hydrated: false,

  // Called once on app boot (from AuthProvider) — reads token from storage.
  hydrate: () => {
    const token = getToken();
    set({ token, hydrated: true });
  },

  login: ({ user, token }) => {
    setToken(token);
    set({ user, token, hydrated: true });
  },

  logout: () => {
    clearToken();
    set({ user: null, token: null });
  },

  setUser: (user) => set({ user }),
}));
