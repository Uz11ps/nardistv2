export interface User {
  id: number;
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  nickname?: string;
  country?: string;
  avatar?: string;
  photoUrl?: string;
  level: number;
  xp: number;
  narCoin: number;
  energy: number;
  energyMax: number;
  lives: number;
  livesMax: number;
  referralCode: string;
  isPremium: boolean;
}

export interface Rating {
  id: number;
  userId: number;
  mode: 'SHORT' | 'LONG';
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  user?: User;
}

export interface Tournament {
  id: number;
  name: string;
  description?: string;
  mode: 'SHORT' | 'LONG';
  format: 'BRACKET' | 'ROUND_ROBIN';
  status: 'UPCOMING' | 'IN_PROGRESS' | 'FINISHED';
  startDate: string;
  endDate?: string;
  maxParticipants?: number;
  participants?: TournamentParticipant[];
}

export interface TournamentParticipant {
  id: number;
  tournamentId: number;
  userId: number;
  position?: number;
  wins: number;
  losses: number;
  user?: User;
}

export interface Quest {
  id: number;
  type: 'DAILY' | 'WEEKLY';
  title: string;
  description: string;
  target: number;
  rewardCoin: number;
  rewardXp: number;
  rewardSkin?: number;
  isActive: boolean;
  progress?: QuestProgress;
}

export interface QuestProgress {
  id: number;
  questId: number;
  userId: number;
  progress: number;
  completed: boolean;
  completedAt?: string;
}

export interface CityBuilding {
  id: number;
  userId: number;
  buildingType: string;
  level: number;
  incomePerHour: number;
  lastCollected?: string;
}

export interface Subscription {
  id: number;
  userId: number;
  plan: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface AcademyArticle {
  id: number;
  title: string;
  content: string;
  authorId?: number;
  isPaid: boolean;
  priceCoin: number;
  priceCrypto?: string;
  category?: string;
  isPublished: boolean;
  views: number;
  createdAt: string;
}

export interface Skin {
  id: number;
  name: string;
  type: 'BOARD' | 'DICE';
  previewUrl: string;
  isDefault: boolean;
  priceCoin: number;
  isActive: boolean;
}

export interface GameHistory {
  id: number;
  roomId: string;
  mode: 'SHORT' | 'LONG';
  whitePlayerId: number;
  blackPlayerId: number;
  winnerId?: number;
  duration?: number;
  createdAt: string;
  whitePlayer?: User;
  blackPlayer?: User;
}

