// apps/api/src/websocket/websocket.module.ts

// Global module so any service can inject EventsGateway without
// re-importing WebsocketModule in every feature module.

import { Global, Module } from '@nestjs/common';

import { EventsGateway } from './events.gateway';

@Global()
@Module({
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class WebsocketModule {}
