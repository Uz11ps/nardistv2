import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  @Put('profile')
  async updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Get('stats')
  async getStats(@CurrentUser() user: any) {
    return this.usersService.getStats(user.id);
  }

  @Post('upgrade-stat')
  async upgradeStat(
    @CurrentUser() user: any,
    @Body() data: { statType: 'ECONOMY' | 'ENERGY' | 'LIVES' | 'POWER' },
  ) {
    return this.usersService.upgradeStat(user.id, data.statType);
  }

  @Post('restore-energy')
  async restoreEnergy(
    @CurrentUser() user: any,
    @Body() data?: { amount?: number },
  ) {
    return this.usersService.restoreEnergy(user.id, data?.amount);
  }

  @Post('restore-lives')
  async restoreLives(
    @CurrentUser() user: any,
    @Body() data?: { amount?: number },
  ) {
    return this.usersService.restoreLives(user.id, data?.amount);
  }
}

