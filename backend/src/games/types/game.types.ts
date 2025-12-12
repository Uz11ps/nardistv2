export enum GameMode {
  SHORT = 'SHORT', // Короткие нарды
  LONG = 'LONG', // Длинные нарды
}

export enum GameStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  ABANDONED = 'ABANDONED',
}

export enum PlayerColor {
  WHITE = 'WHITE',
  BLACK = 'BLACK',
}

export interface DiceRoll {
  die1: number;
  die2: number;
  timestamp: number;
}

export interface Move {
  from: number;
  to: number;
  timestamp: number;
}

export interface GameState {
  mode: GameMode;
  status: GameStatus;
  currentPlayer: PlayerColor;
  board: number[]; // 24 позиции на доске
  bar: {
    white: number;
    black: number;
  };
  home: {
    white: number;
    black: number;
  };
  dice: DiceRoll | null;
  moves: Move[];
  turnStartTime: number;
  turnTimeLimit: number; // в секундах
  players: {
    white: number | null; // userId
    black: number | null;
  };
  diceRollsCount?: {
    white: number; // Количество бросков белого игрока
    black: number; // Количество бросков черного игрока
  };
}

