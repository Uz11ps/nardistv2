import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum GameType {
  SHORT_BACKGAMMON = 'SHORT_BACKGAMMON',
  LONG_BACKGAMMON = 'LONG_BACKGAMMON',
}

export class CreateGameDto {
  @IsEnum(GameType)
  type: GameType;

  @IsOptional()
  @IsString()
  opponentId?: string;

  @IsOptional()
  @IsString()
  botDifficulty?: string;
}
