// apps/web/src/components/settings/account-section.tsx

'use client';

// Read-only account info + sign-out.

import { useRouter } from 'next/navigation';
import { LogOut, Mail, User as UserIcon, Calendar } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/providers/auth-provider';
import { useAuthStore } from '@/stores/auth-store';
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

export function AccountSection() {
  const router = useRouter();
  const { user } = useAuth();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    toast.success('Signed out');
    router.replace('/login');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Profile */}
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">
              {user?.name ?? 'Admin'}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {user?.email ?? ''}
            </div>
          </div>
        </div>

        {/* Info rows */}
        <dl className="divide-y border-t">
          <div className="flex items-center justify-between py-2.5 text-sm">
            <dt className="text-muted-foreground flex items-center gap-2">
              <Mail className="size-4" />
              Email
            </dt>
            <dd className="font-medium truncate max-w-[60%]">
              {user?.email ?? '—'}
            </dd>
          </div>
          <div className="flex items-center justify-between py-2.5 text-sm">
            <dt className="text-muted-foreground flex items-center gap-2">
              <UserIcon className="size-4" />
              Role
            </dt>
            <dd className="font-medium">Admin</dd>
          </div>
          <div className="flex items-center justify-between py-2.5 text-sm">
            <dt className="text-muted-foreground flex items-center gap-2">
              <Calendar className="size-4" />
              Last login
            </dt>
            <dd className="font-medium">
              {user?.lastLoginAt ? formatDateTime(user.lastLoginAt) : '—'}
            </dd>
          </div>
        </dl>

        {/* Sign out */}
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full text-destructive hover:text-destructive"
        >
          <LogOut className="mr-2 size-4" />
          Sign out
        </Button>
      </CardContent>
    </Card>
  );
}
