import { Controller, Get, Param, Query } from '@nestjs/common';
import { AcademyService } from './academy.service';

@Controller('academy')
export class AcademyController {
  constructor(private readonly academyService: AcademyService) {}

  @Get('articles')
  async getArticles(@Query('category') category?: string) {
    return this.academyService.getArticles(category);
  }

  @Get('articles/:id')
  async getArticle(@Param('id') id: string) {
    return this.academyService.getArticle(parseInt(id, 10));
  }
}

