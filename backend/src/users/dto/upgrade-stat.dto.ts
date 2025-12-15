import { IsEnum } from 'class-validator';

export class UpgradeStatDto {
  @IsEnum(['ECONOMY', 'ENERGY', 'LIVES', 'POWER'])
  statType: 'ECONOMY' | 'ENERGY' | 'LIVES' | 'POWER';
}

