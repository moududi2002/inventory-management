// apps/api/src/settings/settings.controller.ts

// HTTP endpoints for settings (singleton).
// All routes are protected by the global JWT guard.

import { Body, Controller, Get, Patch } from '@nestjs/common';

import { SettingsService } from './settings.service';
import {
  updateSettingsSchema,
  type UpdateSettingsInput,
} from './dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // GET /api/settings
  @Get()
  async get() {
    const doc = await this.settingsService.getOrCreate();
    return { settings: this.settingsService.toApiShape(doc) };
  }

  // PATCH /api/settings
  @Patch()
  async update(
    @Body(new ZodValidationPipe(updateSettingsSchema))
    dto: UpdateSettingsInput,
  ) {
    const updated = await this.settingsService.update(dto);
    return { settings: this.settingsService.toApiShape(updated) };
  }
}
