// Игровая логика для нард (короткие и длинные)

export type PlayerColor = 'WHITE' | 'BLACK';
export type GameMode = 'SHORT' | 'LONG';
export type GameStatus = 'WAITING' | 'IN_PROGRESS' | 'FINISHED' | 'ABANDONED';

export interface DiceRoll {
  die1: number;
  die2: number;
}

export interface Move {
  from: number;
  to: number;
}

export interface GameState {
  mode: GameMode;
  status: GameStatus;
  currentPlayer: PlayerColor;
  board: number[]; // 24 позиции: положительные = черные, отрицательные = белые
  bar: { white: number; black: number };
  home: { white: number; black: number };
  dice: DiceRoll | null;
  moves: Move[];
  players: { white: number | null; black: number | null };
}

/**
 * Начальная расстановка для коротких нард
 * Правильная расстановка согласно классическим правилам:
 * Белые: позиция 1 (2), позиция 12 (5), позиция 17 (3), позиция 19 (5)
 * Черные: позиция 6 (5), позиция 8 (3), позиция 13 (5), позиция 24 (2)
 */
function getInitialBoardShort(): number[] {
  const board = new Array(24).fill(0);
  
  // Белые фишки (отрицательные значения, двигаются от 24 к 1)
  board[0] = -2;   // Позиция 1: 2 белые фишки
  board[11] = -5;  // Позиция 12: 5 белых фишек
  board[16] = -3;  // Позиция 17: 3 белые фишки
  board[18] = -5;  // Позиция 19: 5 белых фишек
  
  // Черные фишки (положительные значения, двигаются от 1 к 24)
  board[5] = 5;    // Позиция 6: 5 черных фишек
  board[7] = 3;    // Позиция 8: 3 черные фишки
  board[12] = 5;   // Позиция 13: 5 черных фишек
  board[23] = 2;   // Позиция 24: 2 черные фишки
  
  return board;
}

/**
 * Начальная расстановка для длинных нард
 * Правильная расстановка согласно классическим правилам:
 * Белые: все 15 фишек на позиции 1 (индекс 0) - пирамидкой
 * Черные: все 15 фишек на позиции 24 (индекс 23) - пирамидкой
 */
function getInitialBoardLong(): number[] {
  const board = new Array(24).fill(0);
  
  // Все 15 белых фишек на позиции 1 (индекс 0) - пирамидкой
  board[0] = -15;
  
  // Все 15 черных фишек на позиции 24 (индекс 23) - пирамидкой
  // ВАЖНО: позиция 24 = индекс 23 (последняя позиция на доске)
  board[23] = 15;
  
  // Убеждаемся, что позиция 13 (индекс 12) пустая
  board[12] = 0;
  
  return board;
}

/**
 * Инициализация игры
 */
export function initializeGame(mode: GameMode, whitePlayerId: number, blackPlayerId: number): GameState {
  const board = mode === 'SHORT' ? getInitialBoardShort() : getInitialBoardLong();
  
  // Проверяем правильность начальной расстановки
  const whiteCount = board.reduce((sum, val) => sum + (val < 0 ? Math.abs(val) : 0), 0);
  const blackCount = board.reduce((sum, val) => sum + (val > 0 ? val : 0), 0);
  
  if (whiteCount !== 15 || blackCount !== 15) {
    console.error(`❌ Неправильная начальная расстановка: белые=${whiteCount}, черные=${blackCount}`);
    console.log('Доска:', board);
  } else {
    console.log(`✅ Начальная расстановка правильная (${mode}): белые=${whiteCount}, черные=${blackCount}`);
    if (mode === 'SHORT') {
      console.log('Позиции фишек:', {
        'Белые': {
          'Позиция 1 (индекс 0)': board[0],
          'Позиция 12 (индекс 11)': board[11],
          'Позиция 17 (индекс 16)': board[16],
          'Позиция 19 (индекс 18)': board[18],
        },
        'Черные': {
          'Позиция 6 (индекс 5)': board[5],
          'Позиция 8 (индекс 7)': board[7],
          'Позиция 13 (индекс 12)': board[12],
          'Позиция 24 (индекс 23)': board[23],
        },
      });
    }
  }
  
  return {
    mode,
    status: 'IN_PROGRESS', // Игра начинается сразу
    currentPlayer: 'WHITE',
    board: [...board], // Создаем копию массива
    bar: { white: 0, black: 0 },
    home: { white: 0, black: 0 },
    dice: null,
    moves: [],
    players: {
      white: whitePlayerId,
      black: blackPlayerId,
    },
  };
}

/**
 * Бросок кубиков
 */
export function rollDice(): DiceRoll {
  return {
    die1: Math.floor(Math.random() * 6) + 1,
    die2: Math.floor(Math.random() * 6) + 1,
  };
}

