import { IsNumber, IsString, IsOptional, IsEnum, IsDateString, Min } from 'class-validator';

export class CreateListingDto {
  @IsOptional()
  @IsNumber()
  inventoryItemId?: number;

  @IsOptional()
  @IsNumber()
  skinId?: number;

  @IsNumber()
  @Min(1)
  price: number;

  @IsEnum(['FIXED', 'AUCTION'])
  type: 'FIXED' | 'AUCTION';

  @IsOptional()
  @IsDateString()
  auctionEnd?: string;
}

