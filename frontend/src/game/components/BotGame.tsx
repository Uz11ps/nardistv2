import { useState, useEffect, useCallback } from 'react';
import { Card, Button, NotificationModal } from '../../components/ui';
import { LocalGameBoard } from './LocalGameBoard';
import type { GameState, DiceRoll, PlayerColor } from '../logic/gameLogic';
import {
  initializeGame,
  rollDice,
  makeMove,
  bearOff,
  canBearOff,
  checkGameEnd,
  getPossibleMoves,
  isValidMoveShort,
  isValidMoveLong,
} from '../logic/gameLogic';
import { BackgammonBot } from '../ai/botAI';
import './BotGame.css';

interface BotGameProps {
  mode: 'SHORT' | 'LONG';
  onGameEnd?: (winner: PlayerColor) => void;
  onExit?: () => void;
}

export const BotGame = ({ mode, onGameEnd, onExit }: BotGameProps) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isRolling, setIsRolling] = useState(false);
  const [usedDice, setUsedDice] = useState<number[]>([]);
  const [selectedDie, setSelectedDie] = useState<number | null>(null);
  const [notification, setNotification] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [bot, setBot] = useState<BackgammonBot | null>(null);
  const [isBotThinking, setIsBotThinking] = useState(false);

  // Инициализация игры
  useEffect(() => {
    console.log('🎮 Инициализация игры, режим:', mode);
    const newGame = initializeGame(mode, 1, -1); // 1 = игрок, -1 = бот
    
    // Проверка начальной расстановки
    const whiteCount = newGame.board.reduce((sum, val) => sum + (val < 0 ? Math.abs(val) : 0), 0);
    const blackCount = newGame.board.reduce((sum, val) => sum + (val > 0 ? val : 0), 0);
    
    console.log('📊 Начальная расстановка:', {
      mode,
      whiteCount,
      blackCount,
      board: newGame.board.map((val, idx) => val !== 0 ? `[${idx + 1}]=${val}` : null).filter(Boolean),
    });
    
    // Для длинных нард проверяем правильность позиций
    if (mode === 'LONG') {
      console.log('🔍 Проверка длинных нард:');
      console.log('  Белые на позиции 1 (индекс 0):', newGame.board[0]);
      console.log('  Черные на позиции 24 (индекс 23):', newGame.board[23]);
      if (newGame.board[0] !== -15 || newGame.board[23] !== 15) {
        console.error('❌ ОШИБКА: Неправильная начальная расстановка для длинных нард!');
      } else {
        console.log('✅ Начальная расстановка правильная!');
      }
    }
    
    setGameState(newGame);
    setIsPlayerTurn(true);
    setUsedDice([]);
    setSelectedDie(null);
    setBot(new BackgammonBot('medium'));
  }, [mode]);

  // Обработка хода бота
  useEffect(() => {
    console.log('🤖 useEffect бота вызван:', {
      hasGameState: !!gameState,
      hasBot: !!bot,
      isPlayerTurn,
      isRolling,
      isBotThinking,
      currentPlayer: gameState?.currentPlayer,
      hasDice: !!gameState?.dice,
    });

    if (!gameState || !bot) {
      console.log('🤖 Бот не готов:', { gameState: !!gameState, bot: !!bot });
      return;
    }

    if (isPlayerTurn || isRolling || isBotThinking) {
      console.log('🤖 Не ход бота:', { isPlayerTurn, isRolling, isBotThinking });
      return;
    }

    const playerIsWhite = gameState.players.white === 1;
    const botIsBlack = gameState.players.black === -1;
    const isBotTurn = gameState.currentPlayer === (playerIsWhite ? 'BLACK' : 'WHITE');
    
    console.log('🤖 Проверка хода бота:', {
      currentPlayer: gameState.currentPlayer,
      playerIsWhite,
      botIsBlack,
      isBotTurn,
      hasDice: !!gameState.dice,
    });
    
    if (!isBotTurn) {
      console.log('🤖 Не ход бота, текущий игрок:', gameState.currentPlayer);
      return;
    }

    console.log('🤖 Ход бота! Начинаем...');

    // Бот должен бросить кубики или сделать ход
    if (!gameState.dice) {
      // Бот бросает кубики
      console.log('🤖 Бот бросает кубики...');
      setIsRolling(true);
      setTimeout(() => {
        const dice = rollDice();
        console.log('🤖 Бот бросил кубики:', dice);
        setGameState(prev => {
          if (!prev) return null;
          console.log('🤖 Обновляем состояние с кубиками');
          return { ...prev, dice };
        });
        setIsRolling(false);
      }, 1000);
    } else {
      // Бот делает ход
      setIsBotThinking(true);
      
      // Бот делает все возможные ходы с кубиками
      const makeBotMoves = async (currentState: GameState, dice: DiceRoll): Promise<GameState> => {
        let state = currentState;
        const usedDiceValues: number[] = [];
        let moveCount = 0;
        const maxMoves = 4; // Максимум 4 хода (при дубле)
        
        console.log('🤖 Бот начинает ход:', {
          currentPlayer: state.currentPlayer,
          dice: { die1: dice.die1, die2: dice.die2 },
          isDouble: dice.die1 === dice.die2,
        });
        
        while (moveCount < maxMoves) {
          const possibleMoves = getPossibleMoves(state, dice);
          console.log(`🤖 Возможные ходы бота (ход ${moveCount + 1}):`, possibleMoves.length);
          
          if (possibleMoves.length === 0) {
            console.log('🤖 Нет возможных ходов для бота');
            break;
          }
          
          const move = bot.chooseMove(state, dice);
          if (!move) {
            console.log('🤖 Бот не может выбрать ход');
            break;
          }
          
          console.log(`🤖 Бот делает ход ${moveCount + 1}:`, {
            from: move.from === -1 ? 'бар' : move.from + 1,
            to: move.to === -1 ? 'вывод' : move.to + 1,
            dieValue: move.dieValue,
          });
          
          try {
            if (move.to === -1) {
              state = bearOff(state, move.from, move.dieValue);
            } else {
              state = makeMove(state, move.from, move.to, move.dieValue);
            }
            usedDiceValues.push(move.dieValue);
            moveCount++;
            
            // Обновляем состояние для визуализации каждого хода
            console.log(`🎨 Обновляем визуализацию хода ${moveCount}:`, {
              from: move.from === -1 ? 'бар' : `позиция ${move.from + 1}`,
              to: move.to === -1 ? 'вывод' : `позиция ${move.to + 1}`,
              boardBefore: currentState.board[move.from],
              boardAfter: state.board[move.to],
            });
            
            // Обновляем состояние с новым объектом для принудительной перерисовки
            setGameState({ 
              ...state,
              board: [...state.board], // Создаем новый массив для принудительной перерисовки
            });
            
            // Увеличиваем задержку для лучшей визуализации
            await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 секунды между ходами
            
            // Проверка окончания игры
            const winner = checkGameEnd(state);
            if (winner) {
              console.log('🤖 Игра окончена, победитель:', winner);
              return { ...state, status: 'FINISHED' };
            }
            
            // Если использованы оба кубика (и не дубль), выходим
            if (dice.die1 !== dice.die2 && usedDiceValues.includes(dice.die1) && usedDiceValues.includes(dice.die2)) {
              console.log('🤖 Бот использовал оба кубика');
              break;
            }
            
            // Если дубль и использованы все 4 хода
            if (dice.die1 === dice.die2 && moveCount >= 4) {
              console.log('🤖 Бот использовал все 4 хода дубля');
              break;
            }
          } catch (error) {
            console.error('❌ Ошибка хода бота:', error);
            break;
          }
        }
        
        console.log('🤖 Бот завершил ход, всего ходов:', moveCount);
        return state;
      };
      
      makeBotMoves(gameState, gameState.dice)
        .then((newState) => {
          const winner = checkGameEnd(newState);
          if (winner) {
            setGameState({ ...newState, status: 'FINISHED' });
            setIsBotThinking(false);
            if (onGameEnd) {
              onGameEnd(winner);
            }
            setNotification({
              title: 'Игра окончена',
              message: winner === (gameState.players.white === 1 ? 'WHITE' : 'BLACK')
                ? 'Вы победили! 🎉'
                : 'Бот победил! 🤖',
              type: winner === (gameState.players.white === 1 ? 'WHITE' : 'BLACK') ? 'success' : 'error',
            });
            return;
          }

          // Передаем ход игроку
          setGameState({
            ...newState,
            currentPlayer: newState.currentPlayer === 'WHITE' ? 'BLACK' : 'WHITE',
            dice: null,
          });
          setIsPlayerTurn(true);
          setUsedDice([]);
          setIsBotThinking(false);
        })
        .catch((error) => {
          console.error('❌ Ошибка ходов бота:', error);
          setIsBotThinking(false);
          // Передаем ход игроку даже при ошибке
          setGameState(prev => prev ? {
            ...prev,
            currentPlayer: prev.currentPlayer === 'WHITE' ? 'BLACK' : 'WHITE',
            dice: null,
          } : null);
          setIsPlayerTurn(true);
        });
    }
  }, [gameState, bot, isPlayerTurn, isRolling, isBotThinking, onGameEnd]);

  const handleRollDice = () => {
    if (!gameState || !isPlayerTurn || gameState.dice) return;

    setIsRolling(true);
    setTimeout(() => {
      const dice = rollDice();
      setGameState(prev => prev ? { ...prev, dice } : null);
      setIsRolling(false);
      setUsedDice([]);
      setSelectedDie(null);
    }, 500);
  };

  const handleMakeMove = useCallback((from: number, to: number, dieValue: number) => {
    if (!gameState || !isPlayerTurn || !gameState.dice) {
      setNotification({
        title: 'Не ваш ход',
        message: 'Дождитесь своего хода',
        type: 'info',
      });
      return;
    }

    // Проверка использования кубика
    if (usedDice.includes(dieValue)) {
      setNotification({
        title: 'Кубик уже использован',
        message: 'Этот кубик уже был использован',
        type: 'error',
      });
      return;
    }

    const isValid = mode === 'SHORT'
      ? isValidMoveShort(gameState, from, to, dieValue)
      : isValidMoveLong(gameState, from, to, dieValue);

    if (!isValid) {
      setNotification({
        title: 'Неверный ход',
        message: 'Вы не можете сделать этот ход. Проверьте правила игры.',
        type: 'error',
      });
      return;
    }

    try {
      let newState: GameState;
      
      if (to === -1) {
        // Вывод фишки
        if (!canBearOff(gameState)) {
          setNotification({
            title: 'Неверный ход',
            message: 'Вы не можете вывести фишки сейчас. Все фишки должны быть в доме.',
            type: 'error',
          });
          return;
        }
        newState = bearOff(gameState, from, dieValue);
      } else {
        // Обычный ход
        newState = makeMove(gameState, from, to, dieValue);
      }

      // Проверка окончания игры
      const winner = checkGameEnd(newState);
      if (winner) {
        setGameState({ ...newState, status: 'FINISHED' });
        if (onGameEnd) {
          onGameEnd(winner);
        }
        setNotification({
          title: 'Игра окончена',
          message: winner === (gameState.players.white === 1 ? 'WHITE' : 'BLACK')
            ? 'Вы победили! 🎉'
            : 'Бот победил! 🤖',
          type: winner === (gameState.players.white === 1 ? 'WHITE' : 'BLACK') ? 'success' : 'error',
        });
        return;
      }

      // Добавляем использованный кубик
      const newUsedDice = [...usedDice, dieValue];
      setUsedDice(newUsedDice);

      // Проверяем, использованы ли все кубики
      const { die1, die2 } = gameState.dice;
      const allDiceUsed = newUsedDice.includes(die1) && newUsedDice.includes(die2);

      if (allDiceUsed) {
        // Передаем ход боту
        console.log('✅ Игрок завершил ход, передача хода боту');
        const nextPlayer = newState.currentPlayer === 'WHITE' ? 'BLACK' : 'WHITE';
        console.log('🔄 Смена игрока:', { from: newState.currentPlayer, to: nextPlayer });
        setGameState({
          ...newState,
          currentPlayer: nextPlayer,
          dice: null,
        });
        setIsPlayerTurn(false);
        setUsedDice([]);
        setSelectedDie(null);
      } else {
        // Продолжаем ход
        setGameState(newState);
      }
    } catch (error: any) {
      setNotification({
        title: 'Ошибка',
        message: error.message || 'Не удалось выполнить ход',
        type: 'error',
      });
    }
  }, [gameState, isPlayerTurn, usedDice, mode, onGameEnd]);

  const handleEndTurn = () => {
    if (!gameState || !isPlayerTurn) return;

    setGameState(prev => prev ? {
      ...prev,
      currentPlayer: prev.currentPlayer === 'WHITE' ? 'BLACK' : 'WHITE',
      dice: null,
    } : null);
    setIsPlayerTurn(false);
    setUsedDice([]);
    setSelectedDie(null);
  };

  if (!gameState) {
    return <div>Загрузка...</div>;
  }

  const isWhite = gameState.players.white === 1;
  const isMyTurn = isPlayerTurn && gameState.currentPlayer === (isWhite ? 'WHITE' : 'BLACK');
  const gameEnded = gameState.status === 'FINISHED';

  return (
    <div className="bot-game">
      <div className="bot-game__header">
        <Card>
          <div className="bot-game__info">
            <div className="bot-game__players">
              <span className={isWhite ? 'active' : ''}>Вы (Белые)</span>
              <span className="vs">VS</span>
              <span className={!isWhite ? 'active' : ''}>Бот (Черные)</span>
            </div>
            <div className="bot-game__status">
              {gameEnded ? (
                <span>Игра окончена</span>
              ) : isBotThinking ? (
                <span>🤖 Бот думает...</span>
              ) : isMyTurn ? (
                <span>Ваш ход</span>
              ) : (
                <span>Ход бота</span>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="bot-game__board">
        <LocalGameBoard
          mode={mode}
          gameState={gameState}
          isMyTurn={isMyTurn && !gameEnded}
          isWhite={isWhite}
          onMove={handleMakeMove}
          selectedDie={selectedDie}
        />
      </div>

      <div className="bot-game__controls">
        <Card>
          {gameState.dice ? (
            <div className="bot-game__dice">
              <div className="dice-container">
                <button
                  className={`dice-button ${usedDice.includes(gameState.dice.die1) ? 'used' : ''} ${selectedDie === gameState.dice.die1 ? 'selected' : ''}`}
                  onClick={() => setSelectedDie(selectedDie === gameState.dice.die1 ? null : gameState.dice!.die1)}
                  disabled={usedDice.includes(gameState.dice.die1) || !isMyTurn || gameEnded}
                >
                  {gameState.dice.die1}
                </button>
                <button
                  className={`dice-button ${usedDice.includes(gameState.dice.die2) ? 'used' : ''} ${selectedDie === gameState.dice.die2 ? 'selected' : ''}`}
                  onClick={() => setSelectedDie(selectedDie === gameState.dice.die2 ? null : gameState.dice!.die2)}
                  disabled={usedDice.includes(gameState.dice.die2) || !isMyTurn || gameEnded}
                >
                  {gameState.dice.die2}
                </button>
              </div>
              {isMyTurn && !gameEnded && (
                <div className="dice-hint">
                  {usedDice.length > 0 && (
                    <div>Использовано: {usedDice.join(', ')}</div>
                  )}
                  {selectedDie && (
                    <div>Выбран кубик: {selectedDie}</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bot-game__dice">
              {isMyTurn && !gameEnded ? (
                <Button
                  onClick={handleRollDice}
                  variant="primary"
                  fullWidth
                  disabled={isRolling}
                  icon="dice"
                  loading={isRolling}
                >
                  {isRolling ? 'Бросаем...' : 'Бросить кубики'}
                </Button>
              ) : (
                <div className="waiting-message">
                  {isBotThinking ? '🤖 Бот думает...' : 'Ожидание хода соперника...'}
                </div>
              )}
            </div>
          )}

          {isMyTurn && gameState.dice && !gameEnded && (
            <Button onClick={handleEndTurn} variant="outline" fullWidth>
              Завершить ход
            </Button>
          )}

          <Button onClick={onExit} variant="danger" fullWidth>
            Выйти из игры
          </Button>
        </Card>
      </div>

      {notification && (
        <NotificationModal
          title={notification.title}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

