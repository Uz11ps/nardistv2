import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { DatabaseModule } from '../database/database.module';
import { QuestsModule } from '../quests/quests.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, QuestsModule, AuthModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}

