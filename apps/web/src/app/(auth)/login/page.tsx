// apps/web/src/app/(auth)/login/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { LogIn, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { api, getApiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { loginSchema, type LoginInput } from '@inventory/validation';
import type { LoginResponse } from '@inventory/types';

// ---------- Inline minimal UI (shadcn components come in Step 17) ----------

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: async (input: LoginInput) => {
      const res = await api.post<{ success: true; data: LoginResponse }>(
        '/auth/login',
        input,
      );
      return res.data.data;
    },
    onSuccess: (data) => {
      login({ user: data.user, token: data.token });
      toast.success(`Welcome back, ${data.user.name}`);
      router.replace('/dashboard');
    },
    onError: (err) => {
      setFormError(getApiErrorMessage(err));
    },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    mutation.mutate(values);
  });

  const loading = mutation.isPending || isSubmitting;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/40">
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-sm border p-6 space-y-6">
        {/* ---------- Header ---------- */}
        <div className="text-center space-y-1">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
            📦
          </div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your stock
          </p>
        </div>

        {/* ---------- Form ---------- */}
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@example.com"
              disabled={loading}
              {...register('email')}
              className="w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={loading}
              {...register('password')}
              className="w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {formError && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                <LogIn className="size-4" />
                Sign in
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Single-admin access · Contact owner for account recovery
        </p>
      </div>
    </div>
  );
}
