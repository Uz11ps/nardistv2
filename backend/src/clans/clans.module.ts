import { Module } from '@nestjs/common';
import { ClansService } from './clans.service';
import { ClansController } from './clans.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { EconomyModule } from '../economy/economy.module';

@Module({
  imports: [DatabaseModule, AuthModule, EconomyModule],
  providers: [ClansService],
  controllers: [ClansController],
  exports: [ClansService],
})
export class ClansModule {}

