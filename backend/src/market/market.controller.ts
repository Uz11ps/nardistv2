import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MarketService } from './market.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('market')
@UseGuards(JwtAuthGuard)
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get()
  async getListings(
    @Query('type') type?: string,
    @Query('skinType') skinType?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    return this.marketService.getActiveListings({
      type,
      skinType,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
    });
  }

  @Post('create')
  async createListing(
    @CurrentUser() user: any,
    @Body()
    data: {
      inventoryItemId?: number;
      skinId?: number;
      price: number;
      type: 'FIXED' | 'AUCTION';
      auctionEnd?: string;
    },
  ) {
    return this.marketService.createListing({
      userId: user.id,
      ...data,
      auctionEnd: data.auctionEnd ? new Date(data.auctionEnd) : undefined,
    });
  }

  @Post(':id/buy')
  async buyItem(@CurrentUser() user: any, @Param('id') id: string) {
    return this.marketService.buyItem(user.id, parseInt(id));
  }

  @Post(':id/bid')
  async placeBid(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: { bidAmount: number },
  ) {
    return this.marketService.placeBid(user.id, parseInt(id), data.bidAmount);
  }

  @Post(':id/cancel')
  async cancelListing(@CurrentUser() user: any, @Param('id') id: string) {
    return this.marketService.cancelListing(user.id, parseInt(id));
  }
}

