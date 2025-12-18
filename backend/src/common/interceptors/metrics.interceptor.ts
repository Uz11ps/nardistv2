import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../../metrics/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.metricsService.recordResponseTime(duration);
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.metricsService.recordResponseTime(duration);
          
          const errorType = error.constructor?.name || 'UnknownError';
          this.metricsService.recordError(errorType);
        },
      }),
    );
  }
}

