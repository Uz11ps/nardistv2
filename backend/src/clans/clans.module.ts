import { Module } from '@nestjs/common';
import { ClansService } from './clans.service';
import { ClansController } from './clans.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [ClansService],
  controllers: [ClansController],
  exports: [ClansService],
})
export class ClansModule {}

