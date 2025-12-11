import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { DistrictsService } from './districts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('districts')
@UseGuards(JwtAuthGuard)
export class DistrictsController {
  constructor(private readonly districtsService: DistrictsService) {}

  @Get()
  async getAllDistricts() {
    return this.districtsService.getAllDistricts();
  }

  @Get(':id')
  async getDistrictById(@Param('id') id: string) {
    return this.districtsService.getDistrictById(parseInt(id));
  }

  @Get('type/:type')
  async getDistrictByType(@Param('type') type: string) {
    return this.districtsService.getDistrictByType(type);
  }

  @Post('initialize')
  @Public()
  async initializeDistricts() {
    return this.districtsService.initializeDistricts();
  }
}

