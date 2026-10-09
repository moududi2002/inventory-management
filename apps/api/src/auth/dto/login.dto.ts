// apps/api/src/auth/dto/login.dto.ts

// Re-export the shared Zod schema as the source of truth.
// We don't define a class-validator DTO — we use ZodValidationPipe instead.

import { loginSchema, type LoginInput } from '@inventory/validation';

export { loginSchema };
export type { LoginInput };
