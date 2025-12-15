import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDto } from '../auth/dto/user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpgradeStatDto } from './dto/upgrade-stat.dto';
import { RestoreResourceDto } from './dto/restore-resource.dto';

// Swagger декораторы
let ApiTags: any, ApiOperation: any, ApiResponse: any, ApiBearerAuth: any;
try {
  const swagger = require('@nestjs/swagger');
  ApiTags = swagger.ApiTags;
  ApiOperation = swagger.ApiOperation;
  ApiResponse = swagger.ApiResponse;
  ApiBearerAuth = swagger.ApiBearerAuth;
} catch {
  ApiTags = () => () => {};
  ApiOperation = () => () => {};
  ApiResponse = () => () => {};
  ApiBearerAuth = () => () => {};
}

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: UserDto) {
    return this.usersService.getProfile(user.id);
  }

  @Put('profile')
  async updateProfile(
    @CurrentUser() user: UserDto,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Get('stats')
  async getStats(@CurrentUser() user: UserDto) {
    return this.usersService.getStats(user.id);
  }

  @Post('upgrade-stat')
  async upgradeStat(
    @CurrentUser() user: UserDto,
    @Body() data: UpgradeStatDto,
  ) {
    return this.usersService.upgradeStat(user.id, data.statType);
  }

  @Post('restore-energy')
  async restoreEnergy(
    @CurrentUser() user: UserDto,
    @Body() data?: RestoreResourceDto,
  ) {
    return this.usersService.restoreEnergy(user.id, data?.amount);
  }

  @Post('restore-lives')
  async restoreLives(
    @CurrentUser() user: UserDto,
    @Body() data?: RestoreResourceDto,
  ) {
    return this.usersService.restoreLives(user.id, data?.amount);
  }
}

