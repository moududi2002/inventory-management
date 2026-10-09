// apps/api/src/uploads/uploads.module.ts

import { Module } from '@nestjs/common';

import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
