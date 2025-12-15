import { IsOptional, IsNumber, Min } from 'class-validator';

export class RestoreResourceDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;
}

