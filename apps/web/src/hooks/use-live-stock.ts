// apps/web/src/hooks/use-live-stock.ts

'use client';

// Subscribes to all Socket.IO events and invalidates the matching
// TanStack Query caches. Mount once (e.g. in dashboard layout) — not per page.

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getSocket } from '@/lib/socket';

export function useLiveStock(): void {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = getSocket();

    const onStockUpdated = () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['product'] });
      qc.invalidateQueries({ queryKey: ['stock-transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    };

    const onSaleCreated = () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    };

    const onSaleReturned = () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['returns'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    };

    const onProductCreated = () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    };

    const onProductUpdated = () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['product'] });
    };

    const onProductDeleted = () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    };

    const onDashboardRefresh = () => {
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    };

    socket.on('stock:updated', onStockUpdated);
    socket.on('sale:created', onSaleCreated);
    socket.on('sale:returned', onSaleReturned);
    socket.on('product:created', onProductCreated);
    socket.on('product:updated', onProductUpdated);
    socket.on('product:deleted', onProductDeleted);
    socket.on('dashboard:refresh', onDashboardRefresh);

    return () => {
      socket.off('stock:updated', onStockUpdated);
      socket.off('sale:created', onSaleCreated);
      socket.off('sale:returned', onSaleReturned);
      socket.off('product:created', onProductCreated);
      socket.off('product:updated', onProductUpdated);
      socket.off('product:deleted', onProductDeleted);
      socket.off('dashboard:refresh', onDashboardRefresh);
    };
  }, [qc]);
}
