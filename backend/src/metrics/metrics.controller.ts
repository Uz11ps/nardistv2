import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDto } from '../auth/dto/user.dto';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAllMetrics(@CurrentUser() user: UserDto) {
    return this.metricsService.getAllMetrics();
  }

  @Get('games')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getGameMetrics(@CurrentUser() user: UserDto) {
    return this.metricsService.getGameMetrics();
  }

  @Get('errors')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getErrorMetrics(@CurrentUser() user: UserDto) {
    return this.metricsService.getErrorMetrics();
  }

  @Get('performance')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getPerformanceMetrics(@CurrentUser() user: UserDto) {
    return this.metricsService.getPerformanceMetrics();
  }

  @Post('reset')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async resetMetrics(@CurrentUser() user: UserDto) {
    this.metricsService.resetMetrics();
    return { success: true, message: 'Metrics reset successfully' };
  }
}

