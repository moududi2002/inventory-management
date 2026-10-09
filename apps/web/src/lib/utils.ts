// apps/web/src/lib/utils.ts

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Standard shadcn "cn" helper — merges Tailwind classes with conflict resolution.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
