import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ScheduleModule.forRoot(),
    InventoryModule,
  ],
  controllers: [TournamentsController],
  providers: [TournamentsService],
  exports: [TournamentsService],
})
export class TournamentsModule {}