/**
 * Проверка валидности хода для коротких нард
 */
export function isValidMoveShort(
  state: GameState,
  from: number,
  to: number,
  dieValue: number,
): boolean {
  const { board, bar, currentPlayer } = state;
  const isWhite = currentPlayer === 'WHITE';
  const direction = isWhite ? -1 : 1;
  
  // Ход с бара
  if (from === -1) {
    const barCount = isWhite ? bar.white : bar.black;
    if (barCount === 0) return false;
    
    const targetPos = isWhite ? dieValue - 1 : 24 - dieValue;
    if (targetPos < 0 || targetPos > 23) return false;
    
    // Нельзя ставить на точку с двумя и более фишками противника
    if (board[targetPos] * direction > 0 && Math.abs(board[targetPos]) >= 2) {
      return false;
    }
    
    return true;
  }
  
  // Проверка наличия фишки на исходной позиции
  if (board[from] * direction >= 0) return false;
  
  // Проверка расстояния
  // Для белых: движение от больших индексов к меньшим (from > to)
  // Для черных: движение от меньших индексов к большим (to > from)
  const distance = isWhite ? from - to : to - from;
  if (distance <= 0 || distance !== dieValue) return false;
  
  // Проверка границ
  if (to < 0 || to > 23) return false;
  
  // Нельзя ставить на точку с двумя и более фишками противника
  if (board[to] * direction > 0 && Math.abs(board[to]) >= 2) {
    return false;
  }
  
  return true;
}

/**
 * Проверка валидности хода для длинных нард
 * В длинных нардах оба игрока двигаются в одном направлении по кругу
 * Белые: от позиции 1 (0) к позиции 24 (23) - движение вперед по индексам
 * Черные: от позиции 24 (23) к позиции 1 (0) - движение по кругу (23→0→1→...)
 */
export function isValidMoveLong(
  state: GameState,
  from: number,
  to: number,
  dieValue: number,
): boolean {
  const { board, bar, currentPlayer } = state;
  const isWhite = currentPlayer === 'WHITE';
  const direction = isWhite ? -1 : 1;
  
  // В длинных нардах нельзя бить фишки
  // Ход с бара
  if (from === -1) {
    const barCount = isWhite ? bar.white : bar.black;
    if (barCount === 0) return false;
    
    // Для белых: с бара на позицию dieValue (индекс dieValue - 1)
    // Для черных: с бара на позицию 25 - dieValue (индекс 24 - dieValue)
    const targetPos = isWhite ? dieValue - 1 : 24 - dieValue;
    if (targetPos < 0 || targetPos > 23) return false;
    
    // Нельзя ставить на точку с фишками противника
    if (board[targetPos] * direction > 0) {
      return false;
    }
    
    return true;
  }
  
  // Проверка наличия фишки на исходной позиции
  // Для белых: board[from] < 0 (отрицательные значения)
  // Для черных: board[from] > 0 (положительные значения)
  const hasMyChecker = isWhite ? board[from] < 0 : board[from] > 0;
  if (!hasMyChecker) {
    console.log('❌ Нет фишки на исходной позиции', { 
      from, 
      position: from + 1,
      boardValue: board[from], 
      isWhite, 
      direction,
      expected: isWhite ? 'negative (white)' : 'positive (black)',
      actual: board[from] < 0 ? 'negative' : board[from] > 0 ? 'positive' : 'zero'
    });
    return false;
  }
  
  // Проверка расстояния для длинных нард
  // В длинных нардах движение идет по кругу в одном направлении
  // Белые: движение от меньших индексов к большим (0→1→2→...→23)
  // Черные: движение от больших индексов к меньшим (23→22→21→...→0)
  let distance: number;
  if (isWhite) {
    // Белые: движение вперед (to должно быть больше from)
    if (to <= from) {
      console.log('❌ Неправильное направление для белых', { from, to, dieValue });
      return false;
    }
    distance = to - from;
  } else {
    // Черные: движение назад по индексам (from должно быть больше to)
    if (from <= to) {
      console.log('❌ Неправильное направление для черных', { from, to, dieValue });
      return false;
    }
    distance = from - to;
  }
  
  if (distance !== dieValue) {
    console.log('❌ Неправильное расстояние', { distance, dieValue, from, to, isWhite });
    return false;
  }
  
  // Проверка границ
  if (to < 0 || to > 23) {
    console.log('❌ Выход за границы', { to });
    return false;
  }
  
  // Нельзя ставить на точку с фишками противника
  // В длинных нардах: board[to] > 0 означает черные фишки (для белых это противник)
  // board[to] < 0 означает белые фишки (для черных это противник)
  const hasOpponentChecker = isWhite ? board[to] > 0 : board[to] < 0;
  if (hasOpponentChecker) {
    console.log('❌ На точке есть фишки противника', { 
      to, 
      boardValue: board[to], 
      isWhite,
      hasOpponentChecker
    });
    return false;
  }
  
  console.log('✅ Ход валиден для длинных нард', { from, to, dieValue, distance, isWhite });
  return true;
}

