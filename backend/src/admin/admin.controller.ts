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

  @Post('users/:id/coins')
  async addCoins(@Param('id') id: string, @Body('amount') amount: number) {
    return this.adminService.addCoins(parseInt(id, 10), amount);
  }

  // Статистика
  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  // Последние игры для дашборда
  @Get('recent-games')
  async getRecentGames(@Query('limit') limit: string = '10') {
    return this.adminService.getRecentGames(parseInt(limit, 10));
  }

  // История игр
  @Get('games')
  async getGames(@Query('page') page: string = '1', @Query('limit') limit: string = '50') {
    return this.adminService.getGames(parseInt(page, 10), parseInt(limit, 10));
  }

  // Турниры
  @Get('tournaments')
  async getTournaments() {
    return this.adminService.getTournaments();
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

  // Настройки
  @Get('settings')
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Put('settings')
  async updateSettings(@Body() settings: any) {
    return this.adminService.updateSettings(settings);
  }

  // Управление квестами
  @Get('quests')
  async getQuests() {
    return this.adminService.getQuests();
  }

  @Get('quests/:id')
  async getQuestById(@Param('id') id: string) {
    return this.adminService.getQuestById(parseInt(id, 10));
  }

  @Post('quests')
  async createQuest(@Body() data: any) {
    return this.adminService.createQuest(data);
  }

  @Put('quests/:id')
  async updateQuest(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateQuest(parseInt(id, 10), data);
  }

  @Delete('quests/:id')
  async deleteQuest(@Param('id') id: string) {
    return this.adminService.deleteQuest(parseInt(id, 10));
  }

  // Управление конфигурацией предприятий
  @Get('business-configs')
  async getBusinessConfigs() {
    return this.adminService.getBusinessConfigs();
  }

  @Put('business-configs/:type')
  async updateBusinessConfig(
    @Param('type') type: string,
    @Body() config: any,
  ) {
    return this.adminService.updateBusinessConfig(type, config);
  }

  // Управление конфигурацией предприятий для конкретного района
  @Get('districts/:id/business-configs')
  async getBusinessConfigsForDistrict(@Param('id') id: string) {
    return this.adminService.getBusinessConfigsForDistrict(parseInt(id, 10));
  }

  @Put('districts/:id/business-configs/:type')
  async updateBusinessConfigForDistrict(
    @Param('id') id: string,
    @Param('type') type: string,
    @Body() config: any,
  ) {
    return this.adminService.updateBusinessConfigForDistrict(parseInt(id, 10), type, config);
  }

  // Управление районами
  @Get('districts')
  async getAllDistricts() {
    return this.adminService.getAllDistricts();
  }

  @Put('districts/:id')
  async updateDistrict(
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.adminService.updateDistrict(parseInt(id, 10), data);
  }
}

