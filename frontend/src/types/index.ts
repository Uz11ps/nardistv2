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
  // Новые характеристики экономики
  power: number; // Сила для ношения тяжелых скинов
  powerMax: number;
  stats: {
    economy: number; // Ветка Экономика (снижает комиссию)
    energy: number; // Ветка Энергия (улучшает реген)
    lives: number; // Ветка Жизни (улучшает реген)
    power: number; // Ветка Сила (увеличивает лимит)
  };
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
  type: 'BOARD' | 'DICE' | 'CHECKERS' | 'CUP' | 'FRAME';
  previewUrl: string;
  isDefault: boolean;
  priceCoin: number;
  isActive: boolean;
}

// Предмет в инвентаре игрока
export interface InventoryItem {
  id: number;
  skinId: number;
  userId: number;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
  durability: number;
  durabilityMax: number;
  weight: number; // Вес предмета
  isEquipped: boolean;
  skin?: Skin;
}

// Ресурсы
export interface Resource {
  id: number;
  userId: number;
  type: 'WOOD' | 'STONE' | 'MARBLE' | 'BONE' | 'PLASTIC' | 'METAL' | 'LEATHER' | 'FABRIC';
  amount: number;
}

// Район города
export interface District {
  id: number;
  name: string;
  description: string;
  type: 'COURTS' | 'CLUBS' | 'WORKSHOPS' | 'FACTORIES' | 'WORKSHOPS_CUPS' | 'SCHOOL' | 'ARENA';
  icon: string;
  clanId?: number; // Клан, контролирующий район
  clan?: Clan;
  commissionRate: number; // Комиссия с игр (5%)
}

// Предприятие
export interface Business {
  id: number;
  userId: number;
  districtId: number;
  type: 'COURT_TABLE' | 'BOARD_WORKSHOP' | 'DICE_FACTORY' | 'CUPS_WORKSHOP' | 'CLUB' | 'SCHOOL' | 'ARENA';
  level: number;
  incomePerHour: number; // NAR в час
  productionPerHour?: number; // Ресурсов/предметов в час
  storageLimit?: number; // Лимит склада
  maintenanceCost?: number; // Стоимость обслуживания в NAR/час
  lastCollected?: string;
  district?: District;
}

// Клан
export interface Clan {
  id: number;
  name: string;
  description?: string;
  leaderId: number;
  leader?: User;
  members: ClanMember[];
  treasury: number; // NAR в казне
  districts: District[];
  createdAt: string;
}

export interface ClanMember {
  id: number;
  clanId: number;
  userId: number;
  role: 'LEADER' | 'OFFICER' | 'MEMBER';
  joinedAt: string;
  user?: User;
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

