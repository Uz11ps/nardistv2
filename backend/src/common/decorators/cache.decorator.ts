import { SetMetadata } from '@nestjs/common';

export const CACHE_TTL_KEY = 'cache_ttl';
export const CACHE_KEY_PREFIX = 'cache_key_prefix';

/**
 * Декоратор для кэширования результатов метода
 */
export const Cache = (ttl: number = 60, keyPrefix?: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_TTL_KEY, ttl)(target, propertyKey, descriptor);
    if (keyPrefix) {
      SetMetadata(CACHE_KEY_PREFIX, keyPrefix)(target, propertyKey, descriptor);
    }
  };
};

