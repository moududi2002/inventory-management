// apps/web/src/hooks/use-settings.ts

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api, getApiErrorMessage } from '@/lib/api';
import type { Settings, UpdateSettingsInput } from '@inventory/types';

const SETTINGS_KEY = ['settings'] as const;

// ---------- Get ----------
export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: async () => {
      const res = await api.get<{
        success: true;
        data: { settings: Settings };
      }>('/settings');
      return res.data.data.settings;
    },
    staleTime: 60_000,
  });
}

// ---------- Update ----------
export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateSettingsInput) => {
      const res = await api.patch<{
        success: true;
        data: { settings: Settings };
      }>('/settings', input);
      return res.data.data.settings;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SETTINGS_KEY });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
