import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../../redis/redis.service';
import { CACHE_TTL_KEY, CACHE_KEY_PREFIX } from '../decorators/cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly redis: RedisService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    
    const ttl = this.reflector.get<number>(CACHE_TTL_KEY, handler);
    const keyPrefix = this.reflector.get<string>(CACHE_KEY_PREFIX, handler);

    // Если декоратор не применен, пропускаем кэширование
    if (!ttl) {
      return next.handle();
    }

    // Генерируем ключ кэша
    const cacheKey = this.generateCacheKey(request, keyPrefix);

    // Пытаемся получить из кэша
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return of(JSON.parse(cached));
    }

    // Выполняем запрос и кэшируем результат
    return next.handle().pipe(
      tap(async (data) => {
        await this.redis.set(cacheKey, JSON.stringify(data), ttl);
      }),
    );
  }

  private generateCacheKey(request: any, prefix?: string): string {
    const { method, url, query, params, user } = request;
    const keyParts = [
      prefix || 'cache',
      method.toLowerCase(),
      url,
      JSON.stringify(query),
      JSON.stringify(params),
      user?.id || 'anonymous',
    ];
    return keyParts.join(':');
  }
}

