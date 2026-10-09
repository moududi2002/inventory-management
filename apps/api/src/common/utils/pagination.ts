// Shared pagination helpers.
// Every list endpoint uses these to produce a consistent response shape.

import type { PaginatedResponse } from '@inventory/types';

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function getPaginationParams(input: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): PaginationParams {
  return {
    page: input.page && input.page > 0 ? input.page : 1,
    limit: input.limit && input.limit > 0 ? Math.min(input.limit, 100) : 20,
    sortBy: input.sortBy ?? 'createdAt',
    sortOrder: input.sortOrder ?? 'desc',
  };
}

export function getSkip({ page, limit }: PaginationParams): number {
  return (page - 1) * limit;
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams,
): PaginatedResponse<T> {
  const totalPages = Math.max(1, Math.ceil(total / params.limit));
  return {
    data,
    meta: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
}
