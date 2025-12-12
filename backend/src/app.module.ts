import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { ConfigModule } from './config/config.module';
import { AuthModule } from './auth/auth.module';
import { GamesModule } from './games/games.module';
import { UsersModule } from './users/users.module';
import { RatingsModule } from './ratings/ratings.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { ReferralsModule } from './referrals/referrals.module';
import { GameHistoryModule } from './game-history/game-history.module';
import { QuestsModule } from './quests/quests.module';
import { CityModule } from './city/city.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { AcademyModule } from './academy/academy.module';
import { AdminModule } from './admin/admin.module';
import { EconomyModule } from './economy/economy.module';
import { DistrictsModule } from './districts/districts.module';
import { BusinessesModule } from './businesses/businesses.module';
import { ClansModule } from './clans/clans.module';
import { ResourcesModule } from './resources/resources.module';
import { InventoryModule } from './inventory/inventory.module';
import { MarketModule } from './market/market.module';
import { SiegesModule } from './sieges/sieges.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    AuthModule,
    GamesModule,
    UsersModule,
    RatingsModule,
    TournamentsModule,
    ReferralsModule,
    GameHistoryModule,
    QuestsModule,
    CityModule,
    SubscriptionModule,
    AcademyModule,
    AdminModule,
    EconomyModule,
    DistrictsModule,
    BusinessesModule,
    ClansModule,
    ResourcesModule,
    InventoryModule,
    MarketModule,
    SiegesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

