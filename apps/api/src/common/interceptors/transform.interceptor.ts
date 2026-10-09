// Wraps every successful controller return value in a standard envelope:
// { success: true, data: <original>, message?: string }

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface TransformedResponse<T> {
  success: true;
  data: T;
  message?: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, TransformedResponse<T>>
{
  intercept(
    _ctx: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<TransformedResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If controller already returned { success, data } style, keep it.
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          (data as Record<string, unknown>).success === true
        ) {
          return data as unknown as TransformedResponse<T>;
        }
        return { success: true, data };
      }),
    );
  }
}
