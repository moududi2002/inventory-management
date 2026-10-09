// Zod validation pipe.
// Usage:  @Body(new ZodValidationPipe(createProductSchema)) dto: CreateProductInput
//         @Query(new ZodValidationPipe(productQuerySchema)) query: ProductQueryInput

import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        // Convert Zod issues into a friendly field -> messages map
        const errors: Record<string, string[]> = {};
        for (const issue of error.errors) {
          const path = issue.path.join('.') || '_';
          if (!errors[path]) errors[path] = [];
          errors[path].push(issue.message);
        }
        throw new BadRequestException({
          message: 'Validation failed',
          errors,
        });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}
