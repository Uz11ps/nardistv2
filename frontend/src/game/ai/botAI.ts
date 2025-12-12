// Простой AI бот для игры в нарды

import type { GameState, DiceRoll, PlayerColor } from '../logic/gameLogic';
import { getPossibleMoves, makeMove, canBearOff, bearOff } from '../logic/gameLogic';

export interface BotMove {
  from: number;
  to: number;
  dieValue: number;
}

/**
 * Простой AI бот с базовой стратегией
 */
export class BackgammonBot {
  private difficulty: 'easy' | 'medium' | 'hard';
  
  constructor(difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    this.difficulty = difficulty;
  }
  
  /**
   * Выбор лучшего хода
   */
  chooseMove(state: GameState, dice: DiceRoll): BotMove | null {
    const possibleMoves = getPossibleMoves(state, dice);
    
    if (possibleMoves.length === 0) {
      return null;
    }
    
    // Если можно вывести фишки - приоритет
    if (canBearOff(state)) {
      const bearOffMoves = possibleMoves.filter(m => m.to === -1);
      if (bearOffMoves.length > 0) {
        return this.selectBestBearOffMove(state, bearOffMoves, dice);
      }
    }
    
    // Выбор хода в зависимости от сложности
    switch (this.difficulty) {
      case 'easy':
        return this.chooseRandomMove(possibleMoves);
      case 'medium':
        return this.chooseMediumMove(state, possibleMoves, dice);
      case 'hard':
        return this.chooseHardMove(state, possibleMoves, dice);
      default:
        return this.chooseRandomMove(possibleMoves);
    }
  }
  
  /**
   * Случайный ход (легкий уровень)
   */
  private chooseRandomMove(moves: BotMove[]): BotMove {
    return moves[Math.floor(Math.random() * moves.length)];
  }
  
  /**
   * Средний уровень - базовая стратегия
   */
  private chooseMediumMove(state: GameState, moves: BotMove[], dice: DiceRoll): BotMove {
    let bestMove: BotMove | null = null;
    let bestScore = -Infinity;
    
    for (const move of moves) {
      const score = this.evaluateMove(state, move, dice);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    console.log('🤖 Бот выбирает ход:', {
      move: bestMove,
      score: bestScore,
      totalMoves: moves.length,
    });
    
    return bestMove || moves[0];
  }
  
  /**
   * Сложный уровень - улучшенная стратегия
   */
  private chooseHardMove(state: GameState, moves: BotMove[], dice: DiceRoll): BotMove {
    // Более сложная оценка с учетом позиции
    let bestMove: BotMove | null = null;
    let bestScore = -Infinity;
    
    for (const move of moves) {
      const score = this.evaluateMoveAdvanced(state, move, dice);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove || moves[0];
  }
  
  /**
   * Оценка хода (базовая)
   */
  private evaluateMove(state: GameState, move: BotMove, dice: DiceRoll): number {
    const { board, bar, currentPlayer, mode } = state;
    const isWhite = currentPlayer === 'WHITE';
    let score = 0;
    
    // Приоритет: убрать фишки с бара
    if (move.from === -1) {
      score += 100;
    }
    
    // Приоритет: вывести фишки
    if (move.to === -1) {
      score += 150;
    }
    
    // Для длинных нард - простая стратегия: двигаться вперед
    if (mode === 'LONG') {
      // Приоритет: двигаться вперед как можно дальше
      if (isWhite) {
        // Белые: движение от меньших индексов к большим (0→23)
        score += move.to * 5; // Чем больше индекс, тем лучше
      } else {
        // Черные: движение от больших индексов к меньшим (23→0)
        score += (23 - move.to) * 5; // Чем меньше индекс, тем лучше
      }
      
      // Приоритет: не оставлять фишки одни в начале
      const sourceCount = Math.abs(board[move.from] || 0);
      if (move.from !== -1) {
        if (isWhite && move.from === 0 && sourceCount > 1) {
          // Белые: можно убирать фишки с позиции 1, если их много
          score += 10;
        } else if (!isWhite && move.from === 23 && sourceCount > 1) {
          // Черные: можно убирать фишки с позиции 24, если их много
          score += 10;
        }
      }
      
      return score;
    }
    
    // Для коротких нард - более сложная стратегия
    // Приоритет: занять важные позиции (6, 7, 8 для белых, 17, 16, 15 для черных)
    const importantPositions = isWhite ? [5, 6, 7] : [17, 16, 15];
    if (importantPositions.includes(move.to)) {
      score += 30;
    }
    
    // Приоритет: создать блоки (2+ фишки на точке)
    const targetCount = Math.abs(board[move.to] || 0);
    if (targetCount >= 1 && move.to !== -1) {
      score += 20;
    }
    
    // Штраф: оставлять фишки одни (блокируемые)
    const sourceCount = Math.abs(board[move.from] || 0);
    if (sourceCount === 1 && move.from !== -1) {
      score -= 10;
    }
    
    // Приоритет: двигаться вперед
    const progress = isWhite ? (move.from - move.to) : (move.to - move.from);
    score += progress * 2;
    
    return score;
  }
  
  /**
   * Продвинутая оценка хода
   */
  private evaluateMoveAdvanced(state: GameState, move: BotMove, dice: DiceRoll): number {
    let score = this.evaluateMove(state, move, dice);
    
    // Дополнительные факторы для сложного уровня
    const { board, currentPlayer } = state;
    const isWhite = currentPlayer === 'WHITE';
    
    // Приоритет: создавать призмы (6 фишек подряд)
    if (move.to !== -1 && move.from !== -1) {
      const consecutive = this.countConsecutive(board, move.to, isWhite);
      score += consecutive * 5;
    }
    
    // Приоритет: блокировать противника
    const opponentHomeStart = isWhite ? 18 : 0;
    const opponentHomeEnd = isWhite ? 24 : 6;
    if (move.to >= opponentHomeStart && move.to < opponentHomeEnd) {
      score += 25;
    }
    
    return score;
  }
  
  /**
   * Подсчет последовательных фишек
   */
  private countConsecutive(board: number[], position: number, isWhite: boolean): number {
    let count = 0;
    const direction = isWhite ? -1 : 1;
    
    for (let i = position; i >= 0 && i < 24; i += direction) {
      if (board[i] * (isWhite ? -1 : 1) < 0) {
        count++;
      } else {
        break;
      }
    }
    
    return count;
  }
  
  /**
   * Выбор лучшего хода для вывода фишек
   */
  private selectBestBearOffMove(
    state: GameState,
    moves: BotMove[],
    dice: DiceRoll,
  ): BotMove {
    // Выбираем ход, который выводит фишку с наибольшей позиции
    let bestMove: BotMove | null = null;
    let maxFrom = -1;
    
    for (const move of moves) {
      if (move.from > maxFrom) {
        maxFrom = move.from;
        bestMove = move;
      }
    }
    
    return bestMove || moves[0];
  }
  
  /**
   * Выполнить ход бота
   */
  async makeBotMove(state: GameState, dice: DiceRoll): Promise<GameState> {
    const move = this.chooseMove(state, dice);
    
    if (!move) {
      return state; // Нет возможных ходов
    }
    
    // Небольшая задержка для реалистичности
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    if (move.to === -1) {
      // Вывод фишки
      return bearOff(state, move.from, move.dieValue);
    } else {
      // Обычный ход
      return makeMove(state, move.from, move.to, move.dieValue);
    }
  }
}

