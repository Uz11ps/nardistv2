import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class ThrottleGuard implements CanActivate {
  constructor(private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection.remoteAddress;
    const key = `throttle:${ip}`;

    // Получаем текущее количество запросов
    const current = await this.redis.get(key);
    const count = current ? parseInt(current, 10) : 0;

    // Лимит: 100 запросов в минуту
    const limit = 100;
    const window = 60; // секунды

    if (count >= limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests, please try again later',
          retryAfter: window,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Увеличиваем счетчик
    if (count === 0) {
      await this.redis.set(key, '1', window);
    } else {
      await this.redis.getClient().incr(key);
    }

    return true;
  }
}

