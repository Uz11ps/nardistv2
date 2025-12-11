import { Injectable } from '@nestjs/common';
import { GameMode, GameState, GameStatus, PlayerColor, DiceRoll, Move } from '../types/game.types';

@Injectable()
export class GameLogicService {
  /**
   * Инициализация начального состояния игры
   */
  initializeGame(mode: GameMode, whitePlayerId: number, blackPlayerId: number): GameState {
    const board = this.getInitialBoard(mode);
    
    return {
      mode,
      status: GameStatus.WAITING,
      currentPlayer: PlayerColor.WHITE,
      board,
      bar: {
        white: 0,
        black: 0,
      },
      home: {
        white: 0,
        black: 0,
      },
      dice: null,
      moves: [],
      turnStartTime: Date.now(),
      turnTimeLimit: 60, // 60 секунд на ход
      players: {
        white: whitePlayerId,
        black: blackPlayerId,
      },
    };
  }

  /**
   * Получить начальную доску в зависимости от режима
   */
  private getInitialBoard(mode: GameMode): number[] {
    const board = new Array(24).fill(0);

    if (mode === GameMode.SHORT) {
      // Короткие нарды: начальная расстановка
      board[0] = -2; // Белые
      board[11] = -5;
      board[16] = -3;
      board[18] = -5;

      board[5] = 3; // Черные
      board[7] = 5;
      board[12] = 5;
      board[23] = 2;
    } else {
      // Длинные нарды: начальная расстановка
      board[0] = -15; // Все белые фишки в начале
      board[23] = 15; // Все черные фишки в конце
    }

    return board;
  }

  /**
   * Бросок кубиков
   */
  rollDice(): DiceRoll {
    return {
      die1: Math.floor(Math.random() * 6) + 1,
      die2: Math.floor(Math.random() * 6) + 1,
      timestamp: Date.now(),
    };
  }

  /**
   * Проверка валидности хода для коротких нард
   */
  isValidMoveShort(
    state: GameState,
    from: number,
    to: number,
    dieValue: number,
  ): boolean {
    const { board, bar, currentPlayer } = state;
    const isWhite = currentPlayer === PlayerColor.WHITE;

    // Если есть фишки на баре, нужно сначала их вывести
    const barCount = isWhite ? bar.white : bar.black;
    if (barCount > 0) {
      if (from !== -1) return false; // -1 означает бар
      const targetPos = isWhite ? dieValue - 1 : 24 - dieValue;
      if (board[targetPos] > 0 && board[targetPos] > 1) return false; // Блокировано
      return true;
    }

    // Проверка направления движения
    const direction = isWhite ? 1 : -1;
    const distance = Math.abs(to - from);
    
    if ((to - from) * direction <= 0) return false; // Неправильное направление
    if (distance !== dieValue) return false; // Неправильное расстояние

    // Проверка наличия фишки на позиции
    if (board[from] * direction >= 0) return false; // Нет своей фишки

    // Проверка блокировки
    if (board[to] * direction < 0 && Math.abs(board[to]) > 1) return false; // Блокировано

    return true;
  }

  /**
   * Проверка валидности хода для длинных нард
   */
  isValidMoveLong(
    state: GameState,
    from: number,
    to: number,
    dieValue: number,
  ): boolean {
    const { board, currentPlayer } = state;
    const isWhite = currentPlayer === PlayerColor.WHITE;

    // В длинных нардах нельзя бить фишки
    if (board[to] * (isWhite ? -1 : 1) > 0) return false;

    // Проверка направления и расстояния
    const direction = isWhite ? 1 : -1;
    const distance = Math.abs(to - from);
    
    if ((to - from) * direction <= 0) return false;
    if (distance !== dieValue) return false;

    // Проверка наличия фишки
    if (board[from] * direction >= 0) return false;

    return true;
  }

  /**
   * Выполнение хода
   */
  makeMove(state: GameState, from: number, to: number, dieValue: number): GameState {
    const { board, bar, currentPlayer } = state;
    const isWhite = currentPlayer === PlayerColor.WHITE;
    const direction = isWhite ? 1 : -1;

    const newState = { ...state };
    newState.board = [...board];
    newState.bar = { ...bar };
    newState.moves = [...state.moves];

    // Если ход с бара
    if (from === -1) {
      const barCount = isWhite ? bar.white : bar.black;
      if (barCount > 0) {
        const targetPos = isWhite ? dieValue - 1 : 24 - dieValue;
        
        // Если на позиции есть фишка противника (одиночная)
        if (board[targetPos] * direction > 0 && Math.abs(board[targetPos]) === 1) {
          // Бьем фишку
          newState.bar[isWhite ? 'black' : 'white']++;
          newState.board[targetPos] = 0;
        }

        newState.board[targetPos] -= direction;
        newState.bar[isWhite ? 'white' : 'black']--;
      }
    } else {
      // Обычный ход
      const targetPos = to;

      // Если на позиции есть фишка противника (одиночная) - бьем
      if (board[targetPos] * direction > 0 && Math.abs(board[targetPos]) === 1) {
        newState.bar[isWhite ? 'black' : 'white']++;
        newState.board[targetPos] = 0;
      }

      // Перемещаем фишку
      newState.board[from] += direction;
      newState.board[targetPos] -= direction;

      // Добавляем ход в историю
      newState.moves.push({
        from,
        to: targetPos,
        timestamp: Date.now(),
      });
    }

    return newState;
  }

  /**
   * Проверка возможности вывода фишек (bear off)
   */
  canBearOff(state: GameState, player: PlayerColor): boolean {
    const { board, bar } = state;
    const isWhite = player === PlayerColor.WHITE;
    const barCount = isWhite ? bar.white : bar.black;

    // Нельзя выводить, если есть фишки на баре
    if (barCount > 0) return false;

    // Проверяем, все ли фишки в доме
    const homeStart = isWhite ? 0 : 18;
    const homeEnd = isWhite ? 6 : 24;

    for (let i = 0; i < homeStart; i++) {
      if (board[i] * (isWhite ? -1 : 1) < 0) return false;
    }
    for (let i = homeEnd; i < 24; i++) {
      if (board[i] * (isWhite ? -1 : 1) < 0) return false;
    }

    return true;
  }

  /**
   * Проверка окончания игры
   */
  checkGameEnd(state: GameState): { finished: boolean; winner?: PlayerColor } {
    const { home } = state;

    if (home.white === 15) {
      return { finished: true, winner: PlayerColor.WHITE };
    }

    if (home.black === 15) {
      return { finished: true, winner: PlayerColor.BLACK };
    }

    return { finished: false };
  }

  /**
   * Переключение хода
   */
  switchTurn(state: GameState): GameState {
    return {
      ...state,
      currentPlayer: state.currentPlayer === PlayerColor.WHITE 
        ? PlayerColor.BLACK 
        : PlayerColor.WHITE,
      dice: null,
      turnStartTime: Date.now(),
    };
  }
}

