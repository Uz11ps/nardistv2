export class UserDto {
  id: number;
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode: string;
  isPremium: boolean;
  photoUrl?: string;
  nickname?: string;
  country?: string;
  avatar?: string;
  level: number;
  xp: number;
  narCoin: number;
  energy: number;
  energyMax: number;
  lives: number;
  livesMax: number;
  power: number;
  powerMax: number;
  statsEconomy: number;
  statsEnergy: number;
  statsLives: number;
  statsPower: number;
  referralCode: string;
  referredBy?: number;
  createdAt: Date;
  updatedAt: Date;
}

