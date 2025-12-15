import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDto } from '../auth/dto/user.dto';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('status')
  async getStatus(@CurrentUser() user: UserDto) {
    return this.onboardingService.getOnboardingStatus(user.id);
  }

  @Post('city-view')
  async markCityViewed(@CurrentUser() user: UserDto) {
    await this.onboardingService.completeCityView(user.id);
    return { success: true };
  }
}