/**
 * Выполнение хода
 */
export function makeMove(
  state: GameState,
  from: number,
  to: number,
  dieValue: number,
): GameState {
  const { board, bar, currentPlayer, mode } = state;
  const isWhite = currentPlayer === 'WHITE';
  const direction = isWhite ? -1 : 1;
  const isValid = mode === 'SHORT' 
    ? isValidMoveShort(state, from, to, dieValue)
    : isValidMoveLong(state, from, to, dieValue);
  
  if (!isValid) {
    throw new Error('Invalid move');
  }
  
  const newState: GameState = {
    ...state,
    board: [...board],
    bar: { ...bar },
    home: { ...state.home },
    moves: [...state.moves, { from, to }],
  };
  
  // Ход с бара
  if (from === -1) {
    const targetPos = isWhite ? dieValue - 1 : 24 - dieValue;
    
    // Бой фишки (только в коротких нардах)
    if (mode === 'SHORT' && board[targetPos] * direction > 0 && Math.abs(board[targetPos]) === 1) {
      newState.bar[isWhite ? 'black' : 'white']++;
      newState.board[targetPos] = 0;
    }
    
    // В длинных нардах нельзя ставить на точку с фишками противника
    if (mode === 'LONG' && board[targetPos] * direction > 0) {
      throw new Error('Cannot place checker on opponent\'s point in long backgammon');
    }
    
    // Добавляем фишку на целевую позицию
    if (isWhite) {
      newState.board[targetPos] = (newState.board[targetPos] || 0) - 1;
    } else {
      newState.board[targetPos] = (newState.board[targetPos] || 0) + 1;
    }
    // Убираем фишку с бара
    newState.bar[isWhite ? 'white' : 'black']--;
    
    console.log('✅ Ход с бара:', {
      targetPos,
      newBoardValue: newState.board[targetPos],
      barWhite: newState.bar.white,
      barBlack: newState.bar.black,
    });
  } else {
    // Обычный ход
    // Бой фишки (только в коротких нардах)
    if (mode === 'SHORT' && board[to] * direction > 0 && Math.abs(board[to]) === 1) {
      newState.bar[isWhite ? 'black' : 'white']++;
      newState.board[to] = 0;
    }
    
    // В длинных нардах нельзя ставить на точку с фишками противника
    if (mode === 'LONG' && board[to] * direction > 0) {
      throw new Error('Cannot place checker on opponent\'s point in long backgammon');
    }
    
    // Перемещаем фишку
    // Убираем фишку с исходной позиции
    // Для белых: board[from] отрицательное (например, -15), нужно увеличить до -14
    // Для черных: board[from] положительное (например, 15), нужно уменьшить до 14
    if (isWhite) {
      // Белые: увеличиваем отрицательное значение (уменьшаем абсолютное значение)
      newState.board[from] = board[from] + 1; // -15 + 1 = -14
    } else {
      // Черные: уменьшаем положительное значение
      newState.board[from] = board[from] - 1; // 15 - 1 = 14
    }
    
    // Добавляем фишку на целевую позицию
    if (isWhite) {
      // Белые: добавляем отрицательное значение
      newState.board[to] = (board[to] || 0) - 1;
    } else {
      // Черные: добавляем положительное значение
      newState.board[to] = (board[to] || 0) + 1;
    }
    
    console.log('✅ Перемещение фишки:', {
      from,
      to,
      isWhite,
      direction,
      boardFromBefore: board[from],
      boardToBefore: board[to],
      boardFromAfter: newState.board[from],
      boardToAfter: newState.board[to],
    });
  }
  
  return newState;
}

/**
 * Проверка возможности вывода фишек (bear off)
 */
export function canBearOff(state: GameState): boolean {
  const { board, bar, currentPlayer } = state;
  const isWhite = currentPlayer === 'WHITE';
  
  // Нельзя выводить, если есть фишки на баре
  const barCount = isWhite ? bar.white : bar.black;
  if (barCount > 0) return false;
  
  // Проверяем, все ли фишки в доме
  const homeStart = isWhite ? 0 : 18;
  const homeEnd = isWhite ? 6 : 24;
  
  for (let i = 0; i < 24; i++) {
    if (i < homeStart || i >= homeEnd) {
      const count = isWhite ? -board[i] : board[i];
      if (count > 0) return false;
    }
  }
  
  return true;
}

