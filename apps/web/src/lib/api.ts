// apps/web/src/lib/api.ts

// Axios instance with:
//   - baseURL from NEXT_PUBLIC_API_URL
//   - Automatic Bearer token from localStorage
//   - 401 → clear token + redirect to /login
//
// IMPORTANT: We read localStorage lazily on each request — so token changes
// (login/logout) apply immediately without re-creating the client.

import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const TOKEN_KEY = 'inventory.token';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
});

// ---------- Request interceptor: attach token ----------
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ---------- Response interceptor: 401 handling ----------
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      // Don't redirect if we're already on the login page.
      !window.location.pathname.startsWith('/login')
    ) {
      window.localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// ---------- Helpers to extract error messages ----------

interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string[]>;
}

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(err)) {
    const body = err.response?.data;
    if (body?.errors) {
      const first = Object.values(body.errors)[0];
      if (first && first.length > 0) return first[0];
    }
    if (body?.message) return body.message;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}
