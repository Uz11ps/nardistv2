import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { CityService } from './city.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDto } from '../auth/dto/user.dto';

@Controller('city')
@UseGuards(JwtAuthGuard)
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Get()
  async getCity(@CurrentUser() user: UserDto) {
    return this.cityService.getUserCity(user.id);
  }

  @Post('collect')
  async collectIncome(
    @CurrentUser() user: UserDto,
    @Body('buildingType') buildingType: string,
  ) {
    return this.cityService.collectIncome(user.id, buildingType);
  }

  @Post('upgrade')
  async upgradeBuilding(
    @CurrentUser() user: UserDto,
    @Body('buildingType') buildingType: string,
  ) {
    return this.cityService.upgradeBuilding(user.id, buildingType);
  }
}