/**
 * Вывод фишки с доски
 */
export function bearOff(state: GameState, from: number, dieValue: number): GameState {
  const { board, currentPlayer, home } = state;
  const isWhite = currentPlayer === 'WHITE';
  const direction = isWhite ? -1 : 1;
  
  if (!canBearOff(state)) {
    throw new Error('Cannot bear off');
  }
  
  const homeStart = isWhite ? 0 : 18;
  const homeEnd = isWhite ? 6 : 24;
  
  // Проверка, что фишка в доме
  if (from < homeStart || from >= homeEnd) {
    throw new Error('Checker not in home');
  }
  
  // Проверка наличия фишки
  if (board[from] * direction >= 0) {
    throw new Error('No checker at position');
  }
  
  // Проверка возможности вывода
  const distance = isWhite ? from + 1 : 24 - from;
  if (distance > dieValue) {
    // Можно вывести только если нет фишек дальше
    for (let i = from + (isWhite ? 1 : -1); isWhite ? i < homeEnd : i >= homeStart; isWhite ? i++ : i--) {
      if (board[i] * direction < 0) {
        throw new Error('Cannot bear off - checkers ahead');
      }
    }
  }
  
  const newState: GameState = {
    ...state,
    board: [...board],
    home: { ...home },
    moves: [...state.moves, { from, to: -1 }],
  };
  
  newState.board[from] += direction;
  newState.home[isWhite ? 'white' : 'black']++;
  
  return newState;
}

/**
 * Проверка окончания игры
 */
export function checkGameEnd(state: GameState): PlayerColor | null {
  if (state.home.white === 15) return 'WHITE';
  if (state.home.black === 15) return 'BLACK';
  return null;
}

/**
 * Получить все возможные ходы
 */
export function getPossibleMoves(
  state: GameState,
  dice: DiceRoll,
): Array<{ from: number; to: number; dieValue: number }> {
  const { board, bar, currentPlayer, mode } = state;
  const isWhite = currentPlayer === 'WHITE';
  const barCount = isWhite ? bar.white : bar.black;
  const moves: Array<{ from: number; to: number; dieValue: number }> = [];
  
  const isValid = mode === 'SHORT' ? isValidMoveShort : isValidMoveLong;
  
  // Если есть фишки на баре, можно ходить только с бара
  if (barCount > 0) {
    for (const dieValue of [dice.die1, dice.die2]) {
      const targetPos = isWhite ? dieValue - 1 : 24 - dieValue;
      if (targetPos >= 0 && targetPos < 24 && isValid(state, -1, targetPos, dieValue)) {
        moves.push({ from: -1, to: targetPos, dieValue });
      }
    }
    return moves;
  }
  
  // Проверка возможности вывода фишек
  if (canBearOff(state)) {
    const homeStart = isWhite ? 0 : 18;
    const homeEnd = isWhite ? 6 : 24;
    
    for (const dieValue of [dice.die1, dice.die2]) {
      for (let from = homeStart; from < homeEnd; from++) {
        const hasMyChecker = isWhite ? board[from] < 0 : board[from] > 0;
        if (hasMyChecker) {
          try {
            bearOff(state, from, dieValue);
            moves.push({ from, to: -1, dieValue });
          } catch {
            // Нельзя вывести с этой позиции
          }
        }
      }
    }
    
    if (moves.length > 0) return moves;
  }
  
  // Обычные ходы
  for (const dieValue of [dice.die1, dice.die2]) {
    for (let from = 0; from < 24; from++) {
      // Проверяем наличие фишек игрока на позиции
      const hasMyChecker = isWhite ? board[from] < 0 : board[from] > 0;
      if (!hasMyChecker) continue;
      
      let to: number;
      if (mode === 'LONG') {
        // В длинных нардах:
        // Белые: движение от меньших индексов к большим (0→23)
        // Черные: движение от больших индексов к меньшим (23→0)
        if (isWhite) {
          to = from + dieValue;
        } else {
          to = from - dieValue;
        }
      } else {
        // В коротких нардах:
        // Белые: движение от больших индексов к меньшим
        // Черные: движение от меньших индексов к большим
        to = isWhite ? from - dieValue : from + dieValue;
      }
      
      if (to >= 0 && to < 24 && isValid(state, from, to, dieValue)) {
        moves.push({ from, to, dieValue });
      }
    }
  }
  
  console.log('🎯 getPossibleMoves:', {
    mode,
    currentPlayer,
    isWhite,
    dice: { die1: dice.die1, die2: dice.die2 },
    movesCount: moves.length,
    moves: moves.slice(0, 5), // Первые 5 ходов для отладки
  });
  
  return moves;
}

