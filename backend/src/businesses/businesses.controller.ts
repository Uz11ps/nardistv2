import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('businesses')
@UseGuards(JwtAuthGuard)
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get('my')
  async getMyBusinesses(@CurrentUser() user: any) {
    return this.businessesService.getUserBusinesses(user.id);
  }

  @Get('district/:districtId')
  async getDistrictBusinesses(@Param('districtId') districtId: string) {
    return this.businessesService.getDistrictBusinesses(parseInt(districtId));
  }

  @Post('create')
  async createBusiness(
    @CurrentUser() user: any,
    @Body() data: { districtId: number; type: string },
  ) {
    return this.businessesService.createBusiness({
      userId: user.id,
      ...data,
    });
  }

  @Post(':id/collect')
  async collectIncome(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.businessesService.collectIncome(user.id, parseInt(id));
  }

  @Post(':id/upgrade')
  async upgradeBusiness(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.businessesService.upgradeBusiness(user.id, parseInt(id));
  }

  @Post(':id/produce')
  async produceResources(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.businessesService.produceResources(user.id, parseInt(id));
  }

  @Post(':id/collect-resources')
  async collectResources(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: { amount: number },
  ) {
    return this.businessesService.collectResources(
      user.id,
      parseInt(id),
      data.amount,
    );
  }
}

