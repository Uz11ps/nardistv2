import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Управление пользователями
  @Get('users')
  async getUsers(@Query('page') page: string = '1', @Query('limit') limit: string = '20') {
    return this.adminService.getUsers(parseInt(page, 10), parseInt(limit, 10));
  }

  @Put('users/:id/ban')
  async banUser(@Param('id') id: string) {
    return this.adminService.banUser(parseInt(id, 10));
  }

  @Put('users/:id/unban')
  async unbanUser(@Param('id') id: string) {
    return this.adminService.unbanUser(parseInt(id, 10));
  }

  // Управление турнирами
  @Post('tournaments')
  async createTournament(@Body() data: any) {
    return this.adminService.createTournament(data);
  }

  @Put('tournaments/:id/start')
  async startTournament(@Param('id') id: string) {
    return this.adminService.startTournament(parseInt(id, 10));
  }

  @Put('tournaments/:id/finish')
  async finishTournament(@Param('id') id: string) {
    return this.adminService.finishTournament(parseInt(id, 10));
  }

  // Управление статьями
  @Get('articles')
  async getArticles() {
    return this.adminService.getArticles();
  }

  @Post('articles')
  async createArticle(@Body() data: any) {
    return this.adminService.createArticle(data);
  }

  @Put('articles/:id')
  async updateArticle(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateArticle(parseInt(id, 10), data);
  }

  @Delete('articles/:id')
  async deleteArticle(@Param('id') id: string) {
    return this.adminService.deleteArticle(parseInt(id, 10));
  }

  // Управление скинами
  @Get('skins')
  async getSkins() {
    return this.adminService.getSkins();
  }

  @Post('skins')
  async createSkin(@Body() data: any) {
    return this.adminService.createSkin(data);
  }
}

