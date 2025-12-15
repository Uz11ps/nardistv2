import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ClansService } from './clans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDto } from '../auth/dto/user.dto';

@Controller('clans')
@UseGuards(JwtAuthGuard)
export class ClansController {
  constructor(private readonly clansService: ClansService) {}

  @Get()
  async getAllClans() {
    return this.clansService.getAllClans();
  }

  @Get('my')
  async getMyClan(@CurrentUser() user: UserDto) {
    return this.clansService.getUserClan(user.id);
  }

  @Get(':id')
  async getClanById(@Param('id') id: string) {
    return this.clansService.getClanById(parseInt(id));
  }

  @Post('create')
  async createClan(
    @CurrentUser() user: UserDto,
    @Body() data: { name: string; description?: string },
  ) {
    return this.clansService.createClan(user.id, data);
  }

  @Post(':id/join')
  async joinClan(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
  ) {
    return this.clansService.joinClan(user.id, parseInt(id));
  }

  @Post(':id/leave')
  async leaveClan(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
  ) {
    return this.clansService.leaveClan(user.id, parseInt(id));
  }

  @Post(':id/member/:memberId/role')
  async changeMemberRole(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() data: { role: string },
  ) {
    return this.clansService.changeMemberRole(
      user.id,
      parseInt(id),
      parseInt(memberId),
      data.role,
    );
  }

  @Post(':id/distribute')
  async distributeTreasury(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Body() data: { amount: number; recipientId: number },
  ) {
    return this.clansService.distributeTreasury(
      user.id,
      parseInt(id),
      data.amount,
      data.recipientId,
    );
  }

  @Get(':id/district-funds')
  async getDistrictFunds(@Param('id') id: string) {
    return this.clansService.getDistrictFunds(parseInt(id));
  }

  @Post(':id/district-funds/:districtId/distribute')
  async distributeDistrictFund(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Param('districtId') districtId: string,
    @Body() data: { amount: number; clanShare?: number }, // clanShare: доля для казны (0-1), остальное участникам
  ) {
    return this.clansService.distributeDistrictFund(
      user.id,
      parseInt(id),
      parseInt(districtId),
      data.amount,
      data.clanShare,
    );
  }

  @Post(':id/member/:memberId/kick')
  async kickMember(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.clansService.kickMember(user.id, parseInt(id), parseInt(memberId));
  }

  @Post(':id/update')
  async updateClan(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Body() data: { name?: string; description?: string },
  ) {
    return this.clansService.updateClan(user.id, parseInt(id), data);
  }
}

