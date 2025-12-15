import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AcademyService } from './academy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDto } from '../auth/dto/user.dto';

@Controller('academy')
export class AcademyController {
  constructor(private readonly academyService: AcademyService) {}

  @Get('articles')
  async getArticles(@Query('category') category?: string) {
    return this.academyService.getArticles(category);
  }

  @Get('articles/:id')
  @UseGuards(JwtAuthGuard)
  async getArticle(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.academyService.getArticle(parseInt(id, 10), user?.id);
  }

  @Post('articles/:id/purchase-nar')
  @UseGuards(JwtAuthGuard)
  async purchaseArticleWithNAR(
    @Param('id') id: string,
    @CurrentUser() user: UserDto,
  ) {
    return this.academyService.purchaseArticleWithNAR(user.id, parseInt(id, 10));
  }

  @Post('articles/:id/purchase-crypto')
  @UseGuards(JwtAuthGuard)
  async purchaseArticleWithCrypto(
    @Param('id') id: string,
    @CurrentUser() user: UserDto,
    @Body() paymentData: Record<string, any>,
  ) {
    return this.academyService.purchaseArticleWithCrypto(user.id, parseInt(id, 10), paymentData);
  }
}

