// apps/web/src/lib/socket.ts

// Singleton Socket.IO client.
// One connection per browser tab — reused by every hook.

'use client';

import { io, type Socket } from 'socket.io-client';
import { SOCKET_NAMESPACE, type ServerToClientEvents } from '@inventory/types';

let socket: Socket<ServerToClientEvents> | null = null;

export function getSocket(): Socket<ServerToClientEvents> {
  if (socket && socket.connected) return socket;

  // Reuse existing (possibly connecting) instance.
  if (socket) return socket;

  const baseUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

  socket = io(`${baseUrl}${SOCKET_NAMESPACE}`, {
    transports: ['websocket', 'polling'],
    // Reconnection is on by default — keep defaults, just tune delays.
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    autoConnect: true,
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
