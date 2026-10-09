// apps/web/src/app/(dashboard)/settings/profile/page.tsx

'use client';

// Profile page — read-only account info + sign out.
// Reuses AccountSection from settings and shows a few account stats.

import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, User as UserIcon, ShieldCheck, Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AccountSection } from '@/components/settings/account-section';
import { useAuth } from '@/providers/auth-provider';
import { formatDateTime } from '@/lib/format';

function getInitials(name: string | undefined): string {
  if (!name) return 'A';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
}

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="space-y-4 max-w-2xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="-ml-2"
      >
        <ArrowLeft className="mr-1 size-4" />
        Back
      </Button>

      <PageHeader
        title="Profile"
        description="Your account information"
      />

      {/* ---------- Profile summary ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="text-base font-semibold truncate">
                {user?.name ?? 'Admin'}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {user?.email ?? ''}
              </div>
            </div>
          </div>

          <dl className="divide-y border-t">
            <div className="flex items-center justify-between py-3 text-sm">
              <dt className="text-muted-foreground flex items-center gap-2">
                <Mail className="size-4" />
                Email
              </dt>
              <dd className="font-medium truncate max-w-[60%]">
                {user?.email ?? '—'}
              </dd>
            </div>

            <div className="flex items-center justify-between py-3 text-sm">
              <dt className="text-muted-foreground flex items-center gap-2">
                <UserIcon className="size-4" />
                Role
              </dt>
              <dd className="font-medium">Admin</dd>
            </div>

            <div className="flex items-center justify-between py-3 text-sm">
              <dt className="text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="size-4" />
                Status
              </dt>
              <dd className="font-medium text-emerald-600 dark:text-emerald-500">
                Active
              </dd>
            </div>

            <div className="flex items-center justify-between py-3 text-sm">
              <dt className="text-muted-foreground flex items-center gap-2">
                <Calendar className="size-4" />
                Last login
              </dt>
              <dd className="font-medium">
                {user?.lastLoginAt ? formatDateTime(user.lastLoginAt) : '—'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* ---------- Sign out (reused from settings) ---------- */}
      <AccountSection />
    </div>
  );
}
