// apps/api/src/receipts/receipts.module.ts

import { Module } from '@nestjs/common';

import { ReceiptsService } from './receipts.service';
import { ReceiptsController } from './receipts.controller';
import { SalesModule } from '../sales/sales.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SalesModule, SettingsModule],
  controllers: [ReceiptsController],
  providers: [ReceiptsService],
  exports: [ReceiptsService],
})
export class ReceiptsModule {}
