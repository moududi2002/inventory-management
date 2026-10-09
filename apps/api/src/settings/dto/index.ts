// apps/api/src/settings/dto/index.ts

// Re-export shared Zod schema/type from @inventory/validation.

import {
  updateSettingsSchema,
  type UpdateSettingsInput as SharedUpdateSettingsInput,
} from '@inventory/validation';

export { updateSettingsSchema };
export type UpdateSettingsInput = SharedUpdateSettingsInput;
