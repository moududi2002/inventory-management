// apps/api/src/websocket/events.gateway.ts

// Socket.IO gateway. Namespace: /live
//
// The frontend connects to  ws://<host>/live
// and listens for typed events (see @inventory/types → ServerToClientEvents).
//
// Server → client only. We do not accept client → server events for now.
// Every mutation service calls one of the emitX() helpers below.

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

import {
  SOCKET_NAMESPACE,
  type StockUpdatedPayload,
  type SaleCreatedPayload,
  type SaleReturnedPayload,
  type ProductCreatedPayload,
  type ProductUpdatedPayload,
  type ProductDeletedPayload,
  type DashboardRefreshPayload,
} from '@inventory/types';

@WebSocketGateway({
  namespace: SOCKET_NAMESPACE, // "/live"
  cors: {
    // Allow frontend origin(s). Same list as HTTP CORS (comma-separated env).
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
      .split(',')
      .map((s) => s.trim()),
    credentials: true,
  },
  // Small optimization — shorter polling phase, then upgrade to WS.
  transports: ['websocket', 'polling'],
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server!: Server;

  // ---------- Lifecycle ----------

  afterInit(): void {
    this.logger.log(`🔌 Socket.IO gateway ready on namespace ${SOCKET_NAMESPACE}`);
  }

  handleConnection(client: Socket): void {
    this.logger.log(`✅ Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`❌ Client disconnected: ${client.id}`);
  }

  // ---------- Emit helpers ----------

  // Fires when a product's stock changes (STOCK_IN, SALE, ADJUSTMENT, RETURN).
  emitStockUpdated(payload: StockUpdatedPayload): void {
    this.emit('stock:updated', payload);
  }

  // Fires when a new sale is created.
  emitSaleCreated(payload: SaleCreatedPayload): void {
    this.emit('sale:created', payload);
  }

  // Fires when a sale return is recorded.
  emitSaleReturned(payload: SaleReturnedPayload): void {
    this.emit('sale:returned', payload);
  }

  // Product lifecycle events.
  emitProductCreated(payload: ProductCreatedPayload): void {
    this.emit('product:created', payload);
  }

  emitProductUpdated(payload: ProductUpdatedPayload): void {
    this.emit('product:updated', payload);
  }

  emitProductDeleted(payload: ProductDeletedPayload): void {
    this.emit('product:deleted', payload);
  }

  // Generic "please refresh the dashboard" ping.
  emitDashboardRefresh(payload: DashboardRefreshPayload = { reason: 'mutation' }): void {
    this.emit('dashboard:refresh', payload);
  }

  // ---------- Internal ----------

  private emit(event: string, payload: unknown): void {
    if (!this.server) {
      // Gateway not initialized yet — silently skip (shouldn't happen post-bootstrap).
      this.logger.warn(`Emit attempted before server init: ${event}`);
      return;
    }
    this.server.emit(event, payload);
  }
}
