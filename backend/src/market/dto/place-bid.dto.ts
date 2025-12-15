import { IsNumber, Min } from 'class-validator';

export class PlaceBidDto {
  @IsNumber()
  @Min(1)
  bidAmount: number;
}

