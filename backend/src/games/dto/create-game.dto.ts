import { IsEnum, IsOptional, IsString } from 'class-validator';
import { GameType } from '@prisma/client';

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
