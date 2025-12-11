import { Injectable } from '@nestjs/common';
import { GameState, GameMode, PlayerColor, DiceRoll } from '../types/game.types';
import { GameLogicService } from './game-logic.service';

interface BotMove {
  from: number;
  to: number;
  dieValue: number;
}

@Injectable()
export class BotService {
  constructor(private readonly gameLogic: GameLogicService) {}

  /**
   * Получить ход бота
   */
  getBotMove(state: GameState): BotMove | null {
    if (!state.dice) {
      return null;
    }

    const { die1, die2 } = state.dice;
    const isWhite = state.currentPlayer === PlayerColor.WHITE;
    const mode = state.mode;

    // Получаем все возможные ходы
    const possibleMoves = this.getAllPossibleMoves(state, die1, die2);

    if (possibleMoves.length === 0) {
      return null;
    }

    // Простая эвристика: выбираем лучший ход
    // Приоритеты:
    // 1. Бить фишки противника
    // 2. Занимать важные позиции
    // 3. Выводить фишки с бара
    // 4. Двигаться к дому

    const scoredMoves = possibleMoves.map(move => ({
      ...move,
      score: this.evaluateMove(state, move),
    }));

    // Сортируем по очкам и берем лучший
    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0];
  }

  /**
   * Получить все возможные ходы
   */
  private getAllPossibleMoves(state: GameState, die1: number, die2: number): BotMove[] {
    const moves: BotMove[] = [];
    const { board, bar, currentPlayer, mode } = state;
    const isWhite = currentPlayer === PlayerColor.WHITE;
    const barCount = isWhite ? bar.white : bar.black;

    // Если есть фишки на баре, нужно их вывести
    if (barCount > 0) {
      if (mode === GameMode.SHORT) {
        // В коротких нардах можно выводить с бара
        const target1 = isWhite ? die1 - 1 : 24 - die1;
        const target2 = isWhite ? die2 - 1 : 24 - die2;

        if (this.gameLogic.isValidMoveShort(state, -1, target1, die1)) {
          moves.push({ from: -1, to: target1, dieValue: die1 });
        }
        if (this.gameLogic.isValidMoveShort(state, -1, target2, die2)) {
          moves.push({ from: -1, to: target2, dieValue: die2 });
        }
      }
      return moves;
    }

    // Проверяем возможность вывода фишек (bear off)
    if (this.gameLogic.canBearOff(state, currentPlayer)) {
      // Логика вывода фишек
      for (let i = 0; i < 24; i++) {
        const direction = isWhite ? -1 : 1;
        if (board[i] * direction < 0) {
          // Есть фишка на позиции
          const homeStart = isWhite ? 0 : 18;
          const homeEnd = isWhite ? 6 : 24;
          
          if (i >= homeStart && i < homeEnd) {
            // Фишка в доме, можно выводить
            const distance1 = isWhite ? i + 1 : 24 - i;
            const distance2 = isWhite ? i + 1 : 24 - i;

            if (distance1 <= die1) {
              moves.push({ from: i, to: -2, dieValue: die1 }); // -2 означает вывод
            }
            if (distance2 <= die2) {
              moves.push({ from: i, to: -2, dieValue: die2 });
            }
          }
        }
      }
    }

    // Обычные ходы
    for (let from = 0; from < 24; from++) {
      const direction = isWhite ? -1 : 1;
      if (board[from] * direction < 0) {
        // Есть фишка на позиции
        const to1 = from + (isWhite ? die1 : -die1);
        const to2 = from + (isWhite ? die2 : -die2);

        if (to1 >= 0 && to1 < 24) {
          const isValid = mode === GameMode.SHORT
            ? this.gameLogic.isValidMoveShort(state, from, to1, die1)
            : this.gameLogic.isValidMoveLong(state, from, to1, die1);
          
          if (isValid) {
            moves.push({ from, to: to1, dieValue: die1 });
          }
        }

        if (to2 >= 0 && to2 < 24) {
          const isValid = mode === GameMode.SHORT
            ? this.gameLogic.isValidMoveShort(state, from, to2, die2)
            : this.gameLogic.isValidMoveLong(state, from, to2, die2);
          
          if (isValid) {
            moves.push({ from, to: to2, dieValue: die2 });
          }
        }
      }
    }

    return moves;
  }

  /**
   * Оценить ход (эвристика)
   */
  private evaluateMove(state: GameState, move: BotMove): number {
    let score = 0;
    const { board, currentPlayer } = state;
    const isWhite = currentPlayer === PlayerColor.WHITE;
    const direction = isWhite ? -1 : 1;

    // Бить фишку противника (+100)
    if (move.to >= 0 && move.to < 24) {
      if (board[move.to] * direction > 0 && Math.abs(board[move.to]) === 1) {
        score += 100;
      }
    }

    // Занимать важные позиции
    const importantPositions = [5, 7, 12, 18, 23];
    if (importantPositions.includes(move.to)) {
      score += 20;
    }

    // Двигаться к дому
    const homeStart = isWhite ? 0 : 18;
    const homeEnd = isWhite ? 6 : 24;
    if (move.to >= homeStart && move.to < homeEnd) {
      score += 30;
    }

    // Выводить фишки с бара
    if (move.from === -1) {
      score += 50;
    }

    // Выводить фишки (bear off)
    if (move.to === -2) {
      score += 40;
    }

    // Избегать одиночных фишек в опасных позициях
    if (move.from >= 0 && move.from < 24) {
      if (Math.abs(board[move.from]) === 1) {
        const dangerPositions = [0, 5, 7, 12, 18, 23];
        if (dangerPositions.includes(move.from)) {
          score += 15;
        }
      }
    }

    return score;
  }

  /**
   * Бот делает ход (асинхронно, с задержкой для реалистичности)
   */
  async makeBotMove(state: GameState): Promise<BotMove | null> {
    // Имитируем размышление бота (1-3 секунды)
    const delay = 1000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, delay));

    return this.getBotMove(state);
  }
}

