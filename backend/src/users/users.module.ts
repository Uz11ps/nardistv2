import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheService } from '../common/services/cache.service';
import { RedisModule } from '../redis/redis.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule, RedisModule],
  controllers: [UsersController],
  providers: [UsersService, CacheService],
  exports: [UsersService],
})
export class UsersModule {}

