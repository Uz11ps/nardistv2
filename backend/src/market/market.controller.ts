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
import { UserDto } from '../auth/dto/user.dto';
import { CreateListingDto } from './dto/create-listing.dto';
import { PlaceBidDto } from './dto/place-bid.dto';

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
    @CurrentUser() user: UserDto,
    @Body() data: CreateListingDto,
  ) {
    return this.marketService.createListing({
      userId: user.id,
      ...data,
      auctionEnd: data.auctionEnd ? new Date(data.auctionEnd) : undefined,
    });
  }

  @Post(':id/buy')
  async buyItem(@CurrentUser() user: UserDto, @Param('id') id: string) {
    return this.marketService.buyItem(user.id, parseInt(id));
  }

  @Post(':id/bid')
  async placeBid(
    @CurrentUser() user: UserDto,
    @Param('id') id: string,
    @Body() data: PlaceBidDto,
  ) {
    return this.marketService.placeBid(user.id, parseInt(id), data.bidAmount);
  }

  @Post(':id/cancel')
  async cancelListing(@CurrentUser() user: UserDto, @Param('id') id: string) {
    return this.marketService.cancelListing(user.id, parseInt(id));
  }
}

