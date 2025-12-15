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
import { UserDto } from '../auth/dto/user.dto';

@Controller('businesses')
@UseGuards(JwtAuthGuard)
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get('my')
  async getMyBusinesses(@CurrentUser() user: UserDto) {
    return this.businessesService.getUserBusinesses(user.id);
  }

  @Get('district/:districtId')
  async getDistrictBusinesses(@Param('districtId') districtId: string) {
    return this.businessesService.getDistrictBusinesses(parseInt(districtId));
  }

  @Post('create')
  async createBusiness(
    @CurrentUser() user: UserDto,
    @Body() data: { districtId: number; type: string },
  ) {
    return this.businessesService.createBusiness({
      userId: user.id,
      ...data,
    });
  }

  @Post(':id/collect')
  async collectIncome(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
  ) {
    return this.businessesService.collectIncome(user.id, parseInt(id));
  }

  @Post(':id/upgrade')
  async upgradeBusiness(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
  ) {
    return this.businessesService.upgradeBusiness(user.id, parseInt(id));
  }

  @Post(':id/produce')
  async produceResources(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
  ) {
    return this.businessesService.produceResources(user.id, parseInt(id));
  }

  @Post(':id/collect-resources')
  async collectResources(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Body() data: { amount: number },
  ) {
    return this.businessesService.collectResources(
      user.id,
      parseInt(id),
      data.amount,
    );
  }

  @Get(':id/craft-recipes')
  async getCraftRecipes(@Param('id') id: string) {
    return this.businessesService.getCraftRecipes(parseInt(id));
  }

  @Post(':id/craft')
  async craftSkin(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Body() data: { skinId: number },
  ) {
    return this.businessesService.craftSkin(user.id, parseInt(id), data.skinId);
  }

  @Get('repair/:itemType')
  async getRepairBusinesses(
    @Param('itemType') itemType: string,
    @Body() data?: { districtId?: number },
  ) {
    return this.businessesService.getRepairBusinesses(itemType, data?.districtId);
  }

  @Post(':id/repair')
  async repairItemAtBusiness(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Body() data: { itemId: number; repairType: 'PARTIAL' | 'FULL' },
  ) {
    return this.businessesService.repairItemAtBusiness(
      user.id,
      parseInt(id),
      data.itemId,
      data.repairType,
    );
  }

  @Get('jobs')
  async getAvailableJobs(@Body() data?: { districtId?: number }) {
    return this.businessesService.getAvailableJobs(data?.districtId);
  }

  @Post(':id/work')
  async workAtBusiness(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Body() data: { hours?: number },
  ) {
    return this.businessesService.workAtBusiness(user.id, parseInt(id), data.hours || 1);
  }

  @Post(':id/job-postings')
  async createJobPosting(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Body() data: {
      title: string;
      description?: string;
      salaryPerHour: number;
      energyPerHour?: number;
      maxWorkers?: number;
    },
  ) {
    return this.businessesService.createJobPosting(parseInt(id), user.id, data);
  }

  @Get(':id/job-postings')
  async getBusinessJobPostings(@Param('id') id: string) {
    return this.businessesService.getBusinessJobPostings(parseInt(id));
  }

  @Get('district/:districtId/job-postings')
  async getDistrictJobPostings(@Param('districtId') districtId: string) {
    return this.businessesService.getDistrictJobPostings(parseInt(districtId));
  }

  @Post('job-postings/:jobId/apply')
  async applyForJob(
    @CurrentUser() user: UserDto,
    @Param('jobId') jobId: string,
  ) {
    return this.businessesService.applyForJob(parseInt(jobId), user.id);
  }

  @Post('job-postings/:jobId/work')
  async workAtJob(
    @CurrentUser() user: UserDto,
    @Param('jobId') jobId: string,
    @Body() data: { hours?: number },
  ) {
    return this.businessesService.workAtJob(parseInt(jobId), user.id, data.hours || 1);
  }

  @Post('job-postings/:jobId/delete')
  async deleteJobPosting(
    @CurrentUser() user: UserDto,
    @Param('jobId') jobId: string,
  ) {
    return this.businessesService.deleteJobPosting(parseInt(jobId), user.id);
  }
}

